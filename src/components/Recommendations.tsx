'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Sparkles, RotateCcw, Clock, ArrowRight } from 'lucide-react';

interface RecommendationProduct {
  id: string;
  article_no: string;
  name: string;
  slug: string;
  price_usd: number;
  images: Array<{ url: string; alt_text: string | null; is_primary: boolean }>;
  collection_id: string;
  collection_name: string;
  score: number;
  reason: string;
}

interface RecommendationSectionProps {
  title: string;
  icon: React.ReactNode;
  products: RecommendationProduct[];
  reason: string;
  showReason?: boolean;
  maxItems?: number;
}

function RecommendationSection({
  title,
  icon,
  products,
  reason,
  showReason = true,
  maxItems = 4,
}: RecommendationSectionProps) {
  if (!products.length) return null;

  const displayProducts = products.slice(0, maxItems);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        {showReason && (
          <span className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {reason}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block"
          >
            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[0]?.url}
                  alt={product.images[0]?.alt_text || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1 mb-2">#{product.article_no}</p>
            <p className="font-semibold text-gray-900">{formatPrice(product.price_usd)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface RecommendationsProps {
  productId: string;
  recentlyViewedIds?: string[];
  sections?: ('complementary' | 'coPurchased' | 'similar' | 'recentlyViewed' | 'trending')[];
}

export function ProductRecommendations({
  productId,
  recentlyViewedIds = [],
  sections = ['complementary', 'coPurchased', 'similar', 'recentlyViewed', 'trending'],
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{
    complementary: any[];
    coPurchased: any[];
    similar: any[];
    recentlyViewed: any[];
    trending: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const response = await fetch(`/api/recommendations?productId=${productId}&recentlyViewed=${recentlyViewedIds.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [productId, recentlyViewedIds.join(',')]);

  if (loading) {
    return (
      <div className="space-y-8">
        {['Complete the look', 'Customers also bought', 'Similar products', 'Recently viewed', 'Trending now'].map((title, i) => (
          <section key={i} className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-3">
                  <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Failed to load recommendations</div>;
  }

  if (!recommendations) return null;

  const sectionConfig = {
    complementary: {
      title: 'Complete the Look',
      icon: <Sparkles className="w-5 h-5 text-primary-600" />,
      products: recommendations.complementary,
      reason: 'Complete the look',
    },
    coPurchased: {
      title: 'Customers Also Bought',
      icon: <ShoppingBag className="w-5 h-5 text-primary-600" />,
      products: recommendations.coPurchased,
      reason: 'Frequently bought together',
    },
    similar: {
      title: 'Similar Products',
      icon: <RotateCcw className="w-5 h-5 text-primary-600" />,
      products: recommendations.similar,
      reason: 'Similar products',
    },
    recentlyViewed: {
      title: 'Recently Viewed',
      icon: <Clock className="w-5 h-5 text-primary-600" />,
      products: recommendations.recentlyViewed,
      reason: 'Your recent views',
    },
    trending: {
      title: 'Trending Now',
      icon: <Sparkles className="w-5 h-5 text-primary-600" />,
      products: recommendations.trending,
      reason: 'Popular right now',
    },
  };

  return (
    <div className="space-y-8">
      {sections.map((sectionKey) => {
        const config = sectionConfig[sectionKey as keyof typeof sectionConfig];
        if (!config || !config.products?.length) return null;

        return (
          <RecommendationSection
            key={sectionKey}
            title={config.title}
            icon={config.icon}
            products={config.products}
            reason={config.reason}
          />
        );
      })}
    </div>
  );
}

// Client-side recently viewed manager
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        try {
          setRecentlyViewed(JSON.parse(stored));
        } catch {
          setRecentlyViewed([]);
        }
      }
    }
  }, []);

  const addToRecentlyViewed = (productId: string) => {
    setRecentlyViewed((prev) => {
      const updated = [productId, ...prev.filter((id) => id !== productId)].slice(0, 20);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentlyViewed');
    }
  };

  return { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed };
}