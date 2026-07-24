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
  
  const productData = {
    "source_url": "https://www.b2bfurnituresupply.com/dining-room/dining-room-bar-and-counter-table/145144-alford-counter-table-1802-solid",
    "scraped_at": "2026-07-24T10:30:00",
    "article_no": "145144",
    "name": "ALFORD COUNTER TABLE 1802 (SOLID)",
    "slug": "145144-alford-counter-table-1802-solid",
    "price": "",
    "description": "Alford Counter Table is a high-profile furniture piece designed to add both functional versatility and organic warmth to modern kitchens or social dining spaces. Standing at an elevated counter height of 925mm, this table features a substantial 35mm thick tabletop crafted from Malaysian Oak and finished in premium Mindy Veneer, showcasing the rich grain of the Light Tennessee Walnut tone. Unit is supported by robust, clean-lined legs made from Solid Malaysian Oak, ensuring exceptional structural integrity for high-use environments. Its generous 1500mm surface comfortably accommodates up to 6 counter stools, making it an ideal choice for open-concept breakfast nooks or casual entertainment areas that prioritize a grounded timber aesthetic.",
    "materials": "TABLE LEG: MALAYSIAN OAK\nTABLE TOP: MALAYSIAN OAK+MINDY VENEER",
    "colors": "TABLE LEG: 1802 LIGHT TENNESSEE WALNUT\nTABLE TOP: 1802 LIGHT TENNESSEE WALNUT",
    "specifications": "Dimension (mm): L1500 W900 H925 T35\nGross Weight (kg): 57.00\nm³: 0.2276\nPack Type: 1PC/CTN",
    "dimensions_raw": "L1500 W900 H925 T35",
    "weight_raw": "57.00",
    "carton_dimensions_raw": "145144: L1570 W1000 H145",
    "color_swatches": [
      {
        "code": "1802",
        "name": "LIGHT TENNESSEE WALNUT",
        "swatch_url": "https://mm.hinlim.com/cache/b2bfs/color/1802 LIGHT TENNESSEE WALNUT-30x30.jpg",
        "alt": "1802 LIGHT TENNESSEE WALNUT"
      }
    ],
    "product_gallery": [
      {
        "src": "https://mm.hinlim.com/cache/b2bfs/product/145144/145144-1500x1500.jpg",
        "parent_class": "thumbnail"
      },
      {
        "src": "https://mm.hinlim.com/cache/b2bfs/product/145144/145144_2-1500x1500.jpg",
        "parent_class": "thumbnail"
      },
      {
        "src": "https://mm.hinlim.com/cache/b2bfs/product/145144/145144_3-1500x1500.jpg",
        "parent_class": "thumbnail"
      },
      {
        "src": "https://mm.hinlim.com/cache/b2bfs/product/145144/145144_s1-1500x1500.jpg",
        "parent_class": "thumbnail"
      }
    ],
    "brand": null,
    "collection": null,
    "pack_type": "1PC/CTN"
  };
  
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
