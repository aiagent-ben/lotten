import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get('csrf_token')?.value;
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    // Set cookie once per session — expires with the auth session
    cookieStore.set('csrf_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
  }
  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get('csrf_token')?.value;
  return !!stored && stored === token;
}