import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

function makeRequest(path: string) {
  return new NextRequest(new URL(path, 'http://localhost:3000'));
}

function mockSupabase(opts: {
  user?: { id: string } | null;
  profile?: { is_active: boolean } | null;
  settings?: Record<string, unknown> | null;
}) {
  const getUser = vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } });
  const signOut = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue(
          table === 'customers'
            ? { data: opts.profile ?? null }
            : { data: opts.settings !== undefined && opts.settings !== null ? { settings: opts.settings } : null }
        ),
      })),
    })),
  }));

  vi.mocked(createServerClient).mockReturnValue({ auth: { getUser, signOut }, from } as any);

  return { getUser, signOut, from };
}

// The module caches maintenance-mode settings at module scope, so each test
// gets a fresh import to avoid state leaking between cases.
async function loadProxy() {
  vi.resetModules();
  const mod = await import('./proxy');
  return mod.proxy;
}

describe('proxy - admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users from /admin to /admin/login with a redirect param', async () => {
    const { getUser } = mockSupabase({ user: null });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/products'));

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/admin/login');
    expect(location.searchParams.get('redirect')).toBe('/admin/products');
    expect(getUser).toHaveBeenCalled();
  });

  it('does not redirect /admin/login itself, even when unauthenticated', async () => {
    mockSupabase({ user: null });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/login'));

    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows an authenticated, active admin through to /admin/products', async () => {
    mockSupabase({
      user: { id: 'user-1' },
      profile: { is_active: true },
    });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/products'));

    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('signs out and redirects with an error when the user has no active customer profile', async () => {
    const { signOut } = mockSupabase({
      user: { id: 'user-1' },
      profile: { is_active: false },
    });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/products'));

    expect(signOut).toHaveBeenCalled();
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/admin/login');
    expect(location.searchParams.get('error')).toBe('Access denied');
  });

  it('signs out and redirects with an error when there is no customer profile at all', async () => {
    const { signOut } = mockSupabase({
      user: { id: 'user-1' },
      profile: null,
    });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/products'));

    expect(signOut).toHaveBeenCalled();
    const location = new URL(res.headers.get('location')!);
    expect(location.searchParams.get('error')).toBe('Access denied');
  });

  it('never redirects /admin to a locale-prefixed URL', async () => {
    mockSupabase({ user: { id: 'user-1' }, profile: { is_active: true } });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin'));

    // Would previously bounce to /en/admin before ever reaching the auth check.
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});

describe('proxy - api routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes /api/* requests through without checking auth', async () => {
    const { getUser } = mockSupabase({ user: null });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/api/admin/products'));

    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe('proxy - locale handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects a bare path to the default locale', async () => {
    mockSupabase({ user: null, settings: null });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/products'));

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/en/products');
  });

  it('passes locale-prefixed requests through when maintenance mode is off', async () => {
    mockSupabase({ user: null, settings: { maintenance_mode: false } });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/en/products'));

    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('proxy - maintenance mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rewrites non-maintenance pages to the maintenance page when enabled', async () => {
    mockSupabase({ user: null, settings: { maintenance_mode: true } });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/en/products'));

    expect(res.headers.get('x-middleware-rewrite')).toMatch(/\/en\/maintenance$/);
  });

  it('does not rewrite the maintenance page itself', async () => {
    mockSupabase({ user: null, settings: { maintenance_mode: true } });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/en/maintenance'));

    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('does not gate /admin routes behind maintenance mode', async () => {
    mockSupabase({
      user: { id: 'user-1' },
      profile: { is_active: true },
      settings: { maintenance_mode: true },
    });
    const proxy = await loadProxy();

    const res = await proxy(makeRequest('/admin/products'));

    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
