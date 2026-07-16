import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';

export async function GET() {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single();
    
  if (error) {
    // Return defaults if no settings found
    return NextResponse.json({ 
      data: {
        price_display_mode: 'MYR',
        show_cost_price: false,
        show_margin: false,
        tax_included: true,
        tax_rate: 0,
        default_currency: 'MYR',
        supported_currencies: ['MYR', 'USD', 'SGD', 'THB'],
        exchange_rates: { MYR: 1, USD: 0.21, SGD: 0.28, THB: 7.5 },
        auto_update_rates: false,
        show_stock_levels: true,
        show_low_stock_threshold: true,
        show_incoming_stock: false,
        stock_visibility: 'all',
        allow_backorder: false,
        backorder_threshold: 0,
        maintenance_mode: false,
        maintenance_message: 'We are currently performing scheduled maintenance. Please check back soon.',
        maintenance_allowed_ips: '',
        maintenance_start: '',
        maintenance_end: '',
        site_name: 'Lotten',
        site_tagline: 'Premium Furniture Marketplace',
        contact_email: 'info@lotten.com',
        support_email: 'support@lotten.com',
        company_name: 'Lotten Sdn Bhd',
        company_address: 'Kuala Lumpur, Malaysia',
        company_phone: '+60 3-xxxx-xxxx',
        company_registration: 'XXXXXX-X',
      }
    });
  }
  
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      id: 'default',
      ...body,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}