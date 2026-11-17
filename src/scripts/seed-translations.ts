#!/usr/bin/env tsx
/**
 * Backfill / seed starter Bahasa Melayu (`my`) and Simplified Chinese (`zh`)
 * translations into Supabase `translations` JSONB columns for existing rows
 * without overwriting any manually curated translations.
 *
 * Usage: npx tsx src/scripts/seed-translations.ts
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createServiceClient } from '@/lib/db/client';
import type {
  BrandTranslation,
  CollectionTranslation,
  LocaleTranslations,
  ProductTranslation,
} from '@/lib/types/database';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BRAND_TRANSLATIONS: Record<string, { my: { description: string }; zh: { description: string } }> = {
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

function translateFurnitureTitle(name: string, locale: 'my' | 'zh'): string {
  const replacementsMy: [RegExp, string][] = [
    [/\bTV CABINET\b/gi, 'Kabinet TV'],
    [/\bCOFFEE TABLE\b/gi, 'Meja Kopi'],
    [/\bSIDE TABLE\b/gi, 'Meja Sisi'],
    [/\bCONSOLE TABLE\b/gi, 'Meja Konsol'],
    [/\bDINING TABLE\b/gi, 'Meja Makan'],
    [/\bDINING CHAIR\b/gi, 'Kerusi Makan'],
    [/\bCOUNTER TABLE\b/gi, 'Meja Kaunter'],
    [/\bBAR TABLE\b/gi, 'Meja Bar'],
    [/\bSIDEBOARD\b/gi, 'Almari Sisi'],
    [/\bWRITING DESK\b/gi, 'Meja Tulis'],
    [/\bSTUDY DESK\b/gi, 'Meja Belajar'],
    [/\bBOOKSHELF\b/gi, 'Rak Buku'],
    [/\bSHOE CABINET\b/gi, 'Kabinet Kasut'],
    [/\bBED FRAME\b/gi, 'Rangka Katil'],
    [/\bNIGHTSTAND\b/gi, 'Meja Sisi Katil'],
    [/\bBENCH\b/gi, 'Bangku'],
  ];

  const replacementsZh: [RegExp, string][] = [
    [/\bTV CABINET\b/gi, '电视柜'],
    [/\bCOFFEE TABLE\b/gi, '茶几'],
    [/\bSIDE TABLE\b/gi, '边几'],
    [/\bCONSOLE TABLE\b/gi, '玄关桌'],
    [/\bDINING TABLE\b/gi, '餐桌'],
    [/\bDINING CHAIR\b/gi, '餐椅'],
    [/\bCOUNTER TABLE\b/gi, '吧台桌'],
    [/\bBAR TABLE\b/gi, '高脚吧台'],
    [/\bSIDEBOARD\b/gi, '餐边柜'],
    [/\bWRITING DESK\b/gi, '书桌'],
    [/\bSTUDY DESK\b/gi, '学习桌'],
    [/\bBOOKSHELF\b/gi, '书架'],
    [/\bSHOE CABINET\b/gi, '鞋柜'],
    [/\bBED FRAME\b/gi, '床架'],
    [/\bNIGHTSTAND\b/gi, '床头柜'],
    [/\bBENCH\b/gi, '长凳'],
  ];

  let out = name;
  const rules = locale === 'my' ? replacementsMy : replacementsZh;
  for (const [pattern, target] of rules) {
    out = out.replace(pattern, target);
  }
  return out;
}

async function seedTranslations() {
  const supabase = createServiceClient();

  console.log('Seeding brand translations...');
  const { data: brands, error: brandErr } = await supabase.from('brands').select('id, slug, name, description, translations');
  if (brandErr) throw brandErr;

  for (const brand of brands || []) {
    const existing = (brand.translations as LocaleTranslations<BrandTranslation>) || {};
    const preset = BRAND_TRANSLATIONS[brand.slug];
    const next = {
      ...existing,
      my: {
        ...(existing.my || {}),
        name: existing.my?.name || brand.name,
        description: existing.my?.description || preset?.my.description || `Koleksi perabot ${brand.name}.`,
      },
      zh: {
        ...(existing.zh || {}),
        name: existing.zh?.name || brand.name,
        description: existing.zh?.description || preset?.zh.description || `${brand.name} 家具系列。`,
      },
    };
    await supabase.from('brands').update({ translations: next }).eq('id', brand.id);
  }

  console.log('Seeding collection translations...');
  const { data: collections, error: collErr } = await supabase.from('collections').select('id, name, description, translations');
  if (collErr) throw collErr;

  for (const coll of collections || []) {
    const existing = (coll.translations as LocaleTranslations<CollectionTranslation>) || {};
    const next = {
      ...existing,
      my: {
        ...(existing.my || {}),
        name: existing.my?.name || coll.name,
        description:
          existing.my?.description ||
          `Koleksi ${coll.name} dalam Kayu Oak Malaysia terpilih dengan kemasan berkualiti tinggi.`,
      },
      zh: {
        ...(existing.zh || {}),
        name: existing.zh?.name || coll.name,
        description:
          existing.zh?.description ||
          `${coll.name} 精选马来西亚橡木家具系列，提供多种质感饰面选择。`,
      },
    };
    await supabase.from('collections').update({ translations: next }).eq('id', coll.id);
  }

  console.log('Seeding product translations...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, short_description, translations');
  if (prodErr) throw prodErr;

  for (const product of products || []) {
    const existing = (product.translations as LocaleTranslations<ProductTranslation>) || {};
    const myName = existing.my?.name || translateFurnitureTitle(product.name, 'my');
    const zhName = existing.zh?.name || translateFurnitureTitle(product.name, 'zh');

    const next = {
      ...existing,
      my: {
        ...(existing.my || {}),
        name: myName,
        short_description:
          existing.my?.short_description ||
          `${myName} — diperbuat daripada Kayu Oak Malaysia bermutu tinggi terus dari kilang.`,
      },
      zh: {
        ...(existing.zh || {}),
        name: zhName,
        short_description:
          existing.zh?.short_description ||
          `${zhName} — 精选优质马来西亚橡木打造，工厂直供。`,
      },
    };
    await supabase.from('products').update({ translations: next }).eq('id', product.id);
  }

  console.log(`Seeded translations for ${brands?.length || 0} brands, ${collections?.length || 0} collections, ${products?.length || 0} products.`);
}

seedTranslations().catch((err) => {
  console.error('Failed to seed translations:', err);
  process.exit(1);
});
