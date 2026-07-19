import { MeiliSearch } from 'meilisearch';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || '';

export const meilisearch = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

export const PRODUCTS_INDEX = 'products';

export interface SearchFilters {
  collection?: string;
  category?: string;
  material?: string;
  finish?: string;
  minPrice?: number;
  maxPrice?: number;
  minWidth?: number;
  maxWidth?: number;
  minDepth?: number;
  maxDepth?: number;
  minHeight?: number;
  maxHeight?: number;
  roomType?: string;
  style?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface SearchResult {
  hits: ProductHit[];
  estimatedTotalHits: number;
  facets: SearchFacets;
  processingTimeMs: number;
}

export interface ProductHit {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  short_description: string | null;
  price_usd: number;
  collection_id: string;
  collection_name: string;
  brand_name: string;
  images: ProductImage[];
  primary_image_url: string | null;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  volume_m3: number | null;
  materials: MaterialSpec[] | null;
  colors: ColorOption[] | null;
  moq: number;
  lead_time_weeks: number;
  stock_available: number;
  stock_reserved: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
}

export interface MaterialSpec {
  part: string;
  material: string;
  finish: string | null;
  code: string | null;
}

export interface ColorOption {
  part: string;
  name: string;
  code: string;
  hex: string | null;
}

export interface SearchFacets {
  collection_id?: Record<string, number>;
  brand_name?: Record<string, number>;
  price_usd?: Record<string, number>;
  is_new?: Record<string, number>;
  is_bestseller?: Record<string, number>;
  stock_available?: Record<string, number>;
  materials?: Record<string, number>;
  colors?: Record<string, number>;
  width_mm?: Record<string, number>;
  depth_mm?: Record<string, number>;
  height_mm?: Record<string, number>;
}

export function buildFilterString(filters: SearchFilters): string[] {
  const filterParts: string[] = [];

  if (filters.collection) {
    filterParts.push(`collection_id = "${filters.collection}"`);
  }

  if (filters.category) {
    filterParts.push(`collection_id = "${filters.category}"`);
  }

  if (filters.material) {
    filterParts.push(`materials.part = "${filters.material}"`);
  }

  if (filters.finish) {
    filterParts.push(`materials.finish = "${filters.finish}"`);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? 100000;
    filterParts.push(`price_usd >= ${min} AND price_usd <= ${max}`);
  }

  if (filters.minWidth !== undefined || filters.maxWidth !== undefined) {
    const min = filters.minWidth ?? 0;
    const max = filters.maxWidth ?? 10000;
    filterParts.push(`width_mm >= ${min} AND width_mm <= ${max}`);
  }

  if (filters.minDepth !== undefined || filters.maxDepth !== undefined) {
    const min = filters.minDepth ?? 0;
    const max = filters.maxDepth ?? 10000;
    filterParts.push(`depth_mm >= ${min} AND depth_mm <= ${max}`);
  }

  if (filters.minHeight !== undefined || filters.maxHeight !== undefined) {
    const min = filters.minHeight ?? 0;
    const max = filters.maxHeight ?? 10000;
    filterParts.push(`height_mm >= ${min} AND height_mm <= ${max}`);
  }

  if (filters.roomType) {
    filterParts.push(`collection_id = "${filters.roomType}"`);
  }

  if (filters.style) {
    filterParts.push(`brand_name = "${filters.style}"`);
  }

  if (filters.inStock) {
    filterParts.push('stock_available > 0');
  }

  if (filters.isNew) {
    filterParts.push('is_new = true');
  }

  if (filters.isBestseller) {
    filterParts.push('is_bestseller = true');
  }

  return filterParts;
}

export async function searchProducts(
  query: string = '',
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20,
  sort: string[] = ['sort_order:asc']
): Promise<SearchResult> {
  const filterString = buildFilterString(filters);
  const offset = (page - 1) * limit;

  const searchParams: any = {
    q: query,
    limit,
    offset,
    sort,
    filter: filterString.length > 0 ? filterString : undefined,
    facets: [
      'collection_id',
      'brand_name',
      'is_new',
      'is_bestseller',
      'stock_available',
      'price_usd',
    ],
    attributesToHighlight: ['name', 'short_description'],
    attributesToCrop: ['short_description'],
    cropLength: 200,
  };

  const result = await meilisearch.index(PRODUCTS_INDEX).search(query, searchParams);

  return {
    hits: result.hits as ProductHit[],
    estimatedTotalHits: result.estimatedTotalHits ?? 0,
    facets: (result as any).facets as SearchFacets,
    processingTimeMs: result.processingTimeMs,
  };
}

export async function getProductById(id: string): Promise<ProductHit | null> {
  try {
    const product = await meilisearch.index(PRODUCTS_INDEX).getDocument(id);
    return product as ProductHit;
  } catch {
    return null;
  }
}

export async function getSimilarProducts(
  productId: string,
  collectionId: string,
  limit: number = 4
): Promise<ProductHit[]> {
  const product = await getProductById(productId);
  if (!product) return [];

  const result = await meilisearch.index(PRODUCTS_INDEX).search('', {
    filter: [
      `collection_id = "${collectionId}"`,
      `id != "${productId}"`,
      'is_active = true',
    ],
    limit,
    sort: ['is_bestseller:desc', 'is_new:desc', 'sort_order:asc'],
  });

  return result.hits as ProductHit[];
}