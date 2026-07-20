import { Metadata } from 'next';
import { getContentList, getContentCategories } from '@/lib/data/content';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ChevronRight, Calendar, Clock, Tag, BookOpen, Shield, Sparkles } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    category?: string; 
    tag?: string;
    search?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Care Guides - Oak & Home',
    description: 'Comprehensive care guides for your Malaysian Oak furniture. Learn how to maintain, clean, and protect your investment.',
  };
}

export default async function GuidesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category;
  const tag = params.tag;
  const search = params.search;

  const [contentResult, categories] = await Promise.all([
    getContentList({ 
      type: 'guide', 
      status: 'published', 
      page, 
      perPage: 12,
      category: category || undefined,
      tag: tag || undefined,
      search: search || undefined,
    }),
    getContentCategories('guide'),
  ]);

  const { data: guides, count, totalPages } = contentResult;

  const guideCategories = [
    { slug: 'care-guide', name: 'Care & Maintenance', icon: Shield, description: 'Protect and preserve your furniture' },
    { slug: 'cleaning', name: 'Cleaning Tips', icon: Sparkles, description: 'Safe cleaning methods for oak' },
    { slug: 'styling-tips', name: 'Styling Guides', icon: BookOpen, description: 'Design inspiration for your space' },
    { slug: 'assembly', name: 'Assembly Help', icon: BookOpen, description: 'Step-by-step assembly guides' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
          <BookOpen className="w-4 h-4" />
          Care Guides
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Furniture Care Guides</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Expert advice to keep your Malaysian Oak furniture looking beautiful for generations.
        </p>
      </header>

      {/* Category Quick Links */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {guideCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/guides?category=${encodeURIComponent(cat.slug)}`}
              className={`p-6 rounded-xl border-2 transition-all ${
                category === cat.slug
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <cat.icon className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/guides" 
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        !category ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Guides
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat}>
                      <Link 
                        href={`/guides?category=${encodeURIComponent(cat)}`} 
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          category === cat ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Tips Box */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
              <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Quick Tip
              </h4>
              <p className="text-sm text-primary-700">
                Dust weekly with a soft, dry microfiber cloth. Avoid harsh chemicals — a damp cloth with mild soap is all you need for deeper cleaning.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {guides.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No guides found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {guides.map((guide) => (
                  <article key={guide.id} className="card group overflow-hidden">
                    <Link href={`/guides/${guide.slug}`} className="block">
                      {guide.featured_image_url && (
                        <figure className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={guide.featured_image_url}
                            alt={guide.featured_image_alt || guide.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {guide.category && (
                            <div className="absolute top-3 left-3">
                              <span className="px-2 py-1 text-xs bg-white/90 text-gray-900 rounded-full backdrop-blur-sm">
                                {guide.category}
                              </span>
                            </div>
                          )}
                        </figure>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {guide.category && (
                            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                              {guide.category}
                            </span>
                          )}
                          {guide.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {guide.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                              +{guide.tags.length - 3}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                          {guide.title}
                        </h3>
                        {guide.excerpt && (
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {guide.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {guide.published_at && (
                          <time dateTime={guide.published_at} className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(guide.published_at), 'MMM d, yyyy')}
                          </time>
                        )}
                        {guide.read_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {guide.read_time_minutes} min
                          </span>
                        )}
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
                      href={`/guides?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
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
                      href={`/guides?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
                      className="btn-outline btn-sm"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}