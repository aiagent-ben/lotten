import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyAdminAuth } from './admin';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/db/client';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

function makeRequest(opts: {
  path?: string;
  cookies?: { name: string; value: string }[];
  authHeader?: string;
}) {
  const req = new NextRequest(new URL(opts.path || '/api/admin/collections', 'http://localhost:3000'), {
    headers: opts.authHeader ? { authorization: opts.authHeader } : undefined,
  });
  if (opts.cookies) {
    for (const c of opts.cookies) {
      req.cookies.set(c.name, c.value);
    }
  }
  return req;
}

describe('verifyAdminAuth', () => {
  let mockServiceGetUser: ReturnType<typeof vi.fn>;
  let mockServiceFrom: ReturnType<typeof vi.fn>;
  let mockSsrGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceGetUser = vi.fn();
    mockServiceFrom = vi.fn();
    mockSsrGetUser = vi.fn();

    vi.mocked(createServiceClient).mockReturnValue({
      auth: { getUser: mockServiceGetUser },
      from: mockServiceFrom,
    } as any);

    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockSsrGetUser },
    } as any);
  });

  it('Happy path: authorizes user with valid cookie session and active customer record', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-1' } }, error: null });
    mockServiceFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'cust-1', is_active: true }, error: null }),
        }),
      }),
    });

    const req = makeRequest({ cookies: [{ name: 'sb-token', value: 'valid-cookie' }] });
    const result = await verifyAdminAuth(req);

    expect(result).toBeNull();
    expect(createServerClient).toHaveBeenCalled();
  });

  it('Happy path: authorizes user with valid Bearer token header and active customer record', async () => {
    mockServiceGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-2' } }, error: null });
    mockServiceFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'cust-2', is_active: true }, error: null }),
        }),
      }),
    });

    const req = makeRequest({ authHeader: 'Bearer valid-jwt-token' });
    const result = await verifyAdminAuth(req);

    expect(result).toBeNull();
    expect(mockServiceGetUser).toHaveBeenCalledWith('valid-jwt-token');
  });

  it('Sad path: returns 401 when no cookies and no Bearer token are provided', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const req = makeRequest({});
    const result = await verifyAdminAuth(req);

    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
    const body = await result?.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('Sad path: returns 401 when cookie session is invalid or expired', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Token expired') });

    const req = makeRequest({ cookies: [{ name: 'sb-token', value: 'expired-token' }] });
    const result = await verifyAdminAuth(req);

    expect(result?.status).toBe(401);
  });

  it('Sad path: returns 403 when user exists in auth but customer profile is_active is false', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: { id: 'deactivated-admin' } }, error: null });
    mockServiceFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'cust-3', is_active: false }, error: null }),
        }),
      }),
    });

    const req = makeRequest({ cookies: [{ name: 'sb-token', value: 'valid-cookie' }] });
    const result = await verifyAdminAuth(req);

    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body).toEqual({ error: 'Forbidden' });
  });

  it('Sad path: returns 403 when user exists in auth but has no customer profile at all', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: { id: 'orphan-user' } }, error: null });
    mockServiceFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });

    const req = makeRequest({ cookies: [{ name: 'sb-token', value: 'valid-cookie' }] });
    const result = await verifyAdminAuth(req);

    expect(result?.status).toBe(403);
  });

  it('Edge case: malformed Authorization header falls back to cookies or returns 401', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const reqEmptyBearer = makeRequest({ authHeader: 'Bearer ' });
    const resEmpty = await verifyAdminAuth(reqEmptyBearer);
    expect(resEmpty?.status).toBe(401);

    const reqBasic = makeRequest({ authHeader: 'Basic user:pass' });
    const resBasic = await verifyAdminAuth(reqBasic);
    expect(resBasic?.status).toBe(401);
  });

  it('Edge case: database error when querying customers returns 500', async () => {
    mockSsrGetUser.mockResolvedValue({ data: { user: { id: 'admin-user' } }, error: null });
    mockServiceFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: '50000', message: 'DB connection error' } }),
        }),
      }),
    });

    const req = makeRequest({ cookies: [{ name: 'sb-token', value: 'valid' }] });
    const result = await verifyAdminAuth(req);

    expect(result?.status).toBe(500);
    const body = await result?.json();
    expect(body).toEqual({ error: 'Internal Server Error' });
  });
});
