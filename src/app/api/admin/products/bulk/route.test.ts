import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as postBulkProducts } from './route';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/db/client';
import { validateCsrfToken } from '@/lib/csrf';

vi.mock('@/lib/auth/admin', () => ({
  verifyAdminAuth: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: vi.fn(),
}));

describe('POST /api/admin/products/bulk', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase);
  });

  it('Sad path: returns 401 when verifyAdminAuth fails', async () => {
    vi.mocked(verifyAdminAuth).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(new URL('/api/admin/products/bulk', 'http://localhost:3000'), {
      method: 'POST',
      body: JSON.stringify({ action: 'activate', productIds: ['p1'] }),
    });

    const res = await postBulkProducts(req);
    expect(res.status).toBe(401);
  });

  it('Sad path: returns 403 when CSRF token is provided but invalid', async () => {
    vi.mocked(verifyAdminAuth).mockResolvedValue(null);
    vi.mocked(validateCsrfToken).mockResolvedValue(false);

    const req = new NextRequest(new URL('/api/admin/products/bulk', 'http://localhost:3000'), {
      method: 'POST',
      body: JSON.stringify({ _csrf: 'bad-token', action: 'activate', productIds: ['p1'] }),
    });

    const res = await postBulkProducts(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Invalid CSRF token');
  });

  it('Sad path: returns 400 when productIds is missing or empty', async () => {
    vi.mocked(verifyAdminAuth).mockResolvedValue(null);
    vi.mocked(validateCsrfToken).mockResolvedValue(true);

    const req = new NextRequest(new URL('/api/admin/products/bulk', 'http://localhost:3000'), {
      method: 'POST',
      body: JSON.stringify({ action: 'activate', productIds: [] }),
    });

    const res = await postBulkProducts(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No product IDs provided');
  });

  it('Happy path: executes bulk activation when authenticated and authorized', async () => {
    vi.mocked(verifyAdminAuth).mockResolvedValue(null);
    vi.mocked(validateCsrfToken).mockResolvedValue(true);

    const inMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ in: inMock });
    mockSupabase.from.mockReturnValue({ update: updateMock });

    const req = new NextRequest(new URL('/api/admin/products/bulk', 'http://localhost:3000'), {
      method: 'POST',
      body: JSON.stringify({ _csrf: 'valid-token', action: 'activate', productIds: ['p1', 'p2'] }),
    });

    const res = await postBulkProducts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(updateMock).toHaveBeenCalledWith({ is_active: true });
    expect(inMock).toHaveBeenCalledWith('id', ['p1', 'p2']);
  });
});
