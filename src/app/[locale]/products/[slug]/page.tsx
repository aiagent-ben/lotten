import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/client';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  
  const { data: product } = await supabase
    .from('products')
    .select('*, collections(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order');

  const collection = product.collections;

  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160),
    keywords: [product.name, collection?.name, 'Malaysian Oak', 'furniture'].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      type: 'website',
      images: images?.map(img => ({
        url: img.url,
        width: img.width || 1200,
        height: img.height || 630,
        alt: img.alt_text || product.name,
      })) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      images: images?.map(img => img.url) || [],
    },
    other: {
      'product:price:amount': product.price_usd.toString(),
      'product:price:currency': 'MYR',
      'product:brand': collection?.name || 'Lotten',
      'product:availability': product.stock_available > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export async function generateStaticParams() {
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true);
  
  return products?.map((product) => ({
    slug: product.slug,
  })) || [];
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  
  const { data: product } = await supabase
    .from('products')
    .select('*, collections(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) {
    notFound();
  }

  const { data: productImages } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order');

  // Transform product images to match expected type
  const images = productImages?.map(img => ({
    id: img.id,
    product_id: img.product_id,
    url: img.url,
    alt_text: img.alt_text,
    sort_order: img.sort_order,
    is_primary: img.is_primary,
    width: img.width,
    height: img.height,
    created_at: img.created_at,
  })) || [];

  return <ProductDetailClient product={product} images={images} />;
}