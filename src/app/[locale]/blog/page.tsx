import { Metadata } from 'next';
import { getContentList, getContentCategories } from '@/lib/data/content';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ChevronRight, Calendar, Clock, Tag, BookOpen, Shield, Sparkles, ArrowRight, Grid, List } from 'lucide-react';

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
    title: 'Blog - Oak & Home',
    description: 'Latest news, trends, and inspiration from Oak & Home. Discover Malaysian Oak furniture insights, styling tips, and design trends.',
  };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category;
  const tag = params.tag;
  const search = params.search;

  const [contentResult, categories] = await Promise.all([
    getContentList({ 
      type: 'blog', 
      status: 'published', 
      page, 
      perPage: 12,
      category: category || undefined,
      tag: tag || undefined,
      search: search || undefined,
    }),
    getContentCategories('blog'),
  ]);

  const { data: posts, count, totalPages } = contentResult;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-sm font-medium mb-6">
          <BookOpen className="w-4 h-4 text-amber-700" />
          Blog
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-stone-900 mb-4">Latest Articles</h1>
        <p className="text-xl text-stone-600 max-w-2xl">
          Design inspiration, furniture trends, and expert insights for your home.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            {/* Search */}
            <div>
              <label htmlFor="blog-search" className="sr-only">Search blog</label>
              <div className="relative">
                <input
                  type="search"
                  id="blog-search"
                  placeholder="Search articles..."
                  className="input w-full pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-stone-900 mb-4">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/blog" 
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        !category ? 'bg-amber-50 text-amber-900 font-medium' : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      All Posts
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat}>
                      <Link 
                        href={`/blog?category=${encodeURIComponent(cat)}`} 
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          category === cat ? 'bg-amber-50 text-amber-900 font-medium' : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Featured Post */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h4 className="font-semibold text-amber-950 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                Featured
              </h4>
              <Link href="/blog" className="text-sm font-medium text-amber-800 hover:text-amber-900 hover:underline">
                View all featured posts →
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-900 mb-2">No articles found</h3>
              <p className="text-stone-600">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 mb-8 ${
                posts.length === 1 
                  ? 'grid-cols-1' 
                  : posts.length === 2 
                  ? 'grid-cols-1 md:grid-cols-2' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {posts.map((post) => {
                  const isSingle = posts.length === 1;
                  return (
                    <article key={post.id} className="card group overflow-hidden border border-stone-200 hover:border-amber-200 transition-colors w-full">
                      <Link href={`/blog/${post.slug}`} className={`block ${isSingle && post.featured_image_url ? 'md:grid md:grid-cols-12' : ''}`}>
                        {post.featured_image_url && (
                          <figure className={`relative overflow-hidden ${
                            isSingle 
                              ? 'md:col-span-5 aspect-[16/10] md:aspect-auto md:min-h-full' 
                              : 'aspect-[4/3]'
                          }`}>
                            <Image
                              src={post.featured_image_url}
                              alt={post.featured_image_alt || post.title}
                              fill
                              sizes={isSingle ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {post.category && (
                              <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 text-xs bg-white/95 text-stone-900 font-medium rounded-full shadow-xs backdrop-blur-sm">
                                  {post.category}
                                </span>
                              </div>
                            )}
                          </figure>
                        )}
                        <div className={`p-6 ${isSingle ? 'md:p-8 ' + (post.featured_image_url ? 'md:col-span-7 flex flex-col justify-center' : '') : ''}`}>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.category && (
                              <span className="px-2.5 py-0.5 text-xs bg-amber-50 text-amber-900 font-medium border border-amber-200 rounded-full">
                                {post.category}
                              </span>
                            )}
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2.5 py-0.5 text-xs bg-stone-100 text-stone-700 font-medium rounded-full">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="px-2.5 py-0.5 text-xs bg-stone-100 text-stone-500 font-medium rounded-full">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <h3 className={`${isSingle ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg'} font-semibold text-stone-900 group-hover:text-primary transition-colors mb-3 line-clamp-2`}>
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className={`text-stone-600 ${isSingle ? 'text-base sm:text-lg line-clamp-4' : 'text-sm line-clamp-3'} mb-4 leading-relaxed`}>
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className={`px-6 pb-6 ${isSingle ? 'md:px-8 md:pb-6' : ''} border-t border-stone-100`}>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-500">
                          {post.published_at && (
                            <time dateTime={post.published_at} className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-stone-400" />
                              {format(new Date(post.published_at), 'MMM d, yyyy')}
                            </time>
                          )}
                          {post.read_time_minutes && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-stone-400" />
                              {post.read_time_minutes} min read
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
                  {page > 1 && (
                    <Link 
                      href={`/blog?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
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
                      href={`/blog?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
                      className="btn btn-outline btn-sm"
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