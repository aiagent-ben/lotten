#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || '';

const PRODUCTS_INDEX = 'products';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const meilisearch = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

interface ProductDocument {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
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
  materials: {
    part: string;
    material: string;
    finish: string | null;
    code: string | null;
  }[] | null;
  colors: {
    part: string;
    name: string;
    code: string;
    hex: string | null;
  }[] | null;
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

async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
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
      collections!inner (
        id,
        name,
        slug,
        brand_id,
        brands!inner (
          id,
          name,
          slug
        )
      )
    `)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

function transformProduct(product: any): ProductDocument {
  const collection = product.collections;
  const brand = collection?.brands;

  const images = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const primaryImage = images.find((img: any) => img.is_primary) || images[0];

  return {
    id: product.id,
    article_no: product.article_no,
    name: product.name,
    slug: product.slug,
    short_description: product.short_description,
    description: product.description,
    price_usd: Number(product.price_usd),
    cost_usd: product.cost_usd ? Number(product.cost_usd) : null,
    collection_id: collection?.id || '',
    collection_name: collection?.name || '',
    brand_name: brand?.name || '',
    brand_id: brand?.id || '',
    images: images.map((img: any) => ({
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
    weight_kg: product.weight_kg ? Number(product.weight_kg) : null,
    volume_m3: product.volume_m3 ? Number(product.volume_m3) : null,
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

async function setupIndex() {
  try {
    await meilisearch.index(PRODUCTS_INDEX).getStats();
    console.log(`Index "${PRODUCTS_INDEX}" already exists`);
  } catch {
    console.log(`Creating index "${PRODUCTS_INDEX}"...`);
    await meilisearch.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
  }

  await meilisearch.index(PRODUCTS_INDEX).updateSettings({
    searchableAttributes: [
      'name',
      'short_description',
      'description',
      'article_no',
      'collection_name',
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
      'tv cabinet': ['tv unit', 'entertainment unit', 'media console'],
      'sideboard': ['buffet', 'credenza', 'cabinet'],
      'coffee table': ['centre table', 'living room table'],
      'console table': ['entryway table', 'sofa table'],
      'dining table': ['dinner table'],
      'bedside table': ['nightstand', 'bedside cabinet'],
      'wardrobe': ['closet', 'armoire'],
      'bookshelf': ['bookcase', 'shelving'],
      'oak': ['malaysian oak', 'solid oak'],
      'walnut': ['walnut finish'],
      'cocoa': ['dark brown', 'chocolate'],
      'natural': ['raw', 'unfinished'],
    },
  });

  console.log('Index settings configured');
}

async function indexProducts() {
  console.log('Fetching products from Supabase...');
  const products = await getProducts();
  console.log(`Found ${products.length} active products`);

  const documents = products.map(transformProduct);
  console.log('Transformed products for indexing');

  const batchSize = 100;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const task = await meilisearch.index(PRODUCTS_INDEX).addDocuments(batch);
    console.log(`Indexed batch ${i / batchSize + 1}/${Math.ceil(documents.length / batchSize)} (task: ${task.taskUid})`);
  }

  console.log('Waiting for indexing to complete...');
  await meilisearch.waitForTasks([]);
  console.log('Indexing complete!');
}

async function main() {
  try {
    console.log('Starting MeiliSearch product indexing...');
    await setupIndex();
    await indexProducts();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();