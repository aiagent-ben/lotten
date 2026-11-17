import { createServiceClient } from '@/lib/db/client';
import type {
  BrandTranslation,
  CollectionTranslation,
  LocaleTranslations,
  ProductTranslation,
} from '@/lib/types/database';

const PAGE_SIZE = 500;

export const BRAND_TRANSLATIONS: Record<string, { my: { description: string }; zh: { description: string } }> = {
  nesthouz: {
    my: { description: 'Koleksi perabot Kayu Oak Malaysia moden untuk ruang tamu dan ruang makan harian.' },
    zh: { description: '适合日常客厅与餐厅空间的现代马来西亚橡木家具系列。' },
  },
  nestnordic: {
    my: { description: 'Reka bentuk gaya Skandinavia dalam Kayu Oak Malaysia padu dengan garisan bersih dan hangat.' },
    zh: { description: '采用实木马来西亚橡木打造的北欧简约线条家具系列。' },
  },
  luooma: {
    my: { description: 'Rekaan kontemporari dengan gabungan kemasan tiga tona untuk ruang moden.' },
    zh: { description: '融合三色拼搭饰面的当代家居家具系列。' },
  },
};

export function translateFurnitureTitle(name: string, locale: 'my' | 'zh'): string {
  const replacementsMy: [RegExp, string][] = [
    [/\bMULTI FUNCTION CABINET\b/gi, 'Kabinet Serbaguna'],
    [/\bTALL SIDEBOARD\b/gi, 'Almari Sisi Tinggi'],
    [/\bDISPLAY CABINET\b/gi, 'Kabinet Pameran'],
    [/\bCHEST OF DRAWERS\b/gi, 'Laci Berlaci'],
    [/\bTV CABINET\b/gi, 'Kabinet TV'],
    [/\bSHOE CABINET\b/gi, 'Kabinet Kasut'],
    [/\bHIGHBOARD\b/gi, 'Almari Tinggi'],
    [/\bSIDEBOARD\b/gi, 'Almari Sisi'],
    [/\bCOFFEE TABLE\b/gi, 'Meja Kopi'],
    [/\bSIDE TABLE\b/gi, 'Meja Sisi'],
    [/\bCONSOLE TABLE\b/gi, 'Meja Konsol'],
    [/\bDINING TABLE\b/gi, 'Meja Makan'],
    [/\bCOUNTER TABLE\b/gi, 'Meja Kaunter'],
    [/\bBAR TABLE\b/gi, 'Meja Bar'],
    [/\bDINING CHAIR\b/gi, 'Kerusi Makan'],
    [/\bWORKING DESK\b/gi, 'Meja Kerja'],
    [/\bWRITING DESK\b/gi, 'Meja Tulis'],
    [/\bSTUDY DESK\b/gi, 'Meja Belajar'],
    [/\bBOOKSHELF\b/gi, 'Rak Buku'],
    [/\bBOOKCASE\b/gi, 'Rak Buku'],
    [/\bWARDROBE\b/gi, 'Almari Pakaian'],
    [/\bDRESSER\b/gi, 'Meja Solek'],
    [/\bKING BED\b/gi, 'Katil King'],
    [/\bQUEEN BED\b/gi, 'Katil Queen'],
    [/\bSINGLE BED\b/gi, 'Katil Bujang'],
    [/\bBED FRAME\b/gi, 'Rangka Katil'],
    [/\bNIGHTSTAND\b/gi, 'Meja Sisi Katil'],
    [/\bTV STAND\b/gi, 'Meja TV'],
    [/\bARMCHAIR\b/gi, 'Kerusi Berlengan'],
    [/\bSOFA\b/gi, 'Sofa'],
    [/\bBENCH\b/gi, 'Bangku'],
    [/\bMIRROR\b/gi, 'Cermin'],
    [/\bCHEST\b/gi, 'Peti Laci'],
    [/\bCABINET\b/gi, 'Kabinet'],
    [/\bCHAIR\b/gi, 'Kerusi'],
    [/\bDESK\b/gi, 'Meja'],
    [/\bTABLE\b/gi, 'Meja'],
    [/\bSTAND\b/gi, 'Rak'],
    [/\bBED\b/gi, 'Katil'],
  ];

  const replacementsZh: [RegExp, string][] = [
    [/\bMULTI FUNCTION CABINET\b/gi, '多功能收纳柜'],
    [/\bTALL SIDEBOARD\b/gi, '高身餐边柜'],
    [/\bDISPLAY CABINET\b/gi, '展示柜'],
    [/\bCHEST OF DRAWERS\b/gi, '斗柜'],
    [/\bTV CABINET\b/gi, '电视柜'],
    [/\bSHOE CABINET\b/gi, '鞋柜'],
    [/\bHIGHBOARD\b/gi, '高柜'],
    [/\bSIDEBOARD\b/gi, '餐边柜'],
    [/\bCOFFEE TABLE\b/gi, '茶几'],
    [/\bSIDE TABLE\b/gi, '边几'],
    [/\bCONSOLE TABLE\b/gi, '玄关桌'],
    [/\bDINING TABLE\b/gi, '餐桌'],
    [/\bCOUNTER TABLE\b/gi, '吧台桌'],
    [/\bBAR TABLE\b/gi, '高脚吧台'],
    [/\bDINING CHAIR\b/gi, '餐椅'],
    [/\bWORKING DESK\b/gi, '办公书桌'],
    [/\bWRITING DESK\b/gi, '书桌'],
    [/\bSTUDY DESK\b/gi, '学习桌'],
    [/\bBOOKSHELF\b/gi, '书架'],
    [/\bBOOKCASE\b/gi, '书柜'],
    [/\bWARDROBE\b/gi, '衣柜'],
    [/\bDRESSER\b/gi, '梳妆台'],
    [/\bKING BED\b/gi, '特大双人床'],
    [/\bQUEEN BED\b/gi, '双人床'],
    [/\bSINGLE BED\b/gi, '单人床'],
    [/\bBED FRAME\b/gi, '床架'],
    [/\bNIGHTSTAND\b/gi, '床头柜'],
    [/\bTV STAND\b/gi, '电视架'],
    [/\bARMCHAIR\b/gi, '扶手椅'],
    [/\bSOFA\b/gi, '沙发'],
    [/\bBENCH\b/gi, '长凳'],
    [/\bMIRROR\b/gi, '镜子'],
    [/\bCHEST\b/gi, '斗柜'],
    [/\bCABINET\b/gi, '储物柜'],
    [/\bCHAIR\b/gi, '椅子'],
    [/\bDESK\b/gi, '书桌'],
    [/\bTABLE\b/gi, '桌子'],
    [/\bSTAND\b/gi, '置物架'],
    [/\bBED\b/gi, '床'],
  ];

  let out = name;
  const rules = locale === 'my' ? replacementsMy : replacementsZh;
  for (const [pattern, target] of rules) {
    out = out.replace(pattern, target);
  }
  return out;
}

