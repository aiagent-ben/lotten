'use server';

import { createServiceClient } from '@/lib/db/client';

const supabase = createServiceClient();

export interface Configuration {
  finish?: string;
  dimensions?: {
    width_mm: number;
    depth_mm: number;
    height_mm: number;
  };
  hardware?: string;
  upholstery?: string;
}

export interface PriceCalculationInput {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    configuration: Configuration;
  }>;
  customerTier: 'retail' | 'trade' | 'project' | 'vip';
  shippingAddress: {
    country: string;
    state?: string;
    postal_code?: string;
  };
  discountCode?: string;
}

export interface PriceCalculationOutput {
  lineItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    basePrice: number;
    configModifiers: {
      finish: number;
      dimensions: number;
      hardware: number;
      upholstery: number;
    };
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: { code: string; amount: number; type: 'percent' | 'fixed' } | null;
  tax: number;
  shipping: number;
  total: number;
  leadTimeWeeks: number;
  stockAvailable: boolean;
}

export async function calculateQuotePrice(input: PriceCalculationInput): Promise<PriceCalculationOutput> {
  const lineItems: PriceCalculationOutput['lineItems'] = [];
  let subtotal = 0;
  let maxLeadTime = 0;
  let allStockAvailable = true;
  let maxDimensionMultiplier = 1;

  for (const item of input.items) {
    // Get product base price and config schema
    const { data: product } = await supabase
      .from('products')
      .select('id, price_usd, lead_time_weeks, stock_available, configuration_schema, standard_dimensions, finish_multipliers')
      .eq('id', item.productId)
      .single();

    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    if (product.stock_available < item.quantity) {
      allStockAvailable = false;
    }

    if (product.lead_time_weeks > maxLeadTime) {
      maxLeadTime = product.lead_time_weeks;
    }

    // Get variant price if applicable
    let basePrice = product.price_usd;
    if (item.variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price_usd')
        .eq('id', item.variantId)
        .single();
      if (variant) basePrice = variant.price_usd;
    }

    // Calculate configuration modifiers
    const configModifiers = await calculateConfigModifiers(
      item.productId,
      item.configuration,
      product.standard_dimensions,
      product.finish_multipliers
    );

    // Apply dimension modifier (uses volume ratio with 0.7 exponent)
    const dimensionMultiplier = configModifiers.dimensions;
    maxDimensionMultiplier = Math.max(maxDimensionMultiplier, dimensionMultiplier);

    // Calculate unit price: base * finish * dimension + hardware + upholstery
    // Using additive for hardware/upholstery, multiplicative for finish/dimension
    const finishMultiplier = 1 + configModifiers.finish;
    const hardwareAdd = configModifiers.hardware;
    const upholsteryAdd = configModifiers.upholstery;

    const unitPrice = Math.round(
      (basePrice * finishMultiplier * dimensionMultiplier) + hardwareAdd + upholsteryAdd
    );

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lineItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      basePrice,
      configModifiers: {
        finish: configModifiers.finish,
        dimensions: configModifiers.dimensions - 1, // Return as multiplier delta
        hardware: hardwareAdd,
        upholstery: upholsteryAdd,
      },
      unitPrice,
      lineTotal,
    });
  }

  // Apply tier discount
  let discountAmount = 0;
  const tierDiscountPercent = await getTierDiscountPercent(input.customerTier);
  if (tierDiscountPercent > 0) {
    discountAmount = subtotal * (tierDiscountPercent / 100);
  }

  // Apply discount code if provided
  let discountCodeInfo = null;
  if (input.discountCode) {
    const { data: discount } = await supabase
      .from('discount_codes')
      .select('type, value')
      .eq('code', input.discountCode)
      .eq('is_active', true)
      .single();

    if (discount) {
      if (discount.type === 'percent') {
        discountAmount += (subtotal - discountAmount) * (discount.value / 100);
      } else {
        discountAmount += discount.value;
      }
      discountCodeInfo = { code: input.discountCode, amount: discountAmount, type: discount.type };
    }
  }

  const discountedSubtotal = subtotal - discountAmount;

  // Calculate tax based on jurisdiction
  const { taxRate, taxJurisdiction } = await getTaxRate(input.shippingAddress);
  const tax = Math.round(discountedSubtotal * taxRate);

  // Calculate shipping
  const shipping = await calculateShipping(input.shippingAddress, lineItems);

  const total = discountedSubtotal + tax + shipping;

  return {
    lineItems,
    subtotal,
    discount: discountCodeInfo || { code: 'tier', amount: discountAmount, type: 'percent' },
    tax,
    shipping,
    total,
    leadTimeWeeks: maxLeadTime,
    stockAvailable: allStockAvailable,
  };
}

async function calculateConfigModifiers(
  productId: string,
  config: Configuration,
  standardDimensions?: { width_mm: number; depth_mm: number; height_mm: number },
  finishMultipliers?: Record<string, number>
): Promise<{ finish: number; dimensions: number; hardware: number; upholstery: number }> {
  let finishMod = 0;
  let dimensionMod = 1;
  let hardwareMod = 0;
  let upholsteryMod = 0;

  // Finish modifier (multiplicative)
  if (config.finish && finishMultipliers && finishMultipliers[config.finish] !== undefined) {
    finishMod = finishMultipliers[config.finish] - 1;
  }

  // Dimensions modifier (volume ratio ^ 0.7)
  if (config.dimensions && standardDimensions) {
    const stdVolume = standardDimensions.width_mm * standardDimensions.depth_mm * standardDimensions.height_mm;
    const customVolume = config.dimensions.width_mm * config.dimensions.depth_mm * config.dimensions.height_mm;
    
    if (stdVolume > 0 && customVolume > 0) {
      dimensionMod = Math.pow(customVolume / stdVolume, 0.7);
      // Minimum 0.7x (no discount below 70% of standard price)
      dimensionMod = Math.max(dimensionMod, 0.7);
    }
  }

  // Hardware modifier (additive)
  if (config.hardware) {
    const hardwarePrices: Record<string, number> = {
      'Black Matte': 0,
      'Brushed Brass': 80,
      'Antique Bronze': 120,
      'Stainless Steel': 150,
    };
    hardwareMod = hardwarePrices[config.hardware] || 0;
  }

  // Upholstery modifier (additive per seat)
  if (config.upholstery && config.upholstery !== 'None') {
    const upholsteryPrices: Record<string, number> = {
      'Linen Natural': 300,
      'Linen Grey': 300,
      'Velvet Emerald': 500,
      'Leather Tan': 1200,
    };
    // Assume 1 seat for non-sofa products, would need seat count from product
    const seatCount = 1; // TODO: get from product type
    upholsteryMod = (upholsteryPrices[config.upholstery] || 0) * seatCount;
  }

  return { finish: finishMod, dimensions: dimensionMod, hardware: hardwareMod, upholstery: upholsteryMod };
}

async function getTierDiscountPercent(tier: 'retail' | 'trade' | 'project' | 'vip'): Promise<number> {
  const { data: tierData } = await supabase
    .from('customer_tiers')
    .select('discount_percent')
    .eq('name', tier)
    .single();
  
  return tierData?.discount_percent || 0;
}

async function getTaxRate(address: { country: string; state?: string; postal_code?: string }): Promise<{ taxRate: number; taxJurisdiction: string }> {
  // Malaysia SST: 6% for services, 10% for goods
  // Different states may have different rates
  if (address.country === 'MY') {
    const state = address.state?.toUpperCase();
    // East Malaysia (Sabah, Sarawak) may have different rates
    if (state === 'SABAH' || state === 'SARAWAK') {
      return { taxRate: 0.06, taxJurisdiction: `MY-${state}` }; // 6% SST
    }
    return { taxRate: 0.10, taxJurisdiction: `MY-${state || 'PNG'}` }; // 10% SST for goods
  }
  
  // Singapore
  if (address.country === 'SG') {
    return { taxRate: 0.08, taxJurisdiction: 'SG' }; // 8% GST
  }
  
  // Default
  return { taxRate: 0, taxJurisdiction: 'INT' };
}

async function calculateShipping(
  address: { country: string; state?: string; postal_code?: string },
  lineItems: Array<{ quantity: number; productId: string }>
): Promise<number> {
  // Base shipping by country
  const baseShipping: Record<string, number> = {
    'MY': 150, // Malaysia
    'SG': 300, // Singapore
    'ID': 500, // Indonesia
    'TH': 400, // Thailand
  };
  
  let shipping = baseShipping[address.country] || 500;
  
  // Add oversize surcharge for large items
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 3) {
    shipping *= 1.5;
  }
  
  // East Malaysia surcharge
  if (address.country === 'MY' && (address.state === 'Sabah' || address.state === 'Sarawak')) {
    shipping += 200;
  }
  
  return Math.round(shipping);
}

export async function getProductConfigurationSchema(productId: string) {
  const { data: schema } = await supabase
    .from('product_configuration_schemas')
    .select('schema')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  
  return schema?.schema || {};
}

export async function validateConfiguration(productId: string, config: Configuration): Promise<{ valid: boolean; errors: string[] }> {
  const schema = await getProductConfigurationSchema(productId);
  const errors: string[] = [];
  
  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }
  
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in config) || !config[field as keyof Configuration]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  if (schema.properties && typeof schema.properties === 'object') {
    const props = schema.properties as Record<string, unknown>;
    
    // Check enum values
    for (const [key, prop] of Object.entries(props)) {
      if (prop && typeof prop === 'object' && 'enum' in prop) {
        const enumValues = (prop as { enum: string[] }).enum;
        const configValue = config[key as keyof Configuration];
        if (configValue && !enumValues.includes(configValue as string)) {
          errors.push(`Invalid value for ${key}: ${configValue}. Must be one of: ${enumValues.join(', ')}`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}