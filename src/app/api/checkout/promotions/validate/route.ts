import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

interface ValidatePromotionRequest {
  promotion_code?: string;
  promotion_id?: string;
  cart_items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    price_usd: number;
    collection_id?: string;
    categories?: string[];
  }>;
  customer_id?: string;
  customer_tier?: string;
  customer_segments?: string[];
  subtotal_usd: number;
  currency?: string;
  is_first_order?: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  
  try {
    const body: ValidatePromotionRequest = await request.json();
    const { 
      promotion_code, 
      promotion_id,
      cart_items = [], 
      customer_id, 
      customer_tier,
      customer_segments = [],
      subtotal_usd = 0,
      currency = 'USD',
      is_first_order = false
    } = body;
    
    if (!promotion_code && !promotion_id) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion code or ID is required' 
      }, { status: 400 });
    }
    
    if (cart_items.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Cart is empty' 
      }, { status: 400 });
    }
    
    // Fetch promotion
    let query = supabase.from('promotions').select('*');
    
    if (promotion_id) {
      query = query.eq('id', promotion_id);
    } else {
      query = query.eq('slug', promotion_code);
    }
    
    const { data: promotion, error: promoError } = await query.single();
    
    if (promoError || !promotion) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion not found' 
      }, { status: 404 });
    }
    
    // Check if promotion is active
    if (!promotion.is_active || promotion.status !== 'active') {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion is not active' 
      });
    }
    
    // Check date validity
    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = promotion.valid_until ? new Date(promotion.valid_until) : null;
    
    if (validFrom > now) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion has not started yet' 
      });
    }
    
    if (validUntil && validUntil < now) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion has expired' 
      });
    }
    
    // Check usage limit
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion usage limit reached' 
      });
    }
    
    // Check customer-specific usage if customer_id provided
    if (customer_id && promotion.usage_limit_per_customer) {
      const { data: usage } = await supabase
        .from('promotion_usages')
        .select('count')
        .eq('promotion_id', promotion.id)
        .eq('customer_id', customer_id)
        .single();
        
      if (usage && usage.count >= promotion.usage_limit_per_customer) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Customer has reached usage limit for this promotion' 
        });
      }
    }
    
    // Check conditions
    const conditions = promotion.conditions || {};
    const actions = promotion.actions || {};
    
    // Check min order value
    if (conditions.min_order_value && subtotal_usd < conditions.min_order_value) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order value of ${conditions.min_order_value} ${currency} required` 
      });
    }
    
    // Check max order value
    if (conditions.max_order_value && subtotal_usd > conditions.max_order_value) {
      return NextResponse.json({ 
        valid: false, 
        error: `Maximum order value of ${conditions.max_order_value} ${currency} exceeded` 
      });
    }
    
    // Check first order only
    if (conditions.first_order_only && !is_first_order) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Promotion valid for first order only' 
      });
    }
    
    // Check customer segments
    if (conditions.customer_segments && conditions.customer_segments.length > 0) {
      const hasSegment = conditions.customer_segments.some((seg: string) => 
        customer_segments.includes(seg)
      );
      if (!hasSegment) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Promotion not available for your customer segment' 
        });
      }
    }
    
    // Check customer tiers
    if (conditions.customer_tiers && conditions.customer_tiers.length > 0 && customer_tier) {
      if (!conditions.customer_tiers.includes(customer_tier)) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Promotion not available for your tier' 
        });
      }
    }
    
    // Check specific customers
    if (conditions.specific_customers && conditions.specific_customers.length > 0 && customer_id) {
      if (!conditions.specific_customers.includes(customer_id)) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Promotion not available for your account' 
        });
      }
    }
    
    // Validate cart items against conditions
    const applicableItems = cart_items.filter(item => {
      // Check excluded products
      if (conditions.excluded_products && conditions.excluded_products.includes(item.product_id)) {
        return false;
      }
      
      // Check excluded collections
      if (conditions.excluded_collections && item.collection_id && conditions.excluded_collections.includes(item.collection_id)) {
        return false;
      }
      
      // Check included collections
      if (conditions.collections && conditions.collections.length > 0) {
        if (!item.collection_id || !conditions.collections.includes(item.collection_id)) {
          return false;
        }
      }
      
      // Check included products
      if (conditions.products && conditions.products.length > 0) {
        if (!conditions.products.includes(item.product_id)) {
          return false;
        }
      }
      
      // Check included variants
      if (conditions.product_variants && conditions.product_variants.length > 0) {
        if (!item.variant_id || !conditions.product_variants.includes(item.variant_id)) {
          return false;
        }
      }
      
      // Check categories
      if (conditions.categories && conditions.categories.length > 0) {
        const hasCategory = item.categories?.some((cat: string) => conditions.categories.includes(cat));
        if (!hasCategory) {
          return false;
        }
      }
      
      // Check min quantity
      if (conditions.min_quantity && item.quantity < conditions.min_quantity) {
        return false;
      }
      
      return true;
    });
    
    if (applicableItems.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'No eligible items in cart for this promotion' 
      });
    }
    
    // Calculate discount based on action type
    const applicableSubtotal = applicableItems.reduce((sum, item) => sum + item.price_usd * item.quantity, 0);
    let discount_amount = 0;
    let free_shipping = false;
    let free_products: Array<{ product_id: string; quantity: number }> = [];
    let buy_x_get_y: Array<{ buy_qty: number; get_qty: number; discount_type: string; discount_value: number }> = [];
    
    switch (actions.type) {
      case 'percentage_off': {
        const percentage = actions.value || 0;
        const maxDiscount = actions.max_discount || null;
        discount_amount = applicableSubtotal * (percentage / 100);
        if (maxDiscount && discount_amount > maxDiscount) {
          discount_amount = maxDiscount;
        }
        break;
      }
      
      case 'fixed_off': {
        discount_amount = actions.value || 0;
        if (discount_amount > applicableSubtotal) {
          discount_amount = applicableSubtotal;
        }
        break;
      }
      
      case 'free_shipping': {
        free_shipping = true;
        break;
      }
      
      case 'free_product': {
        if (actions.free_product_id) {
          free_products.push({
            product_id: actions.free_product_id,
            quantity: actions.free_product_quantity || 1
          });
        }
        break;
      }
      
      case 'buy_x_get_y': {
        const buyQty = actions.buy_quantity || 1;
        const getQty = actions.get_quantity || 1;
        const discountType = actions.get_discount_type || 'percentage';
        const discountValue = actions.get_discount_value || 100;
        
        buy_x_get_y.push({
          buy_qty: buyQty,
          get_qty: getQty,
          discount_type: discountType,
          discount_value: discountValue
        });
        
        // Calculate how many times the offer applies
        const totalQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const offerCount = Math.floor(totalQty / buyQty);
        
        if (discountType === 'percentage') {
          // Apply percentage discount to the cheapest items
          const sortedItems = [...applicableItems].sort((a, b) => a.price_usd - b.price_usd);
          let remainingGetQty = offerCount * getQty;
          
          for (const item of sortedItems) {
            const applyQty = Math.min(item.quantity, remainingGetQty);
            if (applyQty > 0) {
              discount_amount += item.price_usd * applyQty * (discountValue / 100);
              remainingGetQty -= applyQty;
            }
            if (remainingGetQty <= 0) break;
          }
        } else if (discountType === 'fixed') {
          discount_amount = offerCount * getQty * discountValue;
        } else if (discountType === 'free') {
          // 100% discount on get_qty items
          const sortedItems = [...applicableItems].sort((a, b) => a.price_usd - b.price_usd);
          let remainingGetQty = offerCount * getQty;
          
          for (const item of sortedItems) {
            const applyQty = Math.min(item.quantity, remainingGetQty);
            if (applyQty > 0) {
              discount_amount += item.price_usd * applyQty;
              remainingGetQty -= applyQty;
            }
            if (remainingGetQty <= 0) break;
          }
        }
        break;
      }
      
      case 'bundle_discount': {
        if (actions.bundle_products && actions.bundle_products.length > 0) {
          // Check if all bundle products are in cart
          const hasAllBundleProducts = actions.bundle_products.every((bundleProductId: string) => 
            applicableItems.some(item => item.product_id === bundleProductId)
          );
          
          if (hasAllBundleProducts) {
            if (actions.type === 'percentage_off') {
              discount_amount = applicableSubtotal * ((actions.value || 0) / 100);
            } else if (actions.type === 'fixed_off') {
              discount_amount = actions.value || 0;
            }
          }
        }
        break;
      }
    }
    
    // Cap discount at applicable subtotal
    if (discount_amount > applicableSubtotal) {
      discount_amount = applicableSubtotal;
    }
    
    // Return validation result
    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        slug: promotion.slug,
        type: promotion.type,
        priority: promotion.priority,
        can_stack: promotion.can_stack,
      },
      discount: {
        amount: Math.round(discount_amount * 100) / 100,
        currency,
        free_shipping,
        free_products,
        buy_x_get_y,
      },
      applicable_items: applicableItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_usd: item.price_usd,
      })),
    });
    
  } catch (error) {
    console.error('Promotion validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}