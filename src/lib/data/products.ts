import type { Brand, Collection, Product, ProductVariant, MaterialSpec, ColorOption, ProductImage } from '@/lib/types/database';

// ============================================================
// BRANDS DATA
// ============================================================
export const brands: Brand[] = [
  {
    id: 'brand-nesthouz',
    name: 'NestHouZ',
    slug: 'nesthouz',
    description: 'Contemporary Malaysian Oak furniture with warm, sophisticated finishes for modern living spaces.',
    logo_url: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'brand-nestnordic',
    name: 'NestNordic',
    slug: 'nestnordic',
    description: 'Scandinavian-inspired designs featuring clean lines, light washes, and minimalist aesthetics.',
    logo_url: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'brand-luooma',
    name: 'Luooma',
    slug: 'luooma',
    description: 'Modern furniture collections with innovative material combinations and architectural silhouettes.',
    logo_url: null,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// COLLECTIONS DATA
// ============================================================
export const collections: Collection[] = [
  // NestHouZ Collections
  {
    id: 'col-breda',
    brand_id: 'brand-nesthouz',
    name: 'Breda',
    slug: 'breda',
    description: 'Working desks, TV cabinets and sideboards in warm Walnut/Natural combinations.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-dover',
    brand_id: 'brand-nesthouz',
    name: 'Dover',
    slug: 'dover',
    description: 'Complete living room collections with coffee, console, side tables and desks.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Walnut', code: '113', hex: '#3D2B1F' },
      { part: 'legs', name: 'Cocoa', code: '109', hex: '#4A3728' },
    ],
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-malton',
    brand_id: 'brand-nesthouz',
    name: 'Malton',
    slug: 'malton',
    description: 'Sideboards, TV cabinets and dressers in sophisticated White/Dark oak pairings.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/344011/344011-550x500.jpg',
    color_palette: [
      { part: 'legs', name: 'Black', code: '114', hex: '#1A1A1A' },
      { part: 'frame', name: 'Natural', code: '102', hex: '#8B7355' },
    ],
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-lamar',
    brand_id: 'brand-nesthouz',
    name: 'Lamar',
    slug: 'lamar',
    description: 'Solid oak coffee and console tables in Natural or Cocoa with clean profiles.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/335027/335027-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
    ],
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-kyoto',
    brand_id: 'brand-nesthouz',
    name: 'Kyoto',
    slug: 'kyoto',
    description: 'TV cabinets and shoe storage solutions in Natural and Cocoa finishes.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/336075/336075-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
    ],
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-dudley',
    brand_id: 'brand-nesthouz',
    name: 'Dudley',
    slug: 'dudley',
    description: 'Sideboards, TV cabinets and tables in two-tone Natural/Dark combinations.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/345066/345066-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Natural/Dark', code: '102/173', hex: '#5D4E3D' },
    ],
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // NestNordic Collections
  {
    id: 'col-ludlow',
    brand_id: 'brand-nestnordic',
    name: 'Ludlow',
    slug: 'ludlow',
    description: 'Scandinavian minimalism in White Wash with fluted detailing and oak veneers.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/345064/345064-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'White Wash', code: '111', hex: '#F5F0E8' },
    ],
    is_active: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-loftus',
    brand_id: 'brand-nestnordic',
    name: 'Loftus',
    slug: 'loftus',
    description: 'Industrial-modern fusion with metal frames and natural oak tops.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/134107/134107-550x500.jpg',
    color_palette: [
      { part: 'frame', name: 'Natural/White', code: '102/112', hex: '#C8B8A8' },
      { part: 'top', name: 'Natural', code: '1001', hex: '#8B7355' },
    ],
    is_active: true,
    sort_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-hutto',
    brand_id: 'brand-nestnordic',
    name: 'Hutto',
    slug: 'hutto',
    description: 'Walnut and natural oak combinations with extendable dining solutions.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/336069/336069-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Walnut/Natural', code: '802/113', hex: '#4A3728' },
      { part: 'body', name: 'Mixed', code: '109/113/166', hex: '#5D4E3D' },
    ],
    is_active: true,
    sort_order: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-royston',
    brand_id: 'brand-nestnordic',
    name: 'Royston',
    slug: 'royston',
    description: 'Premium rattan-accented cabinets with gold and cocoa metal-wood frames.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/345064/345064-550x500.jpg',
    color_palette: [
      { part: 'legs', name: 'Gold', code: '808', hex: '#C5A050' },
      { part: 'body', name: 'Walnut', code: '113', hex: '#3D2B1F' },
    ],
    is_active: true,
    sort_order: 13,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Luooma Collections
  {
    id: 'col-oruro',
    brand_id: 'brand-luooma',
    name: 'Oruro',
    slug: 'oruro',
    description: 'Sleek ash veneer cabinets in rich Cocoa finish with push-to-open mechanisms.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/336109/336109-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
    ],
    is_active: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-waldo',
    brand_id: 'brand-luooma',
    name: 'Waldo',
    slug: 'waldo',
    description: 'Geometric base designs in Walnut/Black finish for contemporary dining spaces.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/145137/145137-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Walnut/Black', code: '802/179', hex: '#2D2520' },
    ],
    is_active: true,
    sort_order: 21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-castor',
    brand_id: 'brand-luooma',
    name: 'Castor',
    slug: 'castor',
    description: 'Minimalist three-tone finish combinations for modern entertainment centers.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg',
    color_palette: [
      { part: 'legs', name: 'Black', code: '114', hex: '#1A1A1A' },
      { part: 'frame', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'doors', name: 'Space Blue', code: '1325', hex: '#2A3B4D' },
    ],
    is_active: true,
    sort_order: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-hayton',
    brand_id: 'brand-luooma',
    name: 'Hayton',
    slug: 'hayton',
    description: 'Clean lines in White Wash or Cocoa with elegant tapered leg profiles.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/334027/334027-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'White Wash', code: '111', hex: '#F5F0E8' },
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
    ],
    is_active: true,
    sort_order: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-neath',
    brand_id: 'brand-luooma',
    name: 'Neath',
    slug: 'neath',
    description: 'Floating TV cabinets and versatile dining tables in multiple finish options.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/335058/335058-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'White Wash', code: '111', hex: '#F5F0E8' },
      { part: 'body', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'top', name: 'Grey Marble', code: '185', hex: '#6B6B6B' },
    ],
    is_active: true,
    sort_order: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-hampton',
    brand_id: 'brand-luooma',
    name: 'Hampton',
    slug: 'hampton',
    description: 'Tall sideboards with commanding presence in sophisticated finish combinations.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/345018/345018-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'White/Dark', code: '112/114', hex: '#4A4238' },
    ],
    is_active: true,
    sort_order: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-noud',
    brand_id: 'brand-luooma',
    name: 'Noud',
    slug: 'noud',
    description: 'Leaf-top dining tables and sideboards in refined two-tone finishes.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/145040/145040-550x500.jpg',
    color_palette: [
      { part: 'body', name: 'Oak', code: '112', hex: '#B8A898' },
    ],
    is_active: true,
    sort_order: 26,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-nakula',
    brand_id: 'brand-luooma',
    name: 'Nakula',
    slug: 'nakula',
    description: 'TV cabinets and tall sideboards with distinctive dual-finish wood combinations.',
    hero_image_url: 'https://mm.hinlim.com/cache/b2bfs/product/336055/336055-550x500.jpg',
    color_palette: [
      { part: 'legs', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'body', name: 'White Lacquer', code: '130', hex: '#F8F8F8' },
      { part: 'legs', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'body', name: 'Walnut/Gunmetal', code: '113/1318', hex: '#3D2B1F' },
    ],
    is_active: true,
    sort_order: 27,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// HELPER FUNCTIONS TO PARSE PRODUCT DATA
