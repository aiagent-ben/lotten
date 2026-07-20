import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedProducts, getAllActiveProducts, getCollectionBySlug } from '@/lib/data/products';
import { formatPrice } from '@/lib/utils';
import NewsletterForm from '@/components/NewsletterForm';
export const metadata: Metadata = {
  title: 'Lotten — Curated Malaysian Oak Furniture',
  description: 'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.',
};

export default function HomePage() {
  const featuredProducts = getFeaturedProducts(8);

  // Helper to get collection name from collection_id
  const getCollectionName = (collectionId: string) => {
    const collectionsMap: Record<string, string> = {
      'col-breda': 'Breda',
      'col-dover': 'Dover',
      'col-malton': 'Malton',
      'col-lamar': 'Lamar',
      'col-kyoto': 'Kyoto',
      'col-dudley': 'Dudley',
      'col-ludlow': 'Ludlow',
      'col-loftus': 'Loftus',
      'col-hutto': 'Hutto',
      'col-royston': 'Royston',
      'col-oruro': 'Oruro',
      'col-waldo': 'Waldo',
      'col-castor': 'Castor',
      'col-hayton': 'Hayton',
      'col-neath': 'Neath',
      'col-hampton': 'Hampton',
      'col-noud': 'Noud',
      'col-nakula': 'Nakula',
    };
    return collectionsMap[collectionId] || 'Collection';
  };

  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-display text-2xl font-semibold text-gray-900 tracking-tight">
              Lotten
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Shop</Link>
              <Link href="/collections" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Collections</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Our Story</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Search">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative" aria-label="Cart (0 items)">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v4m8 0l-3 3m0 0l3 3m-3-3h10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Calm Editorial Style */}
      <section className="relative min-h-screen flex items-center pt-16 lg:pt-20">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/hero-furniture.jpg)', filter: 'brightness(0.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-900/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="py-4">
              <svg className="mx-auto h-10 w-10 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-1">Quality Guaranteed</h3>
              <p className="text-sm text-gray-500">Premium Malaysian Oak</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-10 w-10 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-500">Encrypted checkout</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-10 w-10 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-1">Nationwide Delivery</h3>
              <p className="text-sm text-gray-500">Peninsular & East Malaysia</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-10 w-10 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-1">30-Day Returns</h3>
              <p className="text-sm text-gray-500">Hassle-free</p>
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
                  src="https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg"
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
                  src="https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg"
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
                  src="https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg"
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
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
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
                        placeholder="blur"
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
                src="https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg"
                alt="Lotten workshop - craftsmen working on Malaysian Oak furniture"
                fill
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4">Stay Inspired</h2>
          <p className="text-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">Get design inspiration, new collection previews, and exclusive offers delivered to your inbox.</p>
          <NewsletterForm />
          <p className="mt-4 text-sm text-amber-100/60">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="font-display text-2xl font-semibold text-white mb-4 block">Lotten</Link>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">Curated Malaysian Oak furniture for modern homes. Direct from manufacturer to your door — honest pricing, exceptional quality.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Shop</h4>
              <nav className="space-y-2">
                <Link href="/products" className="text-sm hover:text-white transition-colors block">All Products</Link>
                <Link href="/collections" className="text-sm hover:text-white transition-colors block">Collections</Link>
                <Link href="/products?category=new" className="text-sm hover:text-white transition-colors block">New Arrivals</Link>
                <Link href="/products?category=bestseller" className="text-sm hover:text-white transition-colors block">Bestsellers</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Support</h4>
              <nav className="space-y-2">
                <Link href="/contact" className="text-sm hover:text-white transition-colors block">Contact Us</Link>
                <Link href="/faq" className="text-sm hover:text-white transition-colors block">FAQ</Link>
                <Link href="/shipping" className="text-sm hover:text-white transition-colors block">Shipping Info</Link>
                <Link href="/returns" className="text-sm hover:text-white transition-colors block">Returns</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Company</h4>
              <nav className="space-y-2">
                <Link href="/about" className="text-sm hover:text-white transition-colors block">About Us</Link>
                <Link href="/sustainability" className="text-sm hover:text-white transition-colors block">Sustainability</Link>
                <Link href="/careers" className="text-sm hover:text-white transition-colors block">Careers</Link>
                <Link href="/press" className="text-sm hover:text-white transition-colors block">Press</Link>
              </nav>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 Lotten. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.163-6.162-6.163zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Pinterest">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-3.193 0-5.523-2.248-5.523-5.273 0-1.233.602-2.17 1.392-2.687.097-.065.134-.13.112-.215l-.268-1.071c-.066-.271.01-.538.278-.456 1.672.479 3.532.985 4.532.985 5.52 0 9.007-4.035 9.007-8.969 0-4.949-3.694-9.264-8.507-9.264z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}