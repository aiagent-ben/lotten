import { describe, expect, it } from 'vitest';
import {
  getCategorySlug,
  localizeBrand,
  localizeCollection,
  localizeContentPost,
  localizeProduct,
  toBcp47Locale,
  toHtmlLang,
  toOgLocale,
  toTermKey,
} from './localize';
import type { Brand, Collection, Product } from '@/lib/types/database';
import type { ContentPost } from '@/lib/data/content';

describe('i18n locale mapping helpers', () => {
  it('maps my -> ms / ms-MY / ms_MY cleanly', () => {
    expect(toHtmlLang('my')).toBe('ms');
    expect(toBcp47Locale('my')).toBe('ms-MY');
    expect(toOgLocale('my')).toBe('ms_MY');
    expect(toHtmlLang('zh')).toBe('zh');
    expect(toBcp47Locale('zh')).toBe('zh-MY');
    expect(toOgLocale('en')).toBe('en_MY');
  });

  it('normalizes canonical categories and material terms', () => {
    expect(getCategorySlug('Sofa & Armchair')).toBe('sofa-armchair');
    expect(getCategorySlug('tv stand')).toBe('tv-cabinet');
    expect(toTermKey('TABLE TOP')).toBe('table_top');
    expect(toTermKey('Light Tennessee Walnut')).toBe('light_tennessee_walnut');
    expect(toTermKey('MDF + Ash Veneer')).toBe('mdf_ash_veneer');
  });
});

describe('record localization overlays', () => {
  const baseBrand: Brand = {
    id: 'b1',
    name: 'NestHouZ',
    slug: 'nesthouz',
    description: 'English brand description',
    logo_url: null,
    sort_order: 1,
    translations: {
      my: { description: 'Penerangan jenama Bahasa' },
    },
    created_at: '',
    updated_at: '',
  };

  const baseCollection: Collection = {
    id: 'c1',
    brand_id: 'b1',
    name: 'Breda',
    slug: 'breda',
    description: 'English collection description',
    hero_image_url: null,
    color_palette: null,
    is_active: true,
    sort_order: 1,
    translations: {
      my: { name: 'Koleksi Breda', description: 'Penerangan Breda' },
    },
    brand: baseBrand,
    created_at: '',
    updated_at: '',
  };

  const baseProduct: Product = {
    id: 'p1',
    article_no: '335048',
    collection_id: 'c1',
    name: 'Breda 1.5M TV Cabinet',
    slug: 'breda-tv-cabinet',
    description: '<p>English full description</p>',
    short_description: 'English short description',
    width_mm: 1500,
    depth_mm: 400,
    height_mm: 500,
    weight_kg: 30,
    volume_m3: 0.2,
    pack_type: '1PC/CTN',
    carton_length_mm: null,
    carton_width_mm: null,
    carton_height_mm: null,
    materials: null,
    colors: null,
    price_usd: 200,
    cost_usd: null,
    moq: 1,
    lead_time_weeks: 8,
    stock_available: 10,
    stock_reserved: 0,
    stock_incoming: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_new: true,
    is_bestseller: false,
    sort_order: 1,
    translations: {
      my: { name: 'Kabinet TV Breda 1.5M', short_description: '' },
    },
    collection: baseCollection,
    created_at: '',
    updated_at: '',
  };

  it('overlays translated fields and falls back per-field when empty', () => {
    const localized = localizeProduct(baseProduct, 'my');
    expect(localized.name).toBe('Kabinet TV Breda 1.5M');
    // Blank short_description in `my` falls back to English
    expect(localized.short_description).toBe('English short description');
    expect(localized.collection?.name).toBe('Koleksi Breda');
    expect(localized.collection?.brand?.description).toBe('Penerangan jenama Bahasa');
    expect(localizeBrand(baseBrand, 'en').description).toBe('English brand description');
    expect(localizeCollection(baseCollection, 'en').name).toBe('Breda');
  });

  it('overlays hotspot labels/tooltips without losing canonical coordinates', () => {
    const post: ContentPost = {
      id: 'post-1',
      slug: 'japandi-room',
      title: 'Japandi Room',
      excerpt: 'English excerpt',
      body_mdx: 'English body',
      body_html: null,
      featured_image_url: null,
      featured_image_alt: null,
      type: 'lookbook',
      status: 'published',
      category: 'living-room',
      tags: ['oak'],
      published_at: null,
      scheduled_at: null,
      meta_title: 'Japandi Room',
      meta_description: 'English excerpt',
      og_image_url: null,
      canonical_url: null,
      read_time_minutes: 3,
      view_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: '',
      author_id: null,
      room_type: 'living-room',
      style_tags: ['japandi'],
      featured_products: ['p1'],
      hotspots: [{ productId: 'p1', x: 52, y: 72, label: 'TV Cabinet', tooltip: 'Warm Oak Cabinet' }],
      template: 'lookbook',
      translations: {
        my: {
          title: 'Ruang Tamu Japandi',
          hotspots: [{ productId: 'p1', label: 'Kabinet TV', tooltip: 'Kabinet Kayu Oak' }],
        },
      },
    };

    const localized = localizeContentPost(post, 'my');
    expect(localized.title).toBe('Ruang Tamu Japandi');
    expect(localized.meta_title).toBe('Ruang Tamu Japandi');
    expect(localized.hotspots[0]).toEqual({
      productId: 'p1',
      x: 52,
      y: 72,
      label: 'Kabinet TV',
      tooltip: 'Kabinet Kayu Oak',
    });
  });
});