async function fetchAllRows<T>(table: string, selectCols: string): Promise<T[]> {
  const supabase = createServiceClient();
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const batch = (data || []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function runInBatches<T>(items: T[], batchSize: number, worker: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(worker));
  }
}

export interface SeedResult {
  brandsUpdated: number;
  collectionsUpdated: number;
  productsUpdated: number;
  totalBrands: number;
  totalCollections: number;
  totalProducts: number;
}

/**
 * Idempotently backfills missing starter `my` & `zh` translations for valid
 * brands, collections, and products without overwriting existing translations.
 */
export async function seedCatalogTranslations(): Promise<SeedResult> {
  const supabase = createServiceClient();

  const [brands, collections, products] = await Promise.all([
    fetchAllRows<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      translations: LocaleTranslations<BrandTranslation> | null;
    }>('brands', 'id, slug, name, description, translations'),
    fetchAllRows<{
      id: string;
      slug: string;
      name: string;
      description: string | null;
      translations: LocaleTranslations<CollectionTranslation> | null;
    }>('collections', 'id, slug, name, description, translations'),
    fetchAllRows<{
      id: string;
      name: string;
      short_description: string | null;
      translations: LocaleTranslations<ProductTranslation> | null;
    }>('products', 'id, name, short_description, translations'),
  ]);

  const brandUpdates: { id: string; translations: LocaleTranslations<BrandTranslation> }[] = [];
  for (const brand of brands) {
    if (!brand.name?.trim() || !brand.slug?.trim()) continue;

    const existing = brand.translations || {};
    if (existing.my !== undefined && existing.zh !== undefined) {
      continue;
    }

    const preset = BRAND_TRANSLATIONS[brand.slug];
    brandUpdates.push({
      id: brand.id,
      translations: {
        ...existing,
        my: existing.my ?? {
          name: brand.name,
          description: preset?.my.description || `Koleksi perabot ${brand.name}.`,
        },
        zh: existing.zh ?? {
          name: brand.name,
          description: preset?.zh.description || `${brand.name} 家具系列。`,
        },
      },
    });
  }

  const collectionUpdates: { id: string; translations: LocaleTranslations<CollectionTranslation> }[] = [];
  for (const coll of collections) {
    if (!coll.name?.trim() || !coll.slug?.trim()) continue;

    const existing = coll.translations || {};
    if (existing.my !== undefined && existing.zh !== undefined) {
      continue;
    }

    collectionUpdates.push({
      id: coll.id,
      translations: {
        ...existing,
        my: existing.my ?? {
          name: coll.name,
          description: `Koleksi ${coll.name} dalam Kayu Oak Malaysia terpilih dengan kemasan berkualiti tinggi.`,
        },
        zh: existing.zh ?? {
          name: coll.name,
          description: `${coll.name} 精选马来西亚橡木家具系列，提供多种质感饰面选择。`,
        },
      },
    });
  }

  const productUpdates: { id: string; translations: LocaleTranslations<ProductTranslation> }[] = [];
  for (const product of products) {
    if (!product.name?.trim()) continue;

    const existing = product.translations || {};
    if (existing.my !== undefined && existing.zh !== undefined) {
      continue;
    }

    const myName = existing.my?.name || translateFurnitureTitle(product.name, 'my');
    const zhName = existing.zh?.name || translateFurnitureTitle(product.name, 'zh');

    productUpdates.push({
      id: product.id,
      translations: {
        ...existing,
        my: existing.my ?? {
          name: myName,
          short_description: `${myName} — diperbuat daripada Kayu Oak Malaysia bermutu tinggi terus dari kilang.`,
        },
        zh: existing.zh ?? {
          name: zhName,
          short_description: `${zhName} — 精选优质马来西亚橡木打造，工厂直供。`,
        },
      },
    });
  }

  await runInBatches(brandUpdates, 10, async (item) => {
    const { error } = await supabase
      .from('brands')
      .update({ translations: item.translations })
      .eq('id', item.id);
    if (error) throw error;
  });

  await runInBatches(collectionUpdates, 20, async (item) => {
    const { error } = await supabase
      .from('collections')
      .update({ translations: item.translations })
      .eq('id', item.id);
    if (error) throw error;
  });

  await runInBatches(productUpdates, 25, async (item) => {
    const { error } = await supabase
      .from('products')
      .update({ translations: item.translations })
      .eq('id', item.id);
    if (error) throw error;
  });

  return {
    brandsUpdated: brandUpdates.length,
    collectionsUpdated: collectionUpdates.length,
    productsUpdated: productUpdates.length,
    totalBrands: brands.length,
    totalCollections: collections.length,
    totalProducts: products.length,
  };
}
