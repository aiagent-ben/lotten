import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit, getClientIp, _resetRateLimitStore } from './rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('allows requests within the configured limit', () => {
    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(ip, 5, 1000)).toBe(true);
    }
  });

  it('blocks requests exceeding the configured limit', () => {
    const ip = '192.168.1.2';
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(ip, 3, 1000)).toBe(true);
    }
    // 4th request exceeds limit of 3
    expect(rateLimit(ip, 3, 1000)).toBe(false);
  });

  it('resets the limit counter after window expires', () => {
    vi.useFakeTimers();
    try {
      const ip = '192.168.1.3';
      expect(rateLimit(ip, 2, 1000)).toBe(true);
      expect(rateLimit(ip, 2, 1000)).toBe(true);
      expect(rateLimit(ip, 2, 1000)).toBe(false);

      // Advance clock past window
      vi.advanceTimersByTime(1001);

      expect(rateLimit(ip, 2, 1000)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  describe('getClientIp', () => {
    it('prioritizes cf-connecting-ip when present', () => {
      const req = new Request('http://localhost', {
        headers: {
          'cf-connecting-ip': '203.0.113.1',
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1, 10.0.0.1',
        },
      });
      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('falls back to x-real-ip when cf header is missing', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1',
        },
      });
      expect(getClientIp(req)).toBe('198.51.100.1');
    });

    it('extracts leftmost IP from x-forwarded-for if other headers are missing', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.0.2.5, 10.0.0.2',
        },
      });
      expect(getClientIp(req)).toBe('192.0.2.5');
    });

    it('returns unknown when no IP headers are present', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('unknown');
    });
  });
});
