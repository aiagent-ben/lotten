import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateFurnitureTitle, seedCatalogTranslations } from './seed';
import { ensureI18nSchema } from './migrate';

const updateMock = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

let mockRows: {
  brands: Record<string, unknown>[];
  collections: Record<string, unknown>[];
  products: Record<string, unknown>[];
} = {
  brands: [],
  collections: [],
  products: [],
};

vi.mock('@/lib/db/client', () => ({
  createServiceClient: () => ({
    from: (table: 'brands' | 'collections' | 'products') => ({
      select: vi.fn().mockImplementation(() => ({
        order: vi.fn().mockImplementation(() => ({
          range: vi.fn().mockImplementation((from: number, to: number) =>
            Promise.resolve({
              data: mockRows[table].slice(from, to + 1),
              error: null,
            })
          ),
        })),
      })),
      update: updateMock,
    }),
  }),
}));

describe('i18n seed and migration helpers', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRows = { brands: [], collections: [], products: [] };
  });

  afterEach(() => {
    if (prevDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = prevDbUrl;
    }
  });

  it('skips DB migration gracefully when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const res = await ensureI18nSchema();
    expect(res).toEqual({
      applied: false,
      rolloutAlreadyComplete: false,
      addedTables: [],
      skippedReason: 'DATABASE_URL not set',
    });
  });

  it('translates production furniture titles cleanly with specific terms matched first', () => {
    expect(translateFurnitureTitle('BRINHILL TALL SIDEBOARD 802', 'my')).toBe(
      'BRINHILL Almari Sisi Tinggi 802'
    );
    expect(translateFurnitureTitle('BRINHILL TALL SIDEBOARD 802', 'zh')).toBe(
      'BRINHILL 高身餐边柜 802'
    );
    expect(translateFurnitureTitle('TORONTO WORKING DESK 1802', 'my')).toBe(
      'TORONTO Meja Kerja 1802'
    );
    expect(translateFurnitureTitle('TORONTO WORKING DESK 1802', 'zh')).toBe(
      'TORONTO 办公书桌 1802'
    );
  });

  it('skips blank brand rows and rows already initialized in my and zh', async () => {
    mockRows = {
      brands: [
        { id: 'blank-1', slug: '', name: '', description: ' furniture collection', translations: {} },
        {
          id: 'brand-1',
          slug: 'nesthouz',
          name: 'NestHouZ',
          description: 'NestHouZ',
          translations: {
            my: { name: 'NestHouZ', description: '' },
            zh: { name: 'NestHouZ', description: '已存在' },
          },
        },
        { id: 'brand-2', slug: 'loftus', name: 'Loftus', description: 'Loftus', translations: {} },
      ],
      collections: [
        { id: 'col-1', slug: 'breda', name: 'Breda', description: 'Breda', translations: {} },
      ],
      products: [
        { id: 'prod-1', name: 'SAMOS WORKING DESK', short_description: 'desc', translations: {} },
      ],
    };

    const res = await seedCatalogTranslations();
    expect(res).toEqual({
      brandsUpdated: 1,
      collectionsUpdated: 1,
      productsUpdated: 1,
      totalBrands: 3,
      totalCollections: 1,
      totalProducts: 1,
    });
    expect(updateMock).toHaveBeenCalledTimes(3);
  });
});
