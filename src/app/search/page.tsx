import { Metadata } from 'next';
import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search and filter Lotten\'s curated Malaysian Oak furniture collection',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-500">Loading search...</div></div>}>
      <SearchPageClient />
    </Suspense>
  );
}