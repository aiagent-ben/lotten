import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as getProducts, POST as postProducts } from './route';
import { GET as getProductById, PUT as putProductById } from './[id]/route';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/db/client';

vi.mock('@/lib/auth/admin', () => ({
  verifyAdminAuth: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

describe('Admin Products API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase);
  });

  describe('GET /api/admin/products', () => {
    it('Sad path: returns 401 when verifyAdminAuth fails', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest(new URL('/api/admin/products', 'http://localhost:3000'));
      const res = await getProducts(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('Happy path: returns paginated products when authenticated', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const mockProducts = [
        { id: 'prod-1', name: 'Alford Table', article_no: '145144', categories: ['Dining Room'] },
      ];

      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: mockProducts, error: null, count: 1 }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      });

      const req = new NextRequest(new URL('/api/admin/products?page=1&perPage=10', 'http://localhost:3000'));
      const res = await getProducts(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data[0].id).toBe('prod-1');
      expect(data.data[0].name).toBe('Alford Table');
      expect(data.data[0].categories).toEqual(['Dining Room']);
      expect(data.count).toBe(1);
    });
  });

  describe('POST /api/admin/products', () => {
    it('Sad path: returns 401 when verifyAdminAuth fails', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest(new URL('/api/admin/products', 'http://localhost:3000'), {
        method: 'POST',
        body: JSON.stringify({ name: 'New Table' }),
      });
      const res = await postProducts(req);

      expect(res.status).toBe(401);
    });

    it('Happy path: creates a product with normalized categories', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      let insertedPayload: any = null;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            insert: vi.fn((payload) => {
              insertedPayload = payload;
              return {
                select: () => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'new-prod-id', ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const productInput = {
        name: 'Breda Luxury Sofa',
        article_no: '109167',
        collection_id: 'coll-1',
        price_usd: '899.00',
        categories: ['living-room', 'sofa', 'Custom Tag'],
      };

      const req = new NextRequest(new URL('/api/admin/products', 'http://localhost:3000'), {
        method: 'POST',
        body: JSON.stringify(productInput),
      });

      const res = await postProducts(req);
      expect(res.status).toBe(200);

      expect(insertedPayload).not.toBeNull();
      expect(insertedPayload.categories).toEqual(['Living Room', 'Sofa & Armchair', 'Custom Tag']);
      expect(insertedPayload.name).toBe('Breda Luxury Sofa');
      expect(insertedPayload.article_no).toBe('109167');
    });
  });

  describe('PUT /api/admin/products/[id]', () => {
    it('Happy path: updates product categories and syncs variants/images', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      let updatedPayload: any = null;
      let deletedTables: string[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            update: vi.fn((payload) => {
              updatedPayload = payload;
              return {
                eq: () => ({
                  select: () => ({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'prod-123', ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'product_images' || table === 'product_variants') {
          return {
            delete: vi.fn(() => {
              deletedTables.push(table);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const updateInput = {
        name: 'Updated Sofa',
        article_no: '109167',
        collection_id: 'coll-1',
        price_usd: '950.00',
        categories: ['Mattress', 'bedroom'],
        images: [{ url: 'https://r2.dev/img.jpg', is_primary: true }],
        variants: [{ name: 'Velvet Blue', price_usd: 990, stock_available: 5 }],
      };

      const req = new NextRequest(new URL('/api/admin/products/prod-123', 'http://localhost:3000'), {
        method: 'PUT',
        body: JSON.stringify(updateInput),
      });

      const res = await putProductById(req, { params: Promise.resolve({ id: 'prod-123' }) });
      expect(res.status).toBe(200);

      expect(updatedPayload.categories).toEqual(['Mattress', 'Bedroom']);
      expect(deletedTables).toContain('product_images');
      expect(deletedTables).toContain('product_variants');
    });
  });
});
