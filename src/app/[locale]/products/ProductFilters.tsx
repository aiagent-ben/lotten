"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CANONICAL_CATEGORIES } from "@/lib/constants/categories";
import { getCategorySlug } from "@/lib/i18n/localize";

interface ProductFiltersProps {
  collectionFilter: string;
  categoryFilter: string;
  sortFilter: string;
  collections: { id: string; name: string }[];
}

export function ProductFilters({
  collectionFilter,
  categoryFilter,
  sortFilter,
  collections,
}: ProductFiltersProps) {
  const t = useTranslations("product");
  const tCats = useTranslations("categories");
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      const query = params.toString();
      return `/products${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const handleCollectionChange = (value: string) => router.push(buildUrl("collection", value));
  const handleCategoryChange = (value: string) => router.push(buildUrl("category", value));
  const handleSortChange = (value: string) =>
    router.push(buildUrl("sort", value === "featured" ? "" : value));

  const getLocalizedCategoryLabel = (val: string) => {
    if (val === "new") return t("new_arrivals");
    if (val === "bestseller") return t("bestsellers");
    const slug = getCategorySlug(val);
    if (slug && tCats.has(slug)) return tCats(slug);
    return val;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Collection Filter */}
          <div className="relative w-full sm:w-60">
            <select
              value={collectionFilter}
              onChange={(e) => handleCollectionChange(e.target.value)}
              className="w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200 text-sm font-medium text-stone-800 shadow-xs hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all cursor-pointer"
              aria-label={t("filter_collection_aria")}
            >
              <option value="">{t("all_collections")}</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200 text-sm font-medium text-stone-800 shadow-xs hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all cursor-pointer"
              aria-label={t("filter_category_aria")}
            >
              <option value="">{t("all_categories")}</option>
              <optgroup label={t("highlights_group")}>
                <option value="new">{t("new_arrivals")}</option>
                <option value="bestseller">{t("bestsellers")}</option>
              </optgroup>
              <optgroup label={t("categories_group")}>
                {CANONICAL_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {tCats.has(cat.slug) ? tCats(cat.slug) : cat.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Sort Control */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wider text-stone-500 whitespace-nowrap">
            {t("sort_by")}
          </label>
          <div className="relative w-full sm:w-48">
            <select
              id="sort"
              value={sortFilter}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200 text-sm font-medium text-stone-800 shadow-xs hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all cursor-pointer"
            >
              <option value="featured">{t("sort_featured")}</option>
              <option value="price-asc">{t("sort_price_asc")}</option>
              <option value="price-desc">{t("sort_price_desc")}</option>
              <option value="newest">{t("sort_newest")}</option>
              <option value="name-asc">{t("sort_name_asc")}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(collectionFilter || categoryFilter) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <span className="text-xs font-medium text-stone-500">{t("active_filters")}</span>
          {collectionFilter && (
            <button
              onClick={() => handleCollectionChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              title={t("remove_collection_filter")}
            >
              <span>{collections.find((c) => c.id === collectionFilter)?.name || t("collection_fallback")}</span>
              <span className="text-amber-700 font-bold">&times;</span>
            </button>
          )}
          {categoryFilter && (
            <button
              onClick={() => handleCategoryChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              title={t("remove_category_filter")}
            >
              <span>{getLocalizedCategoryLabel(categoryFilter)}</span>
              <span className="text-amber-700 font-bold">&times;</span>
            </button>
          )}
          <button
            onClick={() => router.push("/products")}
            className="text-xs text-stone-500 hover:text-amber-800 underline underline-offset-2 ml-1 cursor-pointer"
          >
            {t("clear_all")}
          </button>
        </div>
      )}
    </div>
  );
}
