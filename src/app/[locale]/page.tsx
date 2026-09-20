import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedProducts, getAllActiveProducts, getCollectionBySlug } from '@/lib/data/products';
import { getContentList } from '@/lib/data/content';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import NewsletterForm from '@/components/NewsletterForm';
import { getCollectionName } from '@/lib/collections';
import { Factory, TreePine, ShieldCheck, BookOpen, ArrowRight, Clock, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lotten — Curated Malaysian Oak Furniture',
  description: 'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.',
};

export default async function HomePage() {
  const [featuredProducts, contentResult] = await Promise.all([
    getFeaturedProducts(8),
    getContentList({ status: 'published', limit: 3 }),
  ]);
  const recentPosts = contentResult.data;

  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      {/* Hero Section - Calm Editorial Style */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/hero-furniture.jpg)', filter: 'brightness(0.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-900/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-600/20 text-amber-100 text-sm font-medium mb-8 tracking-wide backdrop-blur-sm border border-amber-400/30">
              Direct from Manufacturer
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-6">
              Curated Malaysian Oak Furniture<br />for Modern Homes
            </h1>
            <p className="text-lg sm:text-xl text-amber-100/80 mb-10 max-w-2xl leading-relaxed">
              Discover timeless pieces crafted from premium Malaysian Oak. Direct from our workshop to your door — no middlemen, no markups, just honest furniture at honest prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all duration-200"
              >
                Shop Collection
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/collections"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto gap-8 text-center">
            <div className="py-4">
              <Factory className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-gray-900 mb-1">Direct from Workshop</h3>
              <p className="text-sm text-gray-500">No middlemen, honest factory pricing</p>
            </div>
            <div className="py-4">
              <TreePine className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-gray-900 mb-1">Solid Malaysian Oak</h3>
              <p className="text-sm text-gray-500">100% sustainably sourced timber</p>
            </div>
            <div className="py-4">
              <ShieldCheck className="mx-auto h-9 w-9 text-amber-700 mb-3" strokeWidth={1.5} />
              <h3 className="font-medium text-gray-900 mb-1">Quality Guaranteed</h3>
              <p className="text-sm text-gray-500">Heirloom standards, built to last</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections - Editorial Style */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 mb-4">Our Collections</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Each collection tells a story of craftsmanship, material, and design philosophy — curated for the way you live.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Breda */}
            <Link href="/collections/breda" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335048/335048-breda-1-5m-tv-cabinet-109167/0.webp"
                  alt="Breda Collection - TV cabinets and sideboards in warm walnut and natural finishes"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Breda
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full mb-3">NestHouZ</span>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Breda</h3>
                <p className="text-gray-600 mb-4">Working desks, TV cabinets and sideboards in warm Walnut/Natural combinations.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">Cocoa</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">White Marble</span>
                </div>
                <span className="text-sm font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 transition-colors">View 7 products →</span>
              </div>
            </Link>

            {/* Dover */}
            <Link href="/collections/dover" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/346036/346036-dover-1-8m-sideboard-109113/0.webp"
                  alt="Dover Collection - Complete living room sets with coffee tables, consoles and desks"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Dover
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-full mb-3">NestHouZ</span>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Dover</h3>
                <p className="text-gray-600 mb-4">Complete living room collections with coffee, console, side tables and desks.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-rose-100 text-rose-700">Walnut</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-rose-100 text-rose-700">Cocoa</span>
                </div>
                <span className="text-sm font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors">View 8 products →</span>
              </div>
            </Link>

            {/* Castor */}
            <Link href="/collections/castor" className="collection-card group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335043/335043-castor-1-5m-tv-cabinet-1141021325/0.webp"
                  alt="Castor Collection - Minimalist three-tone entertainment centers"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="collection-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Castor
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full mb-3">Luooma</span>
                <h3 className="font-display text-2xl font-semibold text-gray-900 mb-2">Castor</h3>
                <p className="text-gray-600 mb-4">Minimalist three-tone finish combinations for modern entertainment centers.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Black</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Natural</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Space Blue</span>
                </div>
                <span className="text-sm font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 transition-colors">View 5 products →</span>
              </div>
            </Link>
          </div>

          <div className="text-center mt-12 animate-slide-up">
            <Link href="/collections" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 hover:border-amber-300 transition-all">
              View All 19 Collections
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 animate-slide-up">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-lg text-gray-600">Handpicked bestsellers and new arrivals</p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 transition-colors"
            >
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {featuredProducts.map((product) => {
              const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  role="listitem"
                  aria-label={`View ${product.name}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.is_new && (
                        <span className="px-2 py-1 text-xs font-medium text-white bg-amber-600 rounded">New</span>
                      )}
                      {product.is_bestseller && (
                        <span className="px-2 py-1 text-xs font-medium text-white bg-black/70 rounded">Bestseller</span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                      {getCollectionName(product.collection_id)}
                    </p>
                    <h3 className="font-medium text-gray-900 mb-1.5 line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(product.price_usd)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-600/10 text-amber-700 text-sm font-medium mb-6">Our Philosophy</span>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 mb-6 leading-tight">Crafted with Intention,<br />Priced with Integrity</h2>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg leading-relaxed">Every piece of Lotten furniture begins in our Malaysian workshop, where sustainably sourced oak meets generations of woodworking expertise. We control the entire journey — from timber selection to final finish — so you receive heirloom-quality furniture without the showroom markup.</p>
                <p className="text-lg leading-relaxed">No middlemen. No inflated prices. Just honest craftsmanship delivered direct to your home.</p>
              </div>
              <Link href="/about" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-lg transition-colors">
                Read Our Story <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev/products/335048/335048-breda-1-5m-tv-cabinet-109167/0.webp"
                alt="Lotten workshop - craftsmen working on Malaysian Oak furniture"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories & Inspiration */}
      {recentPosts.length > 0 && (
        <section className="py-20 lg:py-28 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 animate-slide-up">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold tracking-wide uppercase mb-3">
                  <BookOpen className="w-3.5 h-3.5" />
                  Journal & Care Guides
                </span>
                <h2 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 mb-2">
                  Stories, Guides & Inspiration
                </h2>
                <p className="text-lg text-gray-600 max-w-xl">
                  Explore styling advice, timber care wisdom, and design philosophy direct from our craftspeople.
                </p>
              </div>
              <Link
                href="/blog"
                className="mt-4 sm:mt-0 text-sm font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors group"
              >
                View all articles
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post) => {
                const href = post.type === 'guide'
                  ? `/guides/${post.slug}`
                  : post.type === 'lookbook'
                  ? `/lookbooks/${post.slug}`
                  : post.type === 'page'
                  ? `/${post.slug}`
                  : `/blog/${post.slug}`;

                const typeBadge = post.type === 'guide'
                  ? 'Care Guide'
                  : post.type === 'lookbook'
                  ? 'Lookbook'
                  : post.type === 'page'
                  ? 'Page'
                  : 'Article';

                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-amber-200/60 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {post.featured_image_url ? (
                        <Image
                          src={post.featured_image_url}
                          alt={post.featured_image_alt || post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50/50">
                          <BookOpen className="w-12 h-12 text-amber-300/80 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                          {post.category ? post.category.replace(/-/g, ' ') : typeBadge}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(post.published_at), 'MMM d, yyyy')}
                            </span>
                          )}
                          {post.read_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {post.read_time_minutes} min read
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-xl font-semibold text-gray-900 mb-2.5 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center text-sm font-semibold text-amber-700 group-hover:text-amber-800">
                        Read Story
                        <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-20 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4">Stay Inspired</h2>
          <p className="text-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">Get design inspiration, new collection previews, and exclusive offers delivered to your inbox.</p>
          <NewsletterForm />
          <p className="mt-4 text-sm text-amber-100/60">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </main>
  );
}