import { Metadata } from 'next';
import { createServiceClient } from '@/lib/db/client';
import { formatPrice } from '@/lib/utils';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Products | Lotten Admin',
};

interface Props {
  searchParams: Promise<{ page?: string; search?: string; collection?: string; status?: string }>;
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
}

async function fetchProducts(params: {
  page: number;
  search: string;
  collectionFilter: string;
  statusFilter: string;
  perPage: number;
}) {
  const supabase = createServiceClient();

  let query = supabase
    .from('products')
    .select(
      `
      id,
      article_no,
      name,
      slug,
      price_usd,
      stock_available,
      stock_reserved,
      is_active,
      is_new,
      is_bestseller,
      sort_order,
      created_at,
      collections:collection_id (id, name, slug),
      images:product_images!product_id (url, is_primary, sort_order)
    `,
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range((params.page - 1) * params.perPage, params.page * params.perPage - 1);

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,article_no.ilike.%${params.search}%,slug.ilike.%${params.search}%`
    );
  }

  if (params.collectionFilter) {
    query = query.eq('collection_id', params.collectionFilter);
  }

  if (params.statusFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (params.statusFilter === 'inactive') {
    query = query.eq('is_active', false);
  } else if (params.statusFilter === 'new') {
    query = query.eq('is_new', true);
  } else if (params.statusFilter === 'bestseller') {
    query = query.eq('is_bestseller', true);
  } else if (params.statusFilter === 'low_stock') {
    query = query.lte('stock_available', 5);
  } else if (params.statusFilter === 'out_of_stock') {
    query = query.eq('stock_available', 0);
  }

  const { data: products, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
  }

  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  const typedProducts = (products || []).map((p) => {
    const coll = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    return {
      ...p,
      collections: coll ? { id: coll.id, name: coll.name, slug: coll.slug } : null,
      images: p.images?.map((i) => ({ url: i.url, is_primary: i.is_primary, sort_order: i.sort_order })) || [],
    };
  });

  return { products: typedProducts, count: count ?? 0, collections: collections || [] };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const collectionFilter = params.collection || '';
  const statusFilter = params.status || '';
  const perPage = 20;

  const { products, count, collections } = await fetchProducts({
    page,
    search,
    collectionFilter,
    statusFilter,
    perPage,
  });

  const totalPages = Math.ceil(count / perPage);

  return (
    <ProductsClient
      initialProducts={products}
      initialCount={count}
      initialPage={page}
      initialSearch={search}
      initialCollectionFilter={collectionFilter}
      initialStatusFilter={statusFilter}
      initialPerPage={perPage}
      initialTotalPages={totalPages}
      initialCollections={collections}
    />
  );
}