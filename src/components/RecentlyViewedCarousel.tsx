"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  price_usd: number;
  images: { url: string; alt_text?: string; is_primary?: boolean }[];
  collection_id: string;
  is_new?: boolean;
  is_bestseller?: boolean;
}

interface RecentlyViewedCarouselProps {
  products: RecentlyViewedProduct[];
  title?: string;
  maxVisible?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function RecentlyViewedCarousel({
  products,
  title = "Recently Viewed",
  maxVisible = 4,
  autoPlay = false,
  autoPlayInterval = 5000,
}: RecentlyViewedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalPages = Math.ceil(products.length / maxVisible);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(pageIndex);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1 >= totalPages ? 0 : currentIndex + 1;
    goToPage(nextIndex);
  };

  const goPrev = () => {
    const prevIndex = currentIndex - 1 < 0 ? totalPages - 1 : currentIndex - 1;
    goToPage(prevIndex);
  };

  // Auto-play
  // useEffect(() => {
  //   if (!autoPlay || totalPages <= 1) return;
  //   const interval = setInterval(goNext, autoPlayInterval);
  //   return () => clearInterval(interval);
  // }, [autoPlay, totalPages, autoPlayInterval]);

  const visibleProducts = products.slice(
    currentIndex * maxVisible,
    (currentIndex + 1) * maxVisible
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16" aria-labelledby="recently-viewed-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 id="recently-viewed-heading" className="heading-2 text-gray-900">
            {title}
          </h2>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={isAnimating}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-1.5" role="tablist" aria-label="Carousel pages">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentIndex
                        ? "bg-amber-600 w-6"
                        : "bg-gray-300 hover:bg-gray-400"
                    )}
                    role="tab"
                    aria-selected={i === currentIndex}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={goNext}
                disabled={isAnimating}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="relative" style={{ overflow: "hidden" }}>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            role="list"
            style={{
              display: "flex",
              transform: `translateX(-${currentIndex * (100 / totalPages)}%)`,
              transition: "transform 300ms ease-out",
              width: `${totalPages * 100}%`,
            }}
          >
            {visibleProducts.map((product) => {
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
              
              return (
                <article
                  key={product.id}
                  className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex-shrink-0"
                  role="listitem"
                  style={{ width: `${100 / maxVisible}%`, minWidth: "280px" }}
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block"
                    aria-label={`View ${product.name}`}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          placeholder="blur"
                          loading="lazy"
                          quality={85}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between">
                        {product.is_new && (
                          <span className="badge-primary badge-success text-xs px-2 py-1">New</span>
                        )}
                        {product.is_bestseller && (
                          <span className="badge-primary text-xs px-2 py-1">Bestseller</span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <p className="caption text-amber-700 font-medium mb-1">
                        {getCollectionName(product.collection_id)}
                      </p>
                      <h3 className="product-card-title font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {product.name}
                      </h3>
                      <p className="product-card-price text-lg font-bold text-gray-900">
                        {formatPrice(product.price_usd)}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper function to get collection name from collection_id
function getCollectionName(collectionId: string): string {
  const collectionsMap: Record<string, string> = {
    'col-breda': 'Breda',
    'col-dover': 'Dover',
    'col-malton': 'Malton',
    'col-lamar': 'Lamar',
    'col-kyoto': 'Kyoto',
    'col-dudley': 'Dudley',
    'col-ludlow': 'Ludlow',
    'col-loftus': 'Loftus',
    'col-hutto': 'Hutto',
    'col-royston': 'Royston',
    'col-oruro': 'Oruro',
    'col-waldo': 'Waldo',
    'col-castor': 'Castor',
    'col-hayton': 'Hayton',
    'col-neath': 'Neath',
    'col-hampton': 'Hampton',
    'col-noud': 'Noud',
    'col-nakula': 'Nakula',
  };
  return collectionsMap[collectionId] || 'Collection';
}