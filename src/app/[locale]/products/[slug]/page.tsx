import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getAllActiveProducts, getCollectionBySlug, formatPrice, getCollectionBySlug as getCollection, getColorHex, getProductImages } from '@/lib/data/products';
import { cn } from '@/lib/utils';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const collection = getCollection(product.collection_id);
  
  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160),
    keywords: [product.name, collection?.name, 'Malaysian Oak', 'furniture'].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      type: 'website',
      images: product.images?.map(img => ({
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
      images: product.images?.map(img => img.url) || [],
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
  const products = getAllActiveProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch product images from the productImages array
  const productImages = getProductImages(product.id);

  return <ProductDetailClient product={product} images={productImages} />;
}