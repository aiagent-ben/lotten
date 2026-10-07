import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as uploadImage, DELETE as deleteImage } from './route';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { S3Client } from '@aws-sdk/client-s3';

vi.mock('@/lib/auth/admin', () => ({
  verifyAdminAuth: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => {
  const sendMock = vi.fn().mockResolvedValue({});
  return {
    S3Client: class {
      send = sendMock;
    },
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  };
});

describe('Admin Image Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/upload/image', () => {
    it('returns 401 when verifyAdminAuth fails', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const req = new NextRequest(new URL('/api/admin/upload/image', 'http://localhost:3000'), {
        method: 'POST',
      });
      const res = await uploadImage(req);
      expect(res.status).toBe(401);
    });

    it('rejects unsupported file mime types', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const formData = new FormData();
      const fakeFile = new File(['executable content'], 'exploit.sh', { type: 'application/x-sh' });
      formData.append('file', fakeFile);

      const req = new NextRequest(new URL('/api/admin/upload/image', 'http://localhost:3000'), {
        method: 'POST',
        body: formData,
      });

      const res = await uploadImage(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid file type');
    });
  });

  describe('DELETE /api/admin/upload/image', () => {
    it('returns 400 when key is missing', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/admin/upload/image', 'http://localhost:3000'), {
        method: 'DELETE',
      });

      const res = await deleteImage(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('No key provided');
    });

    it('rejects keys attempting path traversal or outside allowed prefixes', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      // Traversal attempt
      const reqTraversal = new NextRequest(
        new URL('/api/admin/upload/image?key=products/../../../etc/passwd', 'http://localhost:3000'),
        { method: 'DELETE' }
      );
      const resTraversal = await deleteImage(reqTraversal);
      expect(resTraversal.status).toBe(400);

      // Unauthorized prefix attempt
      const reqPrefix = new NextRequest(
        new URL('/api/admin/upload/image?key=secrets/db-backup.sql', 'http://localhost:3000'),
        { method: 'DELETE' }
      );
      const resPrefix = await deleteImage(reqPrefix);
      expect(resPrefix.status).toBe(400);
    });

    it('successfully processes delete for authorized prefix without path traversal', async () => {
      vi.mocked(verifyAdminAuth).mockResolvedValue(null);

      const req = new NextRequest(
        new URL('/api/admin/upload/image?key=products/12345-sample.webp', 'http://localhost:3000'),
        { method: 'DELETE' }
      );

      const res = await deleteImage(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
