import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getInquiries } from './route';
import { getAuthenticatedCustomer } from '@/lib/auth/user';
import { createServiceClient } from '@/lib/db/client';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/auth/user', () => ({
  getAuthenticatedCustomer: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

describe('Inquiries API - Session Binding & Authorization', () => {
  let mockSupabase: any;
  let mockCookieStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase);

    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  it('Sad path: returns 403 when session_id does not match the client session cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'legitimate-session-cookie' });

    const req = new Request('http://localhost:3000/api/v1/inquiries?session_id=attacker-session-id');
    const res = await getInquiries(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('Sad path: returns 401 for authenticated inquiry listing when no user session is present', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'some-cookie' });
    vi.mocked(getAuthenticatedCustomer).mockResolvedValue(null);

    // No session_id query param -> requests customer inquiries
    const req = new Request('http://localhost:3000/api/v1/inquiries');
    const res = await getInquiries(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('Happy path: allows reading inquiry when session_id matches the client cookie', async () => {
    const validSession = 'user-session-123';
    mockCookieStore.get.mockReturnValue({ value: validSession });

    const mockInquiry = { id: 'inq-1', session_id: validSession, status: 'draft' };
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockInquiry, error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const req = new Request(`http://localhost:3000/api/v1/inquiries?session_id=${validSession}`);
    const res = await getInquiries(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.inquiry.id).toBe('inq-1');
  });
});
