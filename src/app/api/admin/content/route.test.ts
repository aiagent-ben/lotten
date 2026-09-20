import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as getContent, POST as postContent } from './route';
import { GET as getContentById, PUT as putContentById } from './[id]/route';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/db/client';

vi.mock('@/lib/auth/admin', () => ({
  verifyAdminAuth: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

describe('Admin Content API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase);
  });

  describe('GET /api/admin/content', () => {
    it('returns 401 when verifyAdminAuth fails', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest(new URL('/api/admin/content', 'http://localhost:3000'));
      const res = await getContent(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns paginated content when authenticated', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const mockContent = [
        {
          id: 'post-1',
          title: 'Care Guide 101',
          slug: 'care-guide-101',
          type: 'guide',
          status: 'published',
          category: 'care-guide',
          tags: ['oak', 'maintenance'],
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: mockContent, error: null, count: 1 }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      });

      const req = new NextRequest(new URL('/api/admin/content?page=1&perPage=10', 'http://localhost:3000'));
      const res = await getContent(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data[0].id).toBe('post-1');
      expect(data.data[0].title).toBe('Care Guide 101');
      expect(data.data[0].category).toBe('care-guide');
      expect(data.data[0].tags).toEqual(['oak', 'maintenance']);
      expect(data.count).toBe(1);
    });

    it('handles query error gracefully with status 500', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' }, count: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      });

      const req = new NextRequest(new URL('/api/admin/content', 'http://localhost:3000'));
      const res = await getContent(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST /api/admin/content', () => {
    it('creates content with all fields correctly', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      let insertedPayload: any = null;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'content_pages') {
          return {
            insert: vi.fn((payload) => {
              insertedPayload = payload;
              return {
                select: () => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'new-content-1', ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'content_categories') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cat-1' } }),
              }),
            }),
          };
        }
        if (table === 'content_page_categories') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'content_tags') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'tag-1' } }),
              }),
            }),
          };
        }
        if (table === 'content_page_tags') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const req = new NextRequest(new URL('/api/admin/content', 'http://localhost:3000'), {
        method: 'POST',
        body: JSON.stringify({
          title: 'Spring Lookbook',
          slug: 'spring-lookbook',
          type: 'lookbook',
          status: 'published',
          body_mdx: '# Spring Lookbook\nExplore our latest pieces.',
          category: 'styling-tips',
          tags: ['spring', 'living-room'],
          room_type: 'living-room',
          style_tags: ['modern', 'minimalist'],
          featured_products: ['prod-1', 'prod-2'],
          hotspots: [{ productId: 'prod-1', x: 50, y: 50, label: 'Table' }],
        }),
      });

      const res = await postContent(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('new-content-1');
      expect(insertedPayload.title).toBe('Spring Lookbook');
      expect(insertedPayload.slug).toBe('spring-lookbook');
      expect(insertedPayload.category).toBe('styling-tips');
      expect(insertedPayload.tags).toEqual(['spring', 'living-room']);
      expect(insertedPayload.room_type).toBe('living-room');
      expect(insertedPayload.style_tags).toEqual(['modern', 'minimalist']);
      expect(insertedPayload.featured_products).toEqual(['prod-1', 'prod-2']);
      expect(insertedPayload.published_at).toBeTruthy();
    });
  });

  describe('GET /api/admin/content/[id]', () => {
    it('returns single content item', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'content-1',
                title: 'Existing Article',
                slug: 'existing-article',
              },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest(new URL('/api/admin/content/content-1', 'http://localhost:3000'));
      const res = await getContentById(req, { params: Promise.resolve({ id: 'content-1' }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.id).toBe('content-1');
      expect(data.data.title).toBe('Existing Article');
    });

    it('returns 404 when content not found', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          }),
        }),
      });

      const req = new NextRequest(new URL('/api/admin/content/missing', 'http://localhost:3000'));
      const res = await getContentById(req, { params: Promise.resolve({ id: 'missing' }) });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/content/[id]', () => {
    it('updates content with all fields', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      let updatedPayload: any = null;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'content_pages') {
          return {
            update: vi.fn((payload) => {
              updatedPayload = payload;
              return {
                eq: () => ({
                  select: () => ({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'content-1', ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'content_page_categories') {
          return {
            delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'content_categories') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cat-1' } }),
              }),
            }),
          };
        }
        if (table === 'content_page_tags') {
          return {
            delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'content_tags') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'tag-1' } }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest(new URL('/api/admin/content/content-1', 'http://localhost:3000'), {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Care Guide',
          slug: 'updated-care-guide',
          type: 'guide',
          status: 'published',
          body_mdx: '# Updated Guide\nNew tips.',
          category: 'maintenance',
          tags: ['updated', 'wood'],
        }),
      });

      const res = await putContentById(req, { params: Promise.resolve({ id: 'content-1' }) });
      expect(res.status).toBe(200);
      expect(updatedPayload.title).toBe('Updated Care Guide');
      expect(updatedPayload.category).toBe('maintenance');
      expect(updatedPayload.tags).toEqual(['updated', 'wood']);
    });
  });
});
