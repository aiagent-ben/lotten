import { MeiliSearch } from 'meilisearch';
import { createServiceClient } from '@/lib/db/client';
import type {
  CollectionTranslation,
  ColorOption,
  LocaleTranslations,
  MaterialSpec,
  ProductTranslation,
} from '@/lib/types/database';

export const PRODUCTS_INDEX = 'products';

export interface ProductSearchDocument {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  name_my?: string | null;
  short_description_my?: string | null;
  description_my?: string | null;
  collection_name_my?: string | null;
  name_zh?: string | null;
  short_description_zh?: string | null;
  description_zh?: string | null;
  collection_name_zh?: string | null;
  price_usd: number;
  cost_usd: number | null;
  collection_id: string;
  collection_name: string;
  brand_name: string;
  brand_id: string;
  images: {
    id: string;
    product_id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    width: number | null;
    height: number | null;
  }[];
  primary_image_url: string | null;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  volume_m3: number | null;
  pack_type: string | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  materials: MaterialSpec[] | null;
  colors: ColorOption[] | null;
  moq: number;
  lead_time_weeks: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ProductDbRow {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  translations?: LocaleTranslations<ProductTranslation> | null;
  price_usd: number | string;
  cost_usd: number | string | null;
  width_mm: number | null;
  depth_mm: number | null;
  height_mm: number | null;
  weight_kg: number | string | null;
  volume_m3: number | string | null;
  pack_type: string | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  materials: MaterialSpec[] | null;
  colors: ColorOption[] | null;
  moq: number;
  lead_time_weeks: number;
  stock_available: number;
  stock_reserved: number;
  stock_incoming: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_images?: {
    id: string;
    product_id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    width: number | null;
    height: number | null;
  }[];
  collections?: {
    id: string;
    name: string;
    slug: string;
    brand_id: string;
    translations?: LocaleTranslations<CollectionTranslation> | null;
    brands?: {
      id: string;
      name: string;
      slug: string;
    } | { id: string; name: string; slug: string }[] | null;
  } | null;
}

const PRODUCT_SEARCH_SELECT = `
  *,
  product_images (
    id,
    product_id,
    url,
    alt_text,
    sort_order,
    is_primary,
    width,
    height
  ),
  collections (
    id,
    name,
    slug,
    translations,
    brand_id,
    brands (
      id,
      name,
      slug
    )
  )
`;

function getMeiliClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST?.trim();
  if (!host) return null;
  return new MeiliSearch({
    host,
    apiKey: process.env.MEILISEARCH_API_KEY || '',
  });
}

