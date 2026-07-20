import { getAllActiveProducts, getProductById, getProductBySlug, getCollectionBySlug } from '@/lib/data/products';

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: 'same_collection' | 'co_purchased' | 'similar_price' | 'recently_viewed';
  reasonDetail: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  slug: string;
  price_usd: number;
  stock_available: number;
  images: { url: string; alt_text: string | null; is_primary: boolean }[];
  collection_id: string;
  is_new: boolean;
  is_bestseller: boolean;
  article_no: string;
}

/**
 * Get complementary products - same collection, different category
 * e.g., sofa → coffee table, dining table → chairs
 */
export async function getComplementaryProducts(
  productId: string,
  limit = 4
): Promise<ProductRecommendation[]> {
  const product = await getProductById(productId);
  if (!product) return [];

  const allProducts = await getAllActiveProducts();
  
  // Find products in same collection but different "category" (we infer from name/description)
  const sameCollection = allProducts.filter(
    p => p.collection_id === product.collection_id && p.id !== productId
  );

  // Try to find different "types" within the collection
  // We infer type from product name keywords
  const currentType = inferProductType(product.name);
  const differentTypes = sameCollection.filter(p => 
    inferProductType(p.name) !== currentType
  );

  const results = differentTypes
    .sort((a, b) => {
      // Prioritize bestsellers and new items
      const aScore = (a.is_bestseller ? 10 : 0) + (a.is_new ? 5 : 0);
      const bScore = (b.is_bestseller ? 10 : 0) + (b.is_new ? 5 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);

  return results.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_usd: p.price_usd,
    stock_available: p.stock_available,
    images: p.images || [],
    collection_id: p.collection_id,
    is_new: p.is_new,
    is_bestseller: p.is_bestseller,
    article_no: p.article_no,
  }));
}

/**
 * Get co-purchased products - frequently bought together
 * Based on order_items data
 */
export async function getCoPurchasedProducts(
  productId: string,
  limit = 4
): Promise<ProductRecommendation[]> {
  // In a real implementation, this would query order_items
  // For now, we'll use a fallback based on same collection + price proximity
  
  const product = await getProductById(productId);
  if (!product) return [];

  const allProducts = await getAllActiveProducts();
  const sameCollection = allProducts.filter(
    p => p.collection_id === product.collection_id && p.id !== productId
  );

  // Find products within similar price range (±30%)
  const priceRange = {
    min: product.price_usd * 0.7,
    max: product.price_usd * 1.3,
  };

  const coPurchased = sameCollection.filter(
    p => p.price_usd >= priceRange.min && p.price_usd <= priceRange.max
  );

  // Sort by how close the price is, then by stock availability
  const results = coPurchased
    .sort((a, b) => {
      const aDiff = Math.abs(a.price_usd - product.price_usd) / product.price_usd;
      const bDiff = Math.abs(b.price_usd - product.price_usd) / product.price_usd;
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.stock_available - a.stock_available;
    })
    .slice(0, limit);

  return results.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_usd: p.price_usd,
    stock_available: p.stock_available,
    images: p.images || [],
    collection_id: p.collection_id,
    is_new: p.is_new,
    is_bestseller: p.is_bestseller,
    article_no: p.article_no,
  }));
}

/**
 * Get similar products - same category, similar price band (±20%)
 */
export async function getSimilarProducts(
  productId: string,
  limit = 4
): Promise<ProductRecommendation[]> {
  const product = await getProductById(productId);
  if (!product) return [];

  const allProducts = await getAllActiveProducts();
  
  // Get products from same collection
  const sameCollection = allProducts.filter(
    p => p.collection_id === product.collection_id && p.id !== productId
  );

  // Similar price range (±20%)
  const priceRange = {
    min: product.price_usd * 0.8,
    max: product.price_usd * 1.2,
  };

  const similar = sameCollection.filter(
    p => p.price_usd >= priceRange.min && p.price_usd <= priceRange.max
  );

  // Sort by price similarity
  const results = similar
    .sort((a, b) => {
      const aDiff = Math.abs(a.price_usd - product.price_usd);
      const bDiff = Math.abs(b.price_usd - product.price_usd);
      return aDiff - bDiff;
    })
    .slice(0, limit);

  return results.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_usd: p.price_usd,
    stock_available: p.stock_available,
    images: p.images || [],
    collection_id: p.collection_id,
    is_new: p.is_new,
    is_bestseller: p.is_bestseller,
    article_no: p.article_no,
  }));
}

/**
 * Get recently viewed products
 */
export async function getRecentlyViewedProducts(
  productIds: string[],
  limit = 10
): Promise<ProductRecommendation[]> {
  if (productIds.length === 0) return [];

  const products = await Promise.all(
    productIds.map(id => getProductById(id))
  );

  const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== null);

  return validProducts
    .slice(0, limit)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_usd: p.price_usd,
      stock_available: p.stock_available,
      images: p.images || [],
      collection_id: p.collection_id,
      is_new: p.is_new,
      is_bestseller: p.is_bestseller,
      article_no: p.article_no,
    }));
}

/**
 * Get all recommendations for a product (composite)
 */
export async function getAllRecommendations(
  productId: string,
  recentlyViewedIds: string[] = [],
  options: {
    complementaryLimit?: number;
    coPurchasedLimit?: number;
    similarLimit?: number;
    recentlyViewedLimit?: number;
  } = {}
): Promise<{
  complementary: ProductRecommendation[];
  coPurchased: ProductRecommendation[];
  similar: ProductRecommendation[];
  recentlyViewed: ProductRecommendation[];
}> {
  const {
    complementaryLimit = 4,
    coPurchasedLimit = 4,
    similarLimit = 4,
    recentlyViewedLimit = 10,
  } = options;

  const [complementary, coPurchased, similar, recentlyViewed] = await Promise.all([
    getComplementaryProducts(productId, complementaryLimit),
    getCoPurchasedProducts(productId, coPurchasedLimit),
    getSimilarProducts(productId, similarLimit),
    getRecentlyViewedProducts(recentlyViewedIds, recentlyViewedLimit),
  ]);

  return { complementary, coPurchased, similar, recentlyViewed };
}

/**
 * Infer product type from name for complementary matching
 */
function inferProductType(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('sofa') || lowerName.includes('couch') || lowerName.includes('settee')) {
    return 'seating';
  }
  if (lowerName.includes('chair') && !lowerName.includes('dining')) {
    return 'seating';
  }
  if (lowerName.includes('dining chair')) {
    return 'dining';
  }
  if (lowerName.includes('table') && (lowerName.includes('coffee') || lowerName.includes('side') || lowerName.includes('console'))) {
    return 'occasional_table';
  }
  if (lowerName.includes('dining table')) {
    return 'dining';
  }
  if (lowerName.includes('tv cabinet') || lowerName.includes('media') || lowerName.includes('entertainment')) {
    return 'media_storage';
  }
  if (lowerName.includes('sideboard') || lowerName.includes('buffet') || lowerName.includes('cabinet') || lowerName.includes('dresser')) {
    return 'storage';
  }
  if (lowerName.includes('bed')) {
    return 'bedroom';
  }
  if (lowerName.includes('nightstand') || lowerName.includes('bedside')) {
    return 'bedroom';
  }
  if (lowerName.includes('desk') || lowerName.includes('office')) {
    return 'office';
  }
  if (lowerName.includes('shoe') || lowerName.includes('entry')) {
    return 'entryway';
  }
  
  return 'other';
}