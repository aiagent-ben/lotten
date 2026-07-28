import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('newsletter_subscriptions').upsert({
      email: email.toLowerCase(),
      subscribed_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'email' });

    if (error) {
      console.error('Newsletter subscription error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}