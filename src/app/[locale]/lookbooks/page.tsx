import { Metadata } from 'next';
import { getContentList, getContentCategories } from '@/lib/data/content';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ChevronRight, Calendar, MapPin, Tag, Image as ImageIcon, ShoppingBag, ArrowRight, Grid, List } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    room?: string; 
    style?: string;
    search?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Lookbooks - Oak & Home',
    description: 'Curated room inspiration and shoppable lookbooks. Discover styled spaces featuring our Malaysian Oak furniture collections.',
  };
}

const roomTypes = [
  { slug: 'living-room', name: 'Living Room', icon: '🛋️' },
  { slug: 'bedroom', name: 'Bedroom', icon: '🛏️' },
  { slug: 'dining-room', name: 'Dining Room', icon: '🍽️' },
  { slug: 'office', name: 'Home Office', icon: '💻' },
  { slug: 'outdoor', name: 'Outdoor', icon: '🌿' },
];

const styleTags = [
  'modern', 'scandinavian', 'industrial', 'mid-century', 
  'minimalist', 'rustic', 'coastal', 'bohemian'
];

export default async function LookbooksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const room = params.room;
  const style = params.style;
  const search = params.search;

  const [contentResult, categories] = await Promise.all([
    getContentList({ 
      type: 'lookbook', 
      status: 'published', 
      page, 
      perPage: 12,
      room_type: room,
      style: style,
      search: search,
    }),
    getContentCategories('lookbook'),
  ]);

  const { data: lookbooks, count, totalPages } = contentResult;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-medium mb-4">
          <ImageIcon className="w-3.5 h-3.5" />
          Editorial Lookbooks
        </div>
        <h1 className="text-4xl lg:text-5xl font-serif font-medium text-stone-900 mb-4 tracking-tight">Room Inspiration</h1>
        <p className="text-lg text-stone-600 max-w-2xl leading-relaxed">
          Curated interior styling featuring our handcrafted Malaysian Oak collections. Explore spatial harmony and shop each look directly.
        </p>
      </header>

      {/* Filter Bar */}
      <div className="mb-10 space-y-4 p-5 rounded-2xl bg-stone-50 border border-stone-200/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">Room:</span>
          <Link 
            href={`/lookbooks${style ? `?style=${encodeURIComponent(style)}` : ''}`}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              !room 
                ? 'bg-stone-900 text-stone-50 shadow-sm' 
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            All Rooms
          </Link>
          {roomTypes.map((roomType) => {
            const isActive = room === roomType.slug;
            return (
              <Link 
                key={roomType.slug}
                href={`/lookbooks?room=${encodeURIComponent(roomType.slug)}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-stone-900 text-stone-50 shadow-sm' 
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>{roomType.icon}</span>
                <span>{roomType.name}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">Style:</span>
          <Link 
            href={`/lookbooks${room ? `?room=${encodeURIComponent(room)}` : ''}`}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              !style 
                ? 'bg-amber-800 text-white shadow-sm' 
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            All Styles
          </Link>
          {styleTags.map((styleTag) => {
            const isActive = style === styleTag;
            return (
              <Link 
                key={styleTag}
                href={`/lookbooks?style=${encodeURIComponent(styleTag)}${room ? `&room=${encodeURIComponent(room)}` : ''}`}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                  isActive 
                    ? 'bg-amber-800 text-white shadow-sm' 
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {styleTag}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        {lookbooks.length === 0 ? (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200/80">
            <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-900 mb-2">No lookbooks found</h3>
            <p className="text-stone-600 mb-4">Try clearing filters to see all room inspiration.</p>
            <Link href="/lookbooks" className="btn btn-secondary btn-sm inline-flex">
              Reset Filters
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
              {lookbooks.map((lookbook) => (
                <article key={lookbook.id} className="card group overflow-hidden border border-stone-200 hover:border-amber-700/40 hover:shadow-lg transition-all duration-300">
                  <Link href={`/lookbooks/${lookbook.slug}`} className="block">
                    <figure className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                      {lookbook.featured_image_url ? (
                        <Image
                          src={lookbook.featured_image_url}
                          alt={lookbook.featured_image_alt || lookbook.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-stone-400" />
                        </div>
                      )}
                      {lookbook.room_type && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 text-xs font-medium bg-stone-900/80 text-stone-100 rounded-full backdrop-blur-sm capitalize flex items-center gap-1.5 shadow-sm">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            {lookbook.room_type.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                    </figure>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {lookbook.style_tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-0.5 text-xs bg-amber-50 text-amber-800 border border-amber-200/50 rounded-full capitalize">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-2xl font-serif font-medium text-stone-900 group-hover:text-amber-800 transition-colors mb-2">
                        {lookbook.title}
                      </h3>
                      {lookbook.excerpt && (
                        <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed mb-4">
                          {lookbook.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between text-sm">
                    <span className="text-stone-500 font-medium flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-700" />
                      {lookbook.featured_products?.length || 0} Featured Pieces
                    </span>
                    <Link 
                      href={`/lookbooks/${lookbook.slug}`}
                      className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-medium text-sm transition-colors"
                    >
                      Shop the Look
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
                {page > 1 && (
                  <Link 
                    href={`/lookbooks?page=${page - 1}${room ? `&room=${encodeURIComponent(room)}` : ''}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 text-sm text-stone-600 tabular-nums">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link 
                    href={`/lookbooks?page=${page + 1}${room ? `&room=${encodeURIComponent(room)}` : ''}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}

            {/* CTA */}
            <div className="text-center py-12 bg-amber-50/60 border border-amber-200 rounded-2xl mt-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-4">Want to Create Your Own Lookbook?</h2>
              <p className="text-stone-600 mb-6 max-w-xl mx-auto">
                Our design team can help you visualize furniture in your space. Book a free virtual consultation.
              </p>
              <Link href="/contact" className="btn btn-primary inline-flex">
                Book Consultation
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}