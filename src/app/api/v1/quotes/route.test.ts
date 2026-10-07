import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getQuotes } from './route';
import { getAuthenticatedCustomer } from '@/lib/auth/user';
import { createServiceClient } from '@/lib/db/client';

vi.mock('@/lib/auth/user', () => ({
  getAuthenticatedCustomer: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  createServiceClient: vi.fn(),
}));

vi.mock('@/lib/actions/quote', () => ({
  generateQuote: vi.fn(),
  sendQuote: vi.fn(),
  reviseQuote: vi.fn(),
  acceptQuote: vi.fn(),
  rejectQuote: vi.fn(),
}));

vi.mock('@/lib/actions/stock', () => ({
  checkStockAvailability: vi.fn(),
}));

describe('Quotes API - Authorization & IDOR protection', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase);
  });

  it('Sad path: returns 401 when unauthenticated', async () => {
    vi.mocked(getAuthenticatedCustomer).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/v1/quotes?id=q-123');
    const res = await getQuotes(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('Sad path: returns 403 Forbidden when customer attempts to access another customer quote (IDOR)', async () => {
    vi.mocked(getAuthenticatedCustomer).mockResolvedValue({
      user: { id: 'auth-user-1', user_metadata: {} } as any,
      customer: { id: 'cust-1', auth_user_id: 'auth-user-1', email: 'cust1@example.com', is_active: true },
    });

    const mockQuote = {
      id: 'q-123',
      inquiry: { customer_id: 'other-cust-2' },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockQuote, error: null }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/v1/quotes?id=q-123');
    const res = await getQuotes(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('Happy path: returns quote when accessed by its owner', async () => {
    vi.mocked(getAuthenticatedCustomer).mockResolvedValue({
      user: { id: 'auth-user-1', user_metadata: {} } as any,
      customer: { id: 'cust-1', auth_user_id: 'auth-user-1', email: 'cust1@example.com', is_active: true },
    });

    const mockQuote = {
      id: 'q-123',
      quote_number: 'Q-2026-001-v1',
      inquiry: { customer_id: 'cust-1' },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockQuote, error: null }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/v1/quotes?id=q-123');
    const res = await getQuotes(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.quote.id).toBe('q-123');
  });

  it('Happy path: allows admin to view any quote regardless of customer ownership', async () => {
    vi.mocked(getAuthenticatedCustomer).mockResolvedValue({
      user: { id: 'admin-user-id', user_metadata: { role: 'admin' } } as any,
      customer: { id: 'admin-cust-id', auth_user_id: 'admin-user-id', email: 'admin@example.com', is_active: true },
    });

    const mockQuote = {
      id: 'q-999',
      inquiry: { customer_id: 'customer-abc' },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockQuote, error: null }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/v1/quotes?id=q-999');
    const res = await getQuotes(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
