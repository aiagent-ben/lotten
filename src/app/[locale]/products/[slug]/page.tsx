import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProductsByCollection, getCollectionById, getBrandById, formatPrice } from '@/lib/data/products';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const collection = product.collection_id ? await getCollectionById(product.collection_id) : null;
  const brand = collection?.brand_id ? await getBrandById(collection.brand_id) : null;

  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160),
    keywords: [product.name, collection?.name, brand?.name || 'Lotten', 'Malaysian Oak', 'furniture'].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      type: 'website',
      images: product.product_images?.map(img => ({
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
      images: product.product_images?.map(img => img.url) || [],
    },
    other: {
      'product:price:amount': product.price_usd.toString(),
      'product:price:currency': 'MYR',
      'product:brand': collection?.name || brand?.name || 'Lotten',
      'product:availability': product.stock_available > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export async function generateStaticParams() {
  const { getAllActiveProducts } = await import('@/lib/data/products');
  const products = await getAllActiveProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from same collection
  const relatedProducts = product.collection_id 
    ? await getProductsByCollection(product.collection_id)
    : [];

  // Filter out current product and limit to 4
  const related = relatedProducts
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  return <ProductDetailClient product={product} images={product.product_images || []} relatedProducts={related} />;
}