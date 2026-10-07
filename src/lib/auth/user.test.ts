import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthenticatedUser, getAuthenticatedCustomer } from './user';
import { createServiceClient } from '@/lib/db/client';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('User Authentication Helper (getAuthenticatedUser & getAuthenticatedCustomer)', () => {
  let mockServiceClient: any;
  let mockSsrClient: any;
  let mockCookieStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceClient = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    };
    vi.mocked(createServiceClient).mockReturnValue(mockServiceClient);

    mockSsrClient = {
      auth: { getUser: vi.fn() },
    };
    vi.mocked(createServerClient).mockReturnValue(mockSsrClient);

    mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  describe('getAuthenticatedUser', () => {
    it('authenticates via Authorization Bearer token header', async () => {
      mockServiceClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-token-123' } },
        error: null,
      });

      const req = new Request('http://localhost', {
        headers: { Authorization: 'Bearer test-jwt-token' },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toEqual({ id: 'user-token-123' });
      expect(mockServiceClient.auth.getUser).toHaveBeenCalledWith('test-jwt-token');
    });

    it('falls back to cookie session if no Bearer header is present', async () => {
      mockSsrClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-cookie-456' } },
        error: null,
      });

      const req = new Request('http://localhost');
      const user = await getAuthenticatedUser(req);

      expect(user).toEqual({ id: 'user-cookie-456' });
      expect(mockSsrClient.auth.getUser).toHaveBeenCalled();
    });

    it('returns null when neither token nor cookies are valid', async () => {
      mockSsrClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid session' },
      });

      const req = new Request('http://localhost');
      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });
  });

  describe('getAuthenticatedCustomer', () => {
    it('resolves active customer profile for authenticated user', async () => {
      mockSsrClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockCustomer = {
        id: 'cust-123',
        auth_user_id: 'user-123',
        email: 'user@example.com',
        is_active: true,
      };

      mockServiceClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCustomer, error: null }),
          }),
        }),
      });

      const result = await getAuthenticatedCustomer();
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe('user-123');
      expect(result?.customer.id).toBe('cust-123');
    });

    it('returns null if user has no customer database record', async () => {
      mockSsrClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-orphan' } },
        error: null,
      });

      mockServiceClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await getAuthenticatedCustomer();
      expect(result).toBeNull();
    });
  });
});