// ============================================================
function parseDimensions(specs: string): { width: number | null; depth: number | null; height: number | null } {
  const match = specs.match(/Dimension \(mm\):\s*W(\d+)\s*D(\d+)\s*H(\d+)/);
  if (match) {
    return { width: parseInt(match[1]), depth: parseInt(match[2]), height: parseInt(match[3]) };
  }
  return { width: null, depth: null, height: null };
}

function parseWeight(specs: string): number | null {
  const match = specs.match(/Gross Weight \(kg\):\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function parseVolume(specs: string): number | null {
  const match = specs.match(/m³:\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function parsePackType(specs: string): string | null {
  const match = specs.match(/Pack Type:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

function parseCartonDimensions(cartonStr: string): { length: number | null; width: number | null; height: number | null } {
  const match = cartonStr.match(/L(\d+)\s*W(\d+)\s*H(\d+)/);
  if (match) {
    return { length: parseInt(match[1]), width: parseInt(match[2]), height: parseInt(match[3]) };
  }
  return { length: null, width: null, height: null };
}

function parseMaterials(materialsStr: string): MaterialSpec[] {
  const materials: MaterialSpec[] = [];
  const lines = materialsStr.split('\n').filter(l => l.trim() && !l.includes('Article No') && !l.includes('Materials'));
  for (const line of lines) {
    const match = line.match(/(\w+(?:\s+\w+)?):\s*(.+)/);
    if (match) {
      const part = match[1].toLowerCase().replace(/\s+/g, '_');
      const materialInfo = match[2];
      // Try to parse material and finish
      const materialMatch = materialInfo.match(/(.+?)(?:\s+in\s+a\s+(.+?)\s+finish)?$/);
      if (materialMatch) {
        materials.push({
          part,
          material: materialMatch[1].trim(),
          finish: materialMatch[2]?.trim() || '',
          code: '',
        });
      }
    }
  }
  return materials;
}

function parseColors(colorsStr: string): ColorOption[] {
  const colors: ColorOption[] = [];
  const lines = colorsStr.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const match = line.match(/(\w+(?:\s+\w+)?):\s*(\d+)\s+(.+)/);
    if (match) {
      colors.push({
        part: match[1].toLowerCase().replace(/\s+/g, '_'),
        name: match[3].trim(),
        code: match[2].trim(),
        hex: '', // Would need mapping from code to hex
      });
    }
  }
  return colors;
}

function parsePrice(priceStr: string): number {
  // Convert "Contact for Price" or "RM 1,299" to number
  if (priceStr.includes('Contact')) return 0;
  const match = priceStr.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(',', '')) : 0;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================================
// PRODUCTS DATA - Transform from scraped format to database format
// ============================================================
const rawProducts = [
  // The raw product data would be imported from the scraped file
  // For now, we'll create a representative sample that matches the schema
];

// Sample products in the new database schema format
export const products: Product[] = [
  {
    id: 'prod-1',
    article_no: '335048',
    collection_id: 'col-breda',
    name: 'BREDA 1.5M TV CABINET 109/167',
    slug: 'breda-15m-tv-cabinet-109167',
    description: 'Breda 1.5m TV Cabinet is a masterfully refined media solution designed to introduce a bright, airy energy and architectural clarity to contemporary living environments.',
    short_description: '1.5m TV cabinet in Malaysian Oak with Walnut veneer body and White Marble melamine top.',
    width_mm: 1500,
    depth_mm: 450,
    height_mm: 500,
    weight_kg: 33.30,
    volume_m3: 0.3324,
    pack_type: '1PC/CTN',
    carton_length_mm: 1550,
    carton_width_mm: 514,
    carton_height_mm: 432,
    materials: [
      { part: 'cabinet_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'cabinet_body', material: 'MDF+Ash Veneer', finish: 'Walnut', code: '107' },
      { part: 'cabinet_top', material: 'Melamine', finish: 'White Marble', code: '167' },
    ],
    colors: [
      { part: 'cabinet_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'cabinet_body', name: 'Walnut', code: '107', hex: '#3D2B1F' },
      { part: 'cabinet_top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    price_usd: 899,
    cost_usd: 450,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 15,
    stock_reserved: 2,
    stock_incoming: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_new: true,
    is_bestseller: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      { id: 'img-1', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - Cocoa finish', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
      { id: 'img-2', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
      { id: 'img-3', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/336057/336057-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - Front view', sort_order: 2, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
    ],
  },
  {
    id: 'prod-2',
    article_no: '345049',
    collection_id: 'col-breda',
    name: 'BREDA 1.6M SIDEBOARD 109/167',
    slug: 'breda-16m-sideboard-109167',
    description: 'Breda 1.6m Sideboard is a masterfully engineered storage solution designed to introduce architectural clarity and a prestigious energy to contemporary living or dining environments.',
    short_description: '1.6m sideboard with Malaysian Oak legs, Ash veneer body, and White Marble melamine top.',
    width_mm: 1600,
    depth_mm: 450,
    height_mm: 760,
    weight_kg: 70.20,
    volume_m3: 0.5824,
    pack_type: '1PC/CTN',
    carton_length_mm: 1655,
    carton_width_mm: 510,
    carton_height_mm: 690,
    materials: [
      { part: 'sideboard_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'sideboard_body', material: 'MDF+Ash Veneer', finish: 'Walnut', code: '109' },
      { part: 'sideboard_top', material: 'Melamine', finish: 'White Marble', code: '167' },
    ],
    colors: [
      { part: 'sideboard_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'sideboard_body', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'sideboard_top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    price_usd: 1299,
    cost_usd: 650,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 8,
    stock_reserved: 1,
    stock_incoming: 5,
    low_stock_threshold: 3,
    is_active: true,
    is_new: false,
    is_bestseller: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    article_no: '336057',
    collection_id: 'col-breda',
    name: 'BREDA 1.8M TV CABINET 109/167',
    slug: 'breda-18m-tv-cabinet-109167',
    description: 'Breda 1.8m TV Cabinet is a masterfully engineered media solution designed to introduce architectural clarity and a prestigious, warm energy to contemporary living environments.',
    short_description: '1.8m TV cabinet with Malaysian Oak legs, Ash veneer body, and White Marble melamine top.',
    width_mm: 1800,
    depth_mm: 450,
    height_mm: 500,
    weight_kg: 40.00,
    volume_m3: 0.3967,
    pack_type: '1PC/CTN',
    carton_length_mm: 1850,
    carton_width_mm: 510,
    carton_height_mm: 435,
    materials: [
      { part: 'cabinet_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'cabinet_body', material: 'MDF+Ash Veneer', finish: 'Cocoa', code: '109' },
      { part: 'cabinet_top', material: 'Melamine', finish: 'White Marble', code: '167' },
    ],
    colors: [
      { part: 'cabinet_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'cabinet_body', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'cabinet_top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    price_usd: 1099,
    cost_usd: 550,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 10,
    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_new: false,
    is_bestseller: false,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    article_no: '144071',
    collection_id: 'col-breda',
    name: 'BREDA 800X1350 DINING TABLE 109/167',
    slug: 'breda-800x1350-dining-table-109167',
    description: 'Breda Dining Table is a striking anchor piece that masterfully blends the rugged durability of industrial design with the organic warmth of traditional timber.',
    short_description: '1350mm dining table with Malaysian Oak legs and Melamine top in Cocoa/White Marble.',
    width_mm: 800,
    depth_mm: 1350,
    height_mm: 750,
    weight_kg: 32.00,
    volume_m3: 0.1414,
    pack_type: '1PC/CTN',
    carton_length_mm: 1423,
    carton_width_mm: 860,
    carton_height_mm: 121,
    materials: [
      { part: 'table_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'table_top', material: 'MDF+Melamine', finish: 'White Marble', code: '167' },
    ],
    colors: [
      { part: 'table_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'table_top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    price_usd: 799,
    cost_usd: 400,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 12,
    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 3,
    is_active: true,
    is_new: true,
    is_bestseller: false,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    article_no: '123036',
    collection_id: 'col-breda',
    name: 'BREDA WORKING DESK 109/167',
    slug: 'breda-working-desk-109167',
    description: 'Breda Working Desk exudes executive refinement through its sophisticated mix of textures and Mid-Century Modern silhouette.',
    short_description: 'Working desk with Malaysian Oak legs, Ash veneer body, and White Marble melamine top.',
    width_mm: 500,
    depth_mm: 1100,
    height_mm: 785,
    weight_kg: 34.00,
    volume_m3: 0.1704,
    pack_type: '1PC/CTN',
    carton_length_mm: 1170,
    carton_width_mm: 560,
    carton_height_mm: 260,
    materials: [
      { part: 'desk_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'desk_body', material: 'MDF+Ash Veneer', finish: 'Cocoa', code: '109' },
      { part: 'desk_top', material: 'Melamine', finish: 'White Marble', code: '167' },
    ],
    colors: [
      { part: 'desk_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'desk_body', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'desk_top', name: 'White Marble', code: '167', hex: '#E8E0D8' },
    ],
    price_usd: 699,
    cost_usd: 350,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 6,
    stock_reserved: 1,
    stock_incoming: 4,
    low_stock_threshold: 3,
    is_active: true,
    is_new: false,
    is_bestseller: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Castor Collection
  {
    id: 'prod-6',
    article_no: '335043',
    collection_id: 'col-castor',
    name: 'CASTOR 1.5M TV CABINET 114/102/1325',
    slug: 'castor-15m-tv-cabinet-1141021325',
    description: 'Castor 1.5m TV Cabinet is a masterfully engineered media solution designed to introduce architectural clarity and a bold, authoritative energy to contemporary living environments.',
    short_description: '1.5m TV cabinet with metal legs, Ash veneer body, three-tone finish.',
    width_mm: 1500,
    depth_mm: 450,
    height_mm: 450,
    weight_kg: 33.30,
    volume_m3: 0.3120,
    pack_type: '1PC/CTN',
    carton_length_mm: 1550,
    carton_width_mm: 510,
    carton_height_mm: 400,
    materials: [
      { part: 'cabinet_leg', material: 'Malaysian Oak', finish: 'Black', code: '114' },
      { part: 'cabinet_body', material: 'MDF+Ash Veneer', finish: 'Natural', code: '102' },
    ],
    colors: [
      { part: 'cabinet_leg', name: 'Black', code: '114', hex: '#1A1A1A' },
      { part: 'cabinet_frame', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'cabinet_door', name: 'Space Blue', code: '1325', hex: '#2A3B4D' },
    ],
    price_usd: 899,
    cost_usd: 450,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 7,
    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 3,
    is_active: true,
    is_new: true,
    is_bestseller: false,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    article_no: '133091',
    collection_id: 'col-castor',
    name: 'CASTOR COFFEE TABLE 114/102/1325',
    slug: 'castor-coffee-table-1141021325',
    description: 'Castor Coffee Table is a vibrant and playful take on mid-century modern design, perfect for adding a pop of personality to contemporary interiors.',
    short_description: 'Coffee table with tri-color palette: Black legs, Natural frame, Space Blue shelf.',
    width_mm: 400,
    depth_mm: 1000,
    height_mm: 450,
    weight_kg: 29.00,
    volume_m3: 0.1516,
    pack_type: '1PC/CTN',
    carton_length_mm: 1100,
    carton_width_mm: 460,
    carton_height_mm: 290,
    materials: [
      { part: 'table_leg', material: 'Malaysian Oak', finish: 'Black', code: '114' },
      { part: 'table_top', material: 'MDF+Ash Veneer', finish: 'Natural/Space Blue', code: '102/1325' },
    ],
    colors: [
      { part: 'table_leg', name: 'Black', code: '114', hex: '#1A1A1A' },
      { part: 'table_frame', name: 'Natural', code: '102', hex: '#8B7355' },
      { part: 'table_shelf', name: 'Space Blue', code: '1325', hex: '#2A3B4D' },
    ],
    price_usd: 499,
    cost_usd: 250,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 15,
    stock_reserved: 2,
    stock_incoming: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_new: false,
    is_bestseller: true,
    sort_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Dover Collection
  {
    id: 'prod-8',
    article_no: '346036',
    collection_id: 'col-dover',
    name: 'DOVER 1.8M SIDEBOARD 109/113',
    slug: 'dover-18m-sideboard-109113',
    description: 'Dover 1.8m Sideboard is a masterfully engineered storage solution designed to introduce architectural clarity and a sophisticated, grounded energy to expansive contemporary living or dining environments.',
    short_description: '1.8m sideboard with Malaysian Oak legs, Walnut veneer body.',
    width_mm: 1800,
    depth_mm: 440,
    height_mm: 750,
    weight_kg: 73.60,
    volume_m3: 0.6308,
    pack_type: '1PC/CTN',
    carton_length_mm: 1860,
    carton_width_mm: 510,
    carton_height_mm: 665,
    materials: [
      { part: 'cabinet_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'cabinet_body', material: 'MDF+Walnut Veneer', finish: 'Walnut', code: '113' },
    ],
    colors: [
      { part: 'cabinet_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'cabinet_body', name: 'Walnut', code: '113', hex: '#3D2B1F' },
    ],
    price_usd: 1499,
    cost_usd: 750,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 5,
    stock_reserved: 1,
    stock_incoming: 3,
    low_stock_threshold: 2,
    is_active: true,
    is_new: false,
    is_bestseller: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    article_no: '336081',
    collection_id: 'col-dover',
    name: 'DOVER 1.8M TV CABINET 109/113',
    slug: 'dover-18m-tv-cabinet-109113',
    description: 'Dover 1.8m TV Cabinet is a masterfully refined media solution designed to provide a high-performance, executive feel to streamlined contemporary interiors.',
    short_description: '1.8m TV cabinet with Malaysian Oak legs, Walnut veneer body.',
    width_mm: 1800,
    depth_mm: 400,
    height_mm: 450,
    weight_kg: 48.80,
    volume_m3: 0.2972,
    pack_type: '1PC/CTN',
    carton_length_mm: 1851,
    carton_width_mm: 451,
    carton_height_mm: 356,
    materials: [
      { part: 'cabinet_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'cabinet_body', material: 'MDF+Walnut Veneer', finish: 'Walnut', code: '113' },
    ],
    colors: [
      { part: 'cabinet_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'cabinet_body', name: 'Walnut', code: '113', hex: '#3D2B1F' },
    ],
    price_usd: 1199,
    cost_usd: 600,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 8,

    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 3,
    is_active: true,
    is_new: true,
    is_bestseller: false,
    sort_order: 21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    article_no: '146139',
    collection_id: 'col-dover',
    name: 'DOVER 900X1800 DINING TABLE 109/113',
    slug: 'dover-900x1800-dining-table-109113',
    description: 'Dover Dining Table is a sophisticated expression of warmth and timeless design, meticulously crafted to serve as a prestigious centerpiece for the modern home.',
    short_description: '1800mm dining table with Malaysian Oak legs, Walnut veneer top.',
    width_mm: 900,
    depth_mm: 1800,
    height_mm: 750,
    weight_kg: 36.00,
    volume_m3: 0.2145,
    pack_type: '1PC/CTN',
    carton_length_mm: 1858,
    carton_width_mm: 954,
    carton_height_mm: 121,
    materials: [
      { part: 'table_leg', material: 'Malaysian Oak', finish: 'Cocoa', code: '109' },
      { part: 'table_top', material: 'MDF+Walnut Veneer', finish: 'Walnut', code: '113' },
    ],
    colors: [
      { part: 'table_leg', name: 'Cocoa', code: '109', hex: '#4A3728' },
      { part: 'table_top', name: 'Walnut', code: '113', hex: '#3D2B1F' },
    ],
    price_usd: 1099,
    cost_usd: 550,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 4,
    stock_reserved: 0,
    stock_incoming: 2,
    low_stock_threshold: 2,
    is_active: true,
    is_new: false,
    is_bestseller: true,
    sort_order: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Add more products as needed - this is a representative sample
];

// ============================================================
// PRODUCT VARIANTS (fabric/finish variations = separate SKUs)
// ============================================================
export const productVariants: ProductVariant[] = [
  // Breda variants - different color combinations
  {
    id: 'var-1',
    product_id: 'prod-1',
    article_no: '335048-109-167',
    name: 'BREDA 1.5M TV CABINET - Cocoa/White Marble',
    slug: 'breda-15m-tv-cabinet-cocoa-white-marble',
    price_usd: 899,
    stock_available: 8,
    stock_reserved: 1,
    stock_incoming: 0,
    variant_attributes: { finish: 'Cocoa/White Marble', leg_color: '109', top_color: '167' },
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'var-2',
    product_id: 'prod-2',
    article_no: '345049-109-167',
    name: 'BREDA 1.6M SIDEBOARD - Cocoa/White Marble',
    slug: 'breda-16m-sideboard-cocoa-white-marble',
    price_usd: 1299,
    stock_available: 5,
    stock_reserved: 1,
    stock_incoming: 3,
    variant_attributes: { finish: 'Cocoa/White Marble', leg_color: '109', top_color: '167' },
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Castor variants
  {
    id: 'var-3',
    product_id: 'prod-6',
    article_no: '335043-114-102-1325',
    name: 'CASTOR 1.5M TV CABINET - Black/Natural/Space Blue',
    slug: 'castor-15m-tv-cabinet-black-natural-space-blue',
    price_usd: 899,
    stock_available: 4,
    stock_reserved: 0,
    stock_incoming: 0,
    variant_attributes: { finish: 'Black/Natural/Space Blue', leg_color: '114', frame_color: '102', door_color: '1325' },
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Dover variants
  {
    id: 'var-4',
    product_id: 'prod-8',
    article_no: '346036-109-113',
    name: 'DOVER 1.8M SIDEBOARD - Cocoa/Walnut',
    slug: 'dover-18m-sideboard-cocoa-walnut',
    price_usd: 1499,
    stock_available: 3,
    stock_reserved: 1,
    stock_incoming: 2,
    variant_attributes: { finish: 'Cocoa/Walnut', leg_color: '109', body_color: '113' },
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// PRODUCT IMAGES
// ============================================================
export const productImages: ProductImage[] = [
  // Breda 1.5M TV Cabinet images
  { id: 'img-1', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - Cocoa finish', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-2', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-3', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/336057/336057-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - Front view', sort_order: 2, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-4', product_id: 'prod-1', url: 'https://mm.hinlim.com/cache/b2bfs/product/335072/335072-550x500.jpg', alt_text: 'Breda 1.5M TV Cabinet - Side view', sort_order: 3, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Breda 1.6M Sideboard images
  { id: 'img-5', product_id: 'prod-2', url: 'https://mm.hinlim.com/cache/b2bfs/product/345049/345049-550x500.jpg', alt_text: 'Breda 1.6M Sideboard - Cocoa finish', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-6', product_id: 'prod-2', url: 'https://mm.hinlim.com/cache/b2bfs/product/345049/345049-550x500.jpg', alt_text: 'Breda 1.6M Sideboard - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-7', product_id: 'prod-2', url: 'https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg', alt_text: 'Breda 1.6M Sideboard - Front view', sort_order: 2, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Breda 1.8M TV Cabinet images
  { id: 'img-8', product_id: 'prod-3', url: 'https://mm.hinlim.com/cache/b2bfs/product/336057/336057-550x500.jpg', alt_text: 'Breda 1.8M TV Cabinet - Cocoa finish', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-9', product_id: 'prod-3', url: 'https://mm.hinlim.com/cache/b2bfs/product/336057/336057-550x500.jpg', alt_text: 'Breda 1.8M TV Cabinet - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Breda Dining Table images
  { id: 'img-10', product_id: 'prod-4', url: 'https://mm.hinlim.com/cache/b2bfs/product/144071/144071-550x500.jpg', alt_text: 'Breda Dining Table - Cocoa legs', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-11', product_id: 'prod-4', url: 'https://mm.hinlim.com/cache/b2bfs/product/144071/144071-550x500.jpg', alt_text: 'Breda Dining Table - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Breda Working Desk images
  { id: 'img-12', product_id: 'prod-5', url: 'https://mm.hinlim.com/cache/b2bfs/product/123036/123036-550x500.jpg', alt_text: 'Breda Working Desk - Cocoa finish', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-13', product_id: 'prod-5', url: 'https://mm.hinlim.com/cache/b2bfs/product/123036/123036-550x500.jpg', alt_text: 'Breda Working Desk - White Marble top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Castor TV Cabinet images
  { id: 'img-14', product_id: 'prod-6', url: 'https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg', alt_text: 'Castor TV Cabinet - Black legs', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-15', product_id: 'prod-6', url: 'https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg', alt_text: 'Castor TV Cabinet - Natural frame', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-16', product_id: 'prod-6', url: 'https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg', alt_text: 'Castor TV Cabinet - Space Blue doors', sort_order: 2, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Castor Coffee Table images
    { id: 'img-17', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091-1500x1500.jpg', alt_text: 'Castor Coffee Table - Main view', sort_order: 0, is_primary: true, width: 1500, height: 1500, created_at: new Date().toISOString() },
    { id: 'img-18', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_3-1500x1500.jpg', alt_text: 'Castor Coffee Table - Angle view', sort_order: 1, is_primary: false, width: 1500, height: 1500, created_at: new Date().toISOString() },
    { id: 'img-19', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_5-1500x1500.jpg', alt_text: 'Castor Coffee Table - Side view', sort_order: 2, is_primary: false, width: 1500, height: 1500, created_at: new Date().toISOString() },
    { id: 'img-20', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_6-1500x1500.jpg', alt_text: 'Castor Coffee Table - Detail view', sort_order: 3, is_primary: false, width: 1500, height: 1500, created_at: new Date().toISOString() },
    { id: 'img-21', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_s1-1500x1500.jpg', alt_text: 'Castor Coffee Table - Shelf view', sort_order: 4, is_primary: false, width: 1500, height: 1500, created_at: new Date().toISOString() },
    // Castor Coffee Table thumbnails (130x110)
    { id: 'img-22', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091-130x110.jpg', alt_text: 'Castor Coffee Table - Thumbnail 1', sort_order: 5, is_primary: false, width: 130, height: 110, created_at: new Date().toISOString() },
    { id: 'img-23', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_3-130x110.jpg', alt_text: 'Castor Coffee Table - Thumbnail 2', sort_order: 6, is_primary: false, width: 130, height: 110, created_at: new Date().toISOString() },
    { id: 'img-24', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_5-130x110.jpg', alt_text: 'Castor Coffee Table - Thumbnail 3', sort_order: 7, is_primary: false, width: 130, height: 110, created_at: new Date().toISOString() },
    { id: 'img-25', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_6-130x110.jpg', alt_text: 'Castor Coffee Table - Thumbnail 4', sort_order: 8, is_primary: false, width: 130, height: 110, created_at: new Date().toISOString() },
    { id: 'img-26', product_id: 'prod-7', url: 'https://mm.hinlim.com/cache/b2bfs/product/133091/133091_s1-130x110.jpg', alt_text: 'Castor Coffee Table - Thumbnail 5', sort_order: 9, is_primary: false, width: 130, height: 110, created_at: new Date().toISOString() },

    // Dover Sideboard images
  { id: 'img-19', product_id: 'prod-8', url: 'https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg', alt_text: 'Dover Sideboard - Cocoa legs', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-20', product_id: 'prod-8', url: 'https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg', alt_text: 'Dover Sideboard - Walnut body', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Dover TV Cabinet images
  { id: 'img-21', product_id: 'prod-9', url: 'https://mm.hinlim.com/cache/b2bfs/product/336081/336081-550x500.jpg', alt_text: 'Dover TV Cabinet - Cocoa legs', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-22', product_id: 'prod-9', url: 'https://mm.hinlim.com/cache/b2bfs/product/336081/336081-550x500.jpg', alt_text: 'Dover TV Cabinet - Walnut body', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
  
  // Dover Dining Table images
  { id: 'img-23', product_id: 'prod-10', url: 'https://mm.hinlim.com/cache/b2bfs/product/146139/146139-550x500.jpg', alt_text: 'Dover Dining Table - Cocoa legs', sort_order: 0, is_primary: true, width: 550, height: 500, created_at: new Date().toISOString() },
  { id: 'img-24', product_id: 'prod-10', url: 'https://mm.hinlim.com/cache/b2bfs/product/146139/146139-550x500.jpg', alt_text: 'Dover Dining Table - Walnut top', sort_order: 1, is_primary: false, width: 550, height: 500, created_at: new Date().toISOString() },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getProductsByCollection(collectionId: string): Product[] {
  return products.filter(p => p.collection_id === collectionId && p.is_active);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug && p.is_active);
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductVariants(productId: string): ProductVariant[] {
  return productVariants.filter(v => v.product_id === productId && v.is_active);
}

export function getProductImages(productId: string): ProductImage[] {
  return productImages.filter(img => img.product_id === productId).sort((a, b) => a.sort_order - b.sort_order);
}

export function getCollectionsByBrand(brandId: string): Collection[] {
  return collections.filter(c => c.brand_id === brandId && c.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getAllActiveProducts(): Product[] {
  return products.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getNewArrivals(limit = 8): Product[] {
  return products.filter(p => p.is_active && p.is_new).sort((a, b) => b.sort_order - a.sort_order).slice(0, limit);
}

export function getBestsellers(limit = 8): Product[] {
  return products.filter(p => p.is_active && p.is_bestseller).sort((a, b) => b.sort_order - a.sort_order).slice(0, limit);
}

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter(p => p.is_active && (p.is_new || p.is_bestseller)).sort((a, b) => b.sort_order - a.sort_order).slice(0, limit);
}

export function formatPrice(price: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getColorHex(code: string): string {
  // Color code to hex mapping for common furniture finishes
  const colorMap: Record<string, string> = {
    '102': '#8B7355',  // Natural
    '109': '#4A3728',  // Cocoa
    '113': '#3D2B1F',  // Walnut
    '114': '#1A1A1A',  // Black
    '167': '#E8E0D8',  // White Marble
    '166': '#E8E0D8',  // White Marble (alt)
    '1001': '#8B7355', // Natural (alt)
    '802': '#4A3728',  // Cocoa (alt)
    '111': '#F5F0E8',  // White Wash
    '112': '#C8B8A8',  // Natural/White
    '1325': '#2A3B4D', // Space Blue
    '130': '#F8F8F8',  // White Lacquer
    '173': '#6B6B6B',  // Grey Marble
    '185': '#6B6B6B',  // Grey Marble (alt)
    '179': '#B8A898',  // Oak
    '1318': '#3D2B1F', // Walnut/Gunmetal
  };
  return colorMap[code] || '#CCCCCC';
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find(c => c.slug === slug && c.is_active);
}

export function getCollectionById(id: string): Collection | undefined {
  return collections.find(c => c.id === id && c.is_active);
}

export function getAllCollections(): Collection[] {
  return collections.filter(c => c.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find(b => b.slug === slug);
}