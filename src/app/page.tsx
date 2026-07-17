import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedProducts, getAllActiveProducts, getCollectionBySlug } from '@/lib/data/products';
import { formatPrice } from '@/lib/utils';

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
    <main className="min-h-screen bg-white">
      {/* Hero Section - Calm Editorial Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-furniture.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-900/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl animate-slide-up">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-600/20 text-amber-100 text-sm font-medium mb-8 tracking-wide backdrop-blur-sm border border-amber-400/30">
              Direct from Manufacturer
            </span>
            <h1 className="heading-1 text-white mb-6 leading-tight">
              Curated Malaysian Oak Furniture<br />for Modern Homes
            </h1>
            <p className="body-lg text-amber-100/90 mb-10 max-w-2xl leading-relaxed">
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
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-amber-200/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-amber-50 border-y border-amber-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="py-4">
              <svg className="mx-auto h-8 w-8 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="heading-4 text-gray-900 mb-1">Quality Guaranteed</h3>
              <p className="caption text-gray-600 mt-1">Premium Malaysian Oak</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-8 w-8 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <h3 className="heading-4 text-gray-900 mb-1">Secure Payment</h3>
              <p className="caption text-gray-600 mt-1">Encrypted checkout</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-8 w-8 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="heading-4 text-gray-900 mb-1">Nationwide Delivery</h3>
              <p className="caption text-gray-600 mt-1">Peninsular & East Malaysia</p>
            </div>
            <div className="py-4">
              <svg className="mx-auto h-8 w-8 text-amber-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="heading-4 text-gray-900 mb-1">Easy Returns</h3>
              <p className="caption text-gray-600 mt-1">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections - Editorial Style */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="heading-2 text-gray-900 mb-4">Our Collections</h2>
            <p className="body-lg text-gray-600 max-w-2xl mx-auto">
              Each collection tells a story of craftsmanship, material, and design philosophy — curated for the way you live.
            </p>
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
                  className="card-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <a href="/collections/breda" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Breda
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full mb-3">NestHouZ</span>
                <h3 className="heading-3 text-gray-900 mb-2">Breda</h3>
                <p className="text-gray-600 mb-4">Working desks, TV cabinets and sideboards in warm Walnut/Natural combinations.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">Cocoa</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">White Marble</span>
                </div>
                <a href="/collections/breda" className="text-sm font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 transition-colors">View 7 products →</a>
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
                  className="card-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <a href="/collections/dover" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Dover
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-full mb-3">NestHouZ</span>
                <h3 className="heading-3 text-gray-900 mb-2">Dover</h3>
                <p className="text-gray-600 mb-4">Complete living room collections with coffee, console, side tables and desks.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-rose-100 text-rose-700">Walnut</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-rose-100 text-rose-700">Cocoa</span>
                </div>
                <a href="/collections/dover" className="text-sm font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors">View 8 products →</a>
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
                  className="card-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <a href="/collections/castor" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                    Explore Castor
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full mb-3">Luooma</span>
                <h3 className="heading-3 text-gray-900 mb-2">Castor</h3>
                <p className="text-gray-600 mb-4">Minimalist three-tone finish combinations for modern entertainment centers.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Black</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Natural</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">Space Blue</span>
                </div>
                <a href="/collections/castor" className="text-sm font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 transition-colors">View 5 products →</a>
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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 animate-slide-up">
            <div>
              <h2 className="heading-2 text-gray-900 mb-2">Featured Products</h2>
              <p className="body text-gray-600">Handpicked bestsellers and new arrivals</p>
            </div>
            <Link
              href="/products"
              className="btn-ghost mt-4 md:mt-0 text-amber-700 hover:text-amber-900"
            >
              View All Products →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {featuredProducts.map((product) => {
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
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
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                      {product.is_new && (
                        <span className="badge badge-primary badge-success text-xs px-2 py-1">New</span>
                      )}
                      {product.is_bestseller && (
                        <span className="badge badge-primary text-xs px-2 py-1">Bestseller</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="caption text-amber-700 font-medium mb-1 uppercase tracking-wider">
                      {getCollectionName(product.collection_id)}
                    </p>
                    <h3 className="product-card-title font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="product-card-price text-lg font-bold text-gray-900">
                      {formatPrice(product.price_usd)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-4">Ready to Transform Your Space?</h2>
          <p className="body-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who've furnished their homes with Lotten's premium Malaysian Oak furniture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-primary btn-lg bg-amber-600 hover:bg-amber-500 w-full sm:w-auto">
              Start Shopping
            </Link>
            <Link href="/contact" className="btn-outline btn-lg border-amber-300/50 text-amber-100 hover:bg-amber-100/10 w-full sm:w-auto">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <h3 className="heading-3 mb-4">Lotten</h3>
              <p className="body text-gray-400 mb-6 max-w-sm leading-relaxed">
                Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="heading-4 mb-4">Shop</h4>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/collections" className="text-gray-400 hover:text-white transition-colors">Collections</Link></li>
                <li><Link href="/products?category=new" className="text-gray-400 hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link href="/products?category=bestseller" className="text-gray-400 hover:text-white transition-colors">Bestsellers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="heading-4 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors">Returns & Exchanges</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="heading-4 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>
                <li><Link href="/sustainability" className="text-gray-400 hover:text-white transition-colors">Sustainability</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Lotten. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}