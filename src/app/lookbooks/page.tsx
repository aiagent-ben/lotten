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
    }),
    getContentCategories('lookbook'),
  ]);

  const { data: lookbooks, count, totalPages } = contentResult;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-6">
          <ImageIcon className="w-4 h-4" />
          Lookbooks
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Room Inspiration</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Curated room sets featuring our Malaysian Oak collections. Shop the look directly from each lookbook.
        </p>
      </header>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-sm font-medium text-gray-500 self-center">Room:</span>
          <Link href="/lookbooks" className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">All</Link>
          {roomTypes.map((roomType) => (
            <Link 
              key={roomType.slug}
              href={`/lookbooks?room=${encodeURIComponent(roomType.slug)}`}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700"
            >
              {roomType.icon} {roomType.name}
            </Link>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-sm font-medium text-gray-500 self-center">Style:</span>
          <Link href="/lookbooks" className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">All</Link>
          {styleTags.map((styleTag) => (
            <Link 
              key={styleTag}
              href={`/lookbooks?style=${encodeURIComponent(styleTag)}`}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
            >
              {styleTag}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {lookbooks.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No lookbooks found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {lookbooks.map((lookbook) => (
                <article key={lookbook.id} className="card group overflow-hidden">
                  <Link href={`/lookbooks/${lookbook.slug}`} className="block">
                    <figure className="relative aspect-[4/3] overflow-hidden">
                      {lookbook.featured_image_url ? (
                        <Image
                          src={lookbook.featured_image_url}
                          alt={lookbook.featured_image_alt || lookbook.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {lookbook.room_type && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 text-xs bg-white/90 text-gray-900 rounded-full backdrop-blur-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lookbook.room_type}
                          </span>
                        </div>
                      )}
                    </figure>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                        {lookbook.title}
                      </h3>
                      {lookbook.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {lookbook.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {lookbook.style_tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {lookbook.style_tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                            +{lookbook.style_tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lookbook.featured_products?.length || 0} Products
                      </span>
                      <Link 
                        href={`/lookbooks/${lookbook.slug}`}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Shop the Look
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
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
                    className="btn-outline btn-sm"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link 
                    href={`/lookbooks?page=${page + 1}${room ? `&room=${encodeURIComponent(room)}` : ''}${style ? `&style=${encodeURIComponent(style)}` : ''}`}
                    className="btn-outline btn-sm"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}

            {/* CTA */}
            <div className="text-center py-12 bg-gray-50 rounded-2xl mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Want to Create Your Own Lookbook?</h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Our design team can help you visualize furniture in your space. Book a free virtual consultation.
              </p>
              <Link href="/contact" className="btn-primary inline-flex">
                Book Consultation
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}