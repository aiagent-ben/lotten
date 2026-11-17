"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPrice, cn } from "@/lib/utils";
import { getCollectionName } from "@/lib/collections";
import type { RecentlyViewedProduct } from "@/hooks/useRecentlyViewed";

interface RecentlyViewedCarouselProps {
  products: RecentlyViewedProduct[];
  title?: string;
  maxVisible?: number;
}

export function RecentlyViewedCarousel({
  products,
  title,
  maxVisible = 4,
}: RecentlyViewedCarouselProps) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);

  const headingTitle = title ?? t("recently_viewed");
  const totalPages = Math.ceil(products.length / maxVisible);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentIndex(pageIndex);
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
            {headingTitle}
          </h2>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                aria-label={tCommon("previous")}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-1.5" role="tablist" aria-label={t("carousel_pages_aria")}>
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
                    aria-label={t("go_to_page_aria", { page: i + 1 })}
                  />
                ))}
              </div>
              <button
                onClick={goNext}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                aria-label={tCommon("next")}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
          {visibleProducts.map((product) => {
            const primaryImage =
              product.product_images?.find((img) => img.is_primary) ||
              product.product_images?.[0];
            const localizedName =
              (locale !== "en" && product.translations?.[locale as "my" | "zh"]?.name) ||
              product.name;
            const localizedCollectionName =
              (locale !== "en" &&
                product.collection_translations?.[locale as "my" | "zh"]?.name) ||
              product.collection_name ||
              getCollectionName(product.collection_id, t("collection_fallback"));

            return (
              <article
                key={product.id}
                className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                role="listitem"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="block"
                  aria-label={t("view_product_aria", { name: localizedName })}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={localizedName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <span className="badge-primary badge-success text-xs px-2 py-1">
                          {t("new_badge")}
                        </span>
                      )}
                      {product.is_bestseller && (
                        <span className="badge-primary text-xs px-2 py-1">
                          {t("bestseller")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <p className="caption text-amber-700 font-medium mb-1">
                      {localizedCollectionName}
                    </p>
                    <h3 className="product-card-title font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                      {localizedName}
                    </h3>
                    <p className="product-card-price text-lg font-bold text-gray-900">
                      {product.price_usd > 0
                        ? formatPrice(product.price_usd, "MYR", locale)
                        : t("contact_for_price")}
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
