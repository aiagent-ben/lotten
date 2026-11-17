import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getProductBySlug,
  getProductsByCollection,
  getCollectionById,
  getBrandById,
} from '@/lib/data/products';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);

  const [t, product] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getProductBySlug(slug, locale),
  ]);

  if (!product) {
    return {
      title: t('meta_not_found'),
    };
  }

  const collection = product.collection_id ? await getCollectionById(product.collection_id, locale) : null;
  const brand = collection?.brand_id ? await getBrandById(collection.brand_id, locale) : null;

  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160),
    keywords: [product.name, collection?.name, brand?.name || 'Lotten', 'Malaysian Oak', 'furniture'].filter(Boolean) as string[],
    alternates: buildLocaleAlternates(locale, `/products/${slug}`),
    openGraph: {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      type: 'website',
      images: product.product_images?.map((img) => ({
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
      images: product.product_images?.map((img) => img.url) || [],
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
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const product of products) {
      params.push({ locale, slug: product.slug });
    }
  }
  return params;
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.collection_id
    ? await getProductsByCollection(product.collection_id, locale)
    : [];

  const related = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <ProductDetailClient
      product={product}
      images={product.product_images || []}
      relatedProducts={related}
    />
  );
}
