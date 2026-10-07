import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getCsrfToken, validateCsrfToken } from './csrf';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('CSRF token validation', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  it('generates and sets a new token if not present in cookies', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const token = await getCsrfToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64); // 32 bytes hex
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'csrf_token',
      token,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
      })
    );
  });

  it('reuses existing token if present in cookies', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'existing-secret-token' });

    const token = await getCsrfToken();
    expect(token).toBe('existing-secret-token');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it('validates matching CSRF tokens correctly', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-token-123' });

    const isValid = await validateCsrfToken('valid-token-123');
    expect(isValid).toBe(true);
  });

  it('rejects mismatched or missing CSRF tokens', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-token-123' });

    expect(await validateCsrfToken('invalid-token')).toBe(false);
    expect(await validateCsrfToken('')).toBe(false);

    mockCookieStore.get.mockReturnValue(undefined);
    expect(await validateCsrfToken('any-token')).toBe(false);
  });
});