export function transformProductForSearch(product: ProductDbRow): ProductSearchDocument {
  const collection = Array.isArray(product.collections)
    ? product.collections[0]
    : product.collections;
  const rawBrand = collection?.brands;
  const brand = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand;

  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const primaryImage = images.find((img) => img.is_primary) || images[0];

  return {
    id: product.id,
    article_no: product.article_no,
    name: product.name,
    slug: product.slug,
    short_description: product.short_description,
    description: product.description,
    name_my: product.translations?.my?.name || null,
    short_description_my: product.translations?.my?.short_description || null,
    description_my: product.translations?.my?.description || null,
    collection_name_my: collection?.translations?.my?.name || null,
    name_zh: product.translations?.zh?.name || null,
    short_description_zh: product.translations?.zh?.short_description || null,
    description_zh: product.translations?.zh?.description || null,
    collection_name_zh: collection?.translations?.zh?.name || null,
    price_usd: product.price_usd != null ? Number(product.price_usd) : 0,
    cost_usd: product.cost_usd != null ? Number(product.cost_usd) : null,
    collection_id: collection?.id || '',
    collection_name: collection?.name || '',
    brand_name: brand?.name || '',
    brand_id: brand?.id || '',
    images: images.map((img) => ({
      id: img.id,
      product_id: img.product_id,
      url: img.url,
      alt_text: img.alt_text,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
      width: img.width,
      height: img.height,
    })),
    primary_image_url: primaryImage?.url || null,
    width_mm: product.width_mm,
    depth_mm: product.depth_mm,
    height_mm: product.height_mm,
    weight_kg: product.weight_kg != null ? Number(product.weight_kg) : null,
    volume_m3: product.volume_m3 != null ? Number(product.volume_m3) : null,
    pack_type: product.pack_type,
    carton_length_mm: product.carton_length_mm,
    carton_width_mm: product.carton_width_mm,
    carton_height_mm: product.carton_height_mm,
    materials: product.materials || null,
    colors: product.colors || null,
    moq: product.moq,
    lead_time_weeks: product.lead_time_weeks,
    stock_available: product.stock_available,
    stock_reserved: product.stock_reserved,
    stock_incoming: product.stock_incoming,
    low_stock_threshold: product.low_stock_threshold,
    is_active: product.is_active,
    is_new: product.is_new,
    is_bestseller: product.is_bestseller,
    sort_order: product.sort_order,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

async function ensureProductIndexSettings(client: MeiliSearch): Promise<number> {
  try {
    await client.index(PRODUCTS_INDEX).getStats();
  } catch {
    const createTask = await client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
    await client.waitForTask(createTask.taskUid, { timeOutMs: 15000 });
  }

  const settingsTask = await client.index(PRODUCTS_INDEX).updateSettings({
    searchableAttributes: [
      'name',
      'name_my',
      'name_zh',
      'short_description',
      'short_description_my',
      'short_description_zh',
      'description',
      'description_my',
      'description_zh',
      'article_no',
      'collection_name',
      'collection_name_my',
      'collection_name_zh',
      'brand_name',
      'materials.material',
      'materials.finish',
      'colors.name',
      'colors.code',
    ],
    filterableAttributes: [
      'collection_id',
      'brand_id',
      'brand_name',
      'price_usd',
      'is_new',
      'is_bestseller',
      'is_active',
      'stock_available',
      'width_mm',
      'depth_mm',
      'height_mm',
      'materials.part',
      'materials.material',
      'materials.finish',
      'colors.part',
      'colors.name',
      'colors.code',
    ],
    sortableAttributes: [
      'price_usd',
      'sort_order',
      'created_at',
      'updated_at',
      'stock_available',
      'is_new',
      'is_bestseller',
    ],
    faceting: {
      maxValuesPerFacet: 100,
    },
    pagination: {
      maxTotalHits: 1000,
    },
    synonyms: {
      'tv cabinet': ['tv unit', 'entertainment unit', 'media console', 'kabinet tv', '电视柜'],
      'kabinet tv': ['tv cabinet', 'tv unit'],
      sideboard: ['buffet', 'credenza', 'cabinet', 'almari sisi', '餐边柜'],
      'coffee table': ['centre table', 'living room table', 'meja kopi', '茶几'],
      'meja kopi': ['coffee table'],
      'console table': ['entryway table', 'sofa table', 'meja konsol', '玄关桌'],
      'dining table': ['dinner table', 'meja makan', '餐桌'],
      'meja makan': ['dining table'],
      'dining chair': ['kerusi makan', '餐椅'],
      'bedside table': ['nightstand', 'bedside cabinet', 'meja sisi katil', '床头柜'],
      wardrobe: ['closet', 'armoire', 'almari pakaian', '衣柜'],
      bookshelf: ['bookcase', 'shelving', 'rak buku', '书架'],
      desk: ['working desk', 'meja kerja', '书桌', '办公桌'],
      oak: ['malaysian oak', 'solid oak', 'kayu oak', 'kayu oak malaysia', '橡木', '马来西亚橡木'],
      walnut: ['walnut finish', 'warna walnut', '胡桃木'],
      cocoa: ['dark brown', 'chocolate', 'koko', '可可色'],
      natural: ['raw', 'unfinished', 'semula jadi', '原木色'],
    },
  });

  return settingsTask.taskUid;
}

const PAGE_SIZE = 500;
const BATCH_SIZE = 100;

let indexInitializedPromise: Promise<void> | null = null;

async function ensureIndexExistsAndConfigured(client: MeiliSearch): Promise<void> {
  if (!indexInitializedPromise) {
    indexInitializedPromise = (async () => {
      try {
        await client.index(PRODUCTS_INDEX).getStats();
      } catch {
        const uid = await ensureProductIndexSettings(client);
        await client.waitForTask(uid, { timeOutMs: 15000 });
      }
    })().catch((err) => {
      indexInitializedPromise = null;
      throw err;
    });
  }
  return indexInitializedPromise;
}

async function fetchPaginatedProducts(filter?: {
  collectionId?: string;
  collectionIds?: string[];
  isActive?: boolean;
}): Promise<ProductDbRow[]> {
  const supabase = createServiceClient();
  const rows: ProductDbRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('products')
      .select(PRODUCT_SEARCH_SELECT)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (filter?.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive);
    }
    if (filter?.collectionId) {
      query = query.eq('collection_id', filter.collectionId);
    }
    if (filter?.collectionIds && filter.collectionIds.length > 0) {
      query = query.in('collection_id', filter.collectionIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    const batch = (data || []) as unknown as ProductDbRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchInactiveProductIds(): Promise<string[]> {
  const supabase = createServiceClient();
  const ids: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', false)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const batch = data || [];
    for (const row of batch) {
      if (row.id) ids.push(row.id as string);
    }
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return ids;
}

async function addDocumentsBatched(
  client: MeiliSearch,
  documents: ProductSearchDocument[]
): Promise<number[]> {
  const taskUids: number[] = [];
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const task = await client.index(PRODUCTS_INDEX).addDocuments(batch);
    taskUids.push(task.taskUid);
  }
  return taskUids;
}

export async function syncAllProductsToMeilisearch(): Promise<{
  indexed: number;
  deleted: number;
  skippedReason?: string;
}> {
  const client = getMeiliClient();
  if (!client) {
    return { indexed: 0, deleted: 0, skippedReason: 'MEILISEARCH_HOST not set' };
  }

  const [activeRows, inactiveIds] = await Promise.all([
    fetchPaginatedProducts({ isActive: true }),
    fetchInactiveProductIds(),
  ]);

  const taskUids: number[] = [];
  taskUids.push(await ensureProductIndexSettings(client));

  const documents = activeRows.map(transformProductForSearch);
  taskUids.push(...(await addDocumentsBatched(client, documents)));

  for (let i = 0; i < inactiveIds.length; i += BATCH_SIZE) {
    const batch = inactiveIds.slice(i, i + BATCH_SIZE);
    const task = await client.index(PRODUCTS_INDEX).deleteDocuments(batch);
    taskUids.push(task.taskUid);
  }

  if (taskUids.length > 0) {
    await client.waitForTasks(taskUids, { timeOutMs: 60000 });
  }

  return { indexed: documents.length, deleted: inactiveIds.length };
}

export async function syncProductInMeilisearch(productId: string): Promise<void> {
  const client = getMeiliClient();
  if (!client) return;

  await ensureIndexExistsAndConfigured(client);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SEARCH_SELECT)
    .eq('id', productId)
    .maybeSingle();

  if (error) throw error;

  if (!data || !data.is_active) {
    await client.index(PRODUCTS_INDEX).deleteDocument(productId);
    return;
  }

  const doc = transformProductForSearch(data as unknown as ProductDbRow);
  await client.index(PRODUCTS_INDEX).addDocuments([doc]);
}

export async function syncProductsInMeilisearch(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const client = getMeiliClient();
  if (!client) return;

  await ensureIndexExistsAndConfigured(client);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SEARCH_SELECT)
    .in('id', productIds);

  if (error) throw error;

  const rows = (data || []) as unknown as ProductDbRow[];
  const activeDocs = rows.filter((p) => p.is_active).map(transformProductForSearch);
  const inactiveOrMissing = productIds.filter(
    (id) => !rows.some((r) => r.id === id && r.is_active)
  );

  const taskUids: number[] = [];
  if (activeDocs.length > 0) {
    taskUids.push(...(await addDocumentsBatched(client, activeDocs)));
  }
  if (inactiveOrMissing.length > 0) {
    const delTask = await client.index(PRODUCTS_INDEX).deleteDocuments(inactiveOrMissing);
    taskUids.push(delTask.taskUid);
  }
  if (taskUids.length > 0) {
    await client.waitForTasks(taskUids, { timeOutMs: 30000 });
  }
}

export async function deleteProductsInMeilisearch(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const client = getMeiliClient();
  if (!client) return;

  await ensureIndexExistsAndConfigured(client);
  await client.index(PRODUCTS_INDEX).deleteDocuments(productIds);
}

export async function syncCollectionProductsInMeilisearch(collectionId: string): Promise<void> {
  const client = getMeiliClient();
  if (!client) return;

  await ensureIndexExistsAndConfigured(client);

  const rows = await fetchPaginatedProducts({ collectionId, isActive: true });
  const documents = rows.map(transformProductForSearch);
  if (documents.length > 0) {
    const taskUids = await addDocumentsBatched(client, documents);
    await client.waitForTasks(taskUids, { timeOutMs: 30000 });
  }
}

export async function syncBrandProductsInMeilisearch(brandId: string): Promise<void> {
  const client = getMeiliClient();
  if (!client) return;

  await ensureIndexExistsAndConfigured(client);

  const supabase = createServiceClient();
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id')
    .eq('brand_id', brandId);

  if (error) throw error;
  const collectionIds = (collections || []).map((c) => c.id as string).filter(Boolean);
  if (collectionIds.length === 0) return;

  const rows = await fetchPaginatedProducts({ collectionIds, isActive: true });
  const documents = rows.map(transformProductForSearch);
  if (documents.length > 0) {
    const taskUids = await addDocumentsBatched(client, documents);
    await client.waitForTasks(taskUids, { timeOutMs: 30000 });
  }
}
