"use client";

import { ProductRecommendation } from '@/lib/recommendations/engine';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface RecommendationsCarouselProps {
  title: string;
  products: ProductRecommendation[];
  reason?: string;
  reasonDetail?: string;
  maxItems?: number;
  showReason?: boolean;
}

export function RecommendationsCarousel({
  title,
  products,
  reason,
  reasonDetail,
  maxItems = 4,
  showReason = true,
}: RecommendationsCarouselProps) {
  if (products.length === 0) return null;

  const displayProducts = products.slice(0, maxItems);

  return (
    <section className="py-12 bg-gray-50" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="heading-2 text-gray-900">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.slug}`}
              className="group block bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              aria-label={`View ${product.name}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                {product.images?.length > 0 && product.images[0].url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt_text || product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    placeholder="blur"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              
              {product.is_new && (
                <span className="absolute top-3 left-3 badge-primary badge-success text-xs px-2 py-1">New</span>
              )}
              {product.is_bestseller && (
                <span className="absolute top-3 right-3 badge-primary text-xs px-2 py-1">Best</span>
              )}
              {product.stock_available > 0 && product.stock_available <= 5 && (
                <span className="absolute bottom-3 left-3 badge-warning text-xs px-2 py-1">Low Stock</span>
              )}
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Article: {product.article_no}
              </p>
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                {product.name}
              </h3>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(product.price_usd)}
              </p>
              <div className="flex items-center gap-2">
                {product.is_new && <span className="badge-success badge-xs">New</span>}
                {product.is_bestseller && <span className="badge-primary badge-xs">Bestseller</span>}
                {product.stock_available > 0 ? (
                  <span className="badge-success badge-xs">In Stock</span>
                ) : (
                  <span className="badge-destructive badge-xs">Out of Stock</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);
}