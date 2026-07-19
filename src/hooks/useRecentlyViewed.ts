"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from '@/lib/types/database';

export type RecentlyViewedProduct = {
  id: string;
  name: string;
  slug: string;
  price_usd: number;
  images: { url: string; alt_text?: string; is_primary?: boolean }[];
  collection_id: string;
  is_new?: boolean;
  is_bestseller?: boolean;
};

const RECENTLY_VIEWED_KEY = "lotten_recently_viewed";
const MAX_RECENTLY_VIEWED = 20;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch {
      // Ignore parsing errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Add product to recently viewed
  const addToRecentlyViewed = useCallback((product: RecentlyViewedProduct) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front
      const updated = [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      
      return updated;
    });
  }, []);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Get recently viewed excluding a specific product (e.g., current product)
  const getRecentlyViewedExcluding = useCallback(
    (excludeId: string) => {
      return recentlyViewed.filter((p) => p.id !== excludeId);
    },
    [recentlyViewed]
  );

  return {
    recentlyViewed,
    isLoaded,
    addToRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewedExcluding,
  };
}