"use client";

import { useTranslations } from 'next-intl';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { RecentlyViewedCarousel } from '@/components/RecentlyViewedCarousel';

export default function ProductsPageClient() {
  const t = useTranslations('product');
  const { recentlyViewed } = useRecentlyViewed();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <RecentlyViewedCarousel
          products={recentlyViewed.slice(0, 8)}
          title={t('recently_viewed')}
          maxVisible={4}
        />
      </div>
    </section>
  );
}
