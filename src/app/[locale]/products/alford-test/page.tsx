import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from '../[slug]/ProductDetailClient';
import { getColorHex } from '@/lib/utils';

interface Props {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'ALFORD COUNTER TABLE 1802 (SOLID) | Lotten',
  description: 'Alford Counter Table is a high-profile furniture piece designed to add both functional versatility and organic warmth to modern kitchens or social dining spaces.',
};

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }, { locale: 'ms' }];
}

export const revalidate = 3600;

export default async function AlfordTestPage({ params }: Props) {
  const { locale } = await params;
  
  // Fetch product data from public URL
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://lotten.2share.tech'}/data/temp_product.json`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    notFound();
  }
  
  const productData = await res.json();
  
  const product = {
    id: `prod-${productData.article_no}`,
    article_no: productData.article_no,
    collection_id: productData.collection || '',
    name: productData.name,
    slug: productData.slug,
    short_description: productData.description?.slice(0, 200) || '',
    description: productData.description || '',
    width_mm: null,
    depth_mm: null,
    height_mm: null,
    weight_kg: parseFloat(productData.weight_raw) || null,
    volume_m3: null,
    pack_type: productData.pack_type || '',
    carton_length_mm: null,
    carton_width_mm: null,
    carton_height_mm: null,
    materials: productData.materials?.split('\n').map((m: string) => {
      const [part, material] = m.split(': ');
      return { part: part?.toLowerCase().replace(' ', '_') || '', material: material || '', finish: '', code: '' };
    }).filter((m: any) => m.part) || [],
    colors: productData.colors?.split('\n').map((c: string) => {
      const [part, colorInfo] = c.split(': ');
      const parts = colorInfo?.split(' ') || [];
      return { 
        part: part?.toLowerCase().replace(' ', '_') || '', 
        name: parts.slice(1).join(' ') || '', 
        code: parts[0] || '', 
        hex: getColorHex(parts[0] || '') 
      };
    }).filter((c: any) => c.part) || [],
    price_usd: 0,
    cost_usd: null,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 10,
    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_new: false,
    is_bestseller: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: productData.product_gallery?.map((img: any, i: number) => ({
      id: `img-${productData.article_no}-${i}`,
      product_id: '',
      url: img.src,
      alt_text: `${productData.name} - Image ${i + 1}`,
      sort_order: i,
      is_primary: i === 0,
      width: 1200,
      height: 1200,
      created_at: new Date().toISOString(),
    })) || [],
    variants: [],
  };

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient 
      product={product} 
      images={product.images} 
    />
  );
}
