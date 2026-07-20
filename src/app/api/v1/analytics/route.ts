import { NextResponse } from 'next/server';
import { 
  getConversionFunnel, 
  getCohortAnalysis, 
  getRevenueMetrics, 
  getTopProducts,
  trackEvent 
} from '@/lib/analytics/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    switch (type) {
      case 'funnel': {
        const funnel = await getConversionFunnel('view_to_order', startDate, endDate);
        return NextResponse.json({ funnel });
      }
      case 'cohort': {
        const cohortType = searchParams.get('cohortType') || 'monthly';
        const cohorts = await getCohortAnalysis(cohortType as 'monthly' | 'weekly', 12);
        return NextResponse.json({ cohorts });
      }
      case 'revenue': {
        const revenue = await getRevenueMetrics(startDate, endDate);
        return NextResponse.json({ revenue });
      }
      case 'top_products': {
        const periodParam = searchParams.get('period') || 'month';
        const limit = parseInt(searchParams.get('limit') || '10');
        const topProducts = await getTopProducts(limit, periodParam as 'week' | 'month' | 'quarter');
        return NextResponse.json({ products: topProducts });
      }
      default: {
        // Default: return dashboard summary
        const [funnelData, revenueData, topProductsData] = await Promise.all([
          getConversionFunnel('view_to_order', startDate, endDate),
          getRevenueMetrics(startDate, endDate),
          getTopProducts(5, 'month'),
        ]);
        
        return NextResponse.json({
          funnel: funnelData,
          revenue: revenueData,
          topProducts: topProductsData,
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
        });
      }
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, properties } = body;
    
    if (!eventType || !properties) {
      return NextResponse.json(
        { error: 'eventType and properties are required' },
        { status: 400 }
      );
    }
    
    await trackEvent(eventType, properties);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}