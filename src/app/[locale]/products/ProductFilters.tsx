"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CANONICAL_CATEGORIES } from "@/lib/constants/categories";

interface ProductFiltersProps {
  collectionFilter: string;
  categoryFilter: string;
  sortFilter: string;
  collections: { id: string; name: string }[];
}

/**
 * Client-side filter bar for the products listing page.
 *
 * Uses `useRouter().push()` + `useSearchParams()` to apply filter changes
 * without `window.location` (which is undefined in Server Components).
 * The parent Server Component owns filter/sort/pagination logic; this
 * component only emits URL updates.
 */
export function ProductFilters({
  collectionFilter,
  categoryFilter,
  sortFilter,
  collections,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build a new URL string with the given key set/removed, dropping `page`.
  const buildUrl = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset pagination when filters change.
      params.delete("page");
      const query = params.toString();
      return `/products${query ? `?${query}` : ""}`;
    },
    [searchParams]
  );

  const handleCollectionChange = (value: string) => router.push(buildUrl("collection", value));
  const handleCategoryChange = (value: string) => router.push(buildUrl("category", value));
  const handleSortChange = (value: string) =>
    // `featured` is the default — represented by absence of the param.
    router.push(buildUrl("sort", value === "featured" ? "" : value));

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
              aria-label="Filter by collection"
            >
              <option value="">All Collections</option>
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
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <optgroup label="Highlights">
                <option value="new">New Arrivals</option>
                <option value="bestseller">Bestsellers</option>
              </optgroup>
              <optgroup label="Categories">
                {CANONICAL_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {cat.name}
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
            Sort by:
          </label>
          <div className="relative w-full sm:w-48">
            <select
              id="sort"
              value={sortFilter}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200 text-sm font-medium text-stone-800 shadow-xs hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="name-asc">Name: A-Z</option>
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
          <span className="text-xs font-medium text-stone-500">Active filters:</span>
          {collectionFilter && (
            <button
              onClick={() => handleCollectionChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Remove collection filter"
            >
              <span>{collections.find((c) => c.id === collectionFilter)?.name || "Collection"}</span>
              <span className="text-amber-700 font-bold">&times;</span>
            </button>
          )}
          {categoryFilter && (
            <button
              onClick={() => handleCategoryChange("")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Remove category filter"
            >
              <span>
                {categoryFilter === "new"
                  ? "New Arrivals"
                  : categoryFilter === "bestseller"
                  ? "Bestsellers"
                  : categoryFilter}
              </span>
              <span className="text-amber-700 font-bold">&times;</span>
            </button>
          )}
          <button
            onClick={() => router.push("/products")}
            className="text-xs text-stone-500 hover:text-amber-800 underline underline-offset-2 ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}