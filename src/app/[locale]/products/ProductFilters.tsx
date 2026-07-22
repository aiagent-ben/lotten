"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
      const params = new URLSearchParams(searchParams.toString());
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

  const handleCollectionChange = (value: string) =>
    router.push(buildUrl("collection", value));
  const handleCategoryChange = (value: string) =>
    router.push(buildUrl("category", value));
  const handleSortChange = (value: string) =>
    // `featured` is the default — represented by absence of the param.
    router.push(buildUrl("sort", value === "featured" ? "" : value));

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Collection Filter */}
        <select
          value={collectionFilter}
          onChange={(e) => handleCollectionChange(e.target.value)}
          className="input w-full sm:w-64"
          aria-label="Filter by collection"
        >
          <option value="">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="input w-full sm:w-48"
          aria-label="Filter by category"
        >
          <option value="">All</option>
          <option value="new">New Arrivals</option>
          <option value="bestseller">Bestsellers</option>
        </select>
      </div>

      {/* Sort Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-gray-600">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortFilter}
          onChange={(e) => handleSortChange(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
          <option value="name-asc">Name: A-Z</option>
        </select>
      </div>
    </div>
  );
}
