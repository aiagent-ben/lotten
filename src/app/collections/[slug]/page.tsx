import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCollectionBySlug, getProductsByCollection, getCollectionsByBrand, formatPrice, collections } from '@/lib/data/products';
import { cn } from '@/lib/utils';

import { brands } from '@/lib/data/products';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  const collectionsOfBrand = getCollectionsByBrand(collection.brand_id);
  const brand = collectionsOfBrand[0]?.brand;

  return {
    title: `${collection.name} Collection`,
    description: collection.description ?? undefined,
    keywords: [collection.name, brand?.name || 'Lotten', 'Malaysian Oak', 'furniture', 'collection'].filter(Boolean) as string[],
    openGraph: {
      title: `${collection.name} Collection | ${brand?.name || 'Lotten'}`,
      description: collection.description ?? undefined,
      type: 'website',
      images: collection.hero_image_url ? [{
        url: collection.hero_image_url,
        width: 1200,
        height: 630,
        alt: `${collection.name} Collection`,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${collection.name} Collection`,
      description: collection.description ?? undefined,
      images: collection.hero_image_url ? [collection.hero_image_url] : [],
    },
  };
}

export async function generateStaticParams() {
  const allCollections = collections
    .filter(c => c.is_active)
    .map(c => ({ slug: c.slug }));
  return allCollections;
}

export const revalidate = 3600; // ISR: revalidate every hour

export async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const collectionsOfBrand = getCollectionsByBrand(collection.brand_id);
  const brand = collectionsOfBrand[0]?.brand;
  const products = getProductsByCollection(collection.id);
  const featuredProducts = products.slice(0, 8);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={collection.hero_image_url || '/hero-collection.jpg'}
            alt={`${collection.name} Collection`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-900/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            {/* Brand Badge */}
            {brand && (
              <Link
                href={`/collections?brand=${brand.slug}`}
                className="inline-block px-4 py-2 rounded-full bg-amber-600/20 text-amber-100 text-sm font-medium mb-6 backdrop-blur-sm border border-amber-400/30 hover:bg-amber-600/30 transition-colors"
              >
                {brand.name}
              </Link>
            )}

            <h1 className="heading-1 text-white mb-6 leading-tight">{collection.name}</h1>
            <p className="body-lg text-amber-100/90 mb-8 max-w-2xl">
              {collection.description}
            </p>

            {/* Color Palette */}
            {collection.color_palette && collection.color_palette.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="text-amber-200/80 text-sm font-medium self-center mr-2">Finishes:</span>
                {collection.color_palette.map((color, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20"
                    style={{ backgroundColor: color.hex + '33' }}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </span>
                ))}
              </div>
            )}

            <Link
              href="#products"
              className="inline-flex items-center gap-2 btn-primary btn-lg bg-amber-600 hover:bg-amber-500 text-white"
            >
              Shop Collection
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-amber-200/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 bg-gray-50" aria-labelledby="brand-story">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 id="brand-story" className="heading-2 text-gray-900 mb-4">The Story Behind {collection.name}</h2>
            <p className="body-lg text-gray-600">
              {brand?.description || `Discover the design philosophy and craftsmanship that defines the ${collection.name} collection.`}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="heading-4 text-gray-900 mb-2">Premium Materials</h3>
              <p className="body text-gray-600">Solid Malaysian Oak with premium veneers and finishes, sourced sustainably.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="heading-4 text-gray-900 mb-2">Expert Craftsmanship</h3>
              <p className="body text-gray-600">Precision joinery and hand-finished details by skilled artisans.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="heading-4 text-gray-900 mb-2">Timeless Design</h3>
              <p className="body text-gray-600">Contemporary silhouettes with enduring appeal for modern living spaces.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="heading-2 text-gray-900 mb-2">{collection.name} Products</h2>
              <p className="body text-gray-600">{products.length} items in this collection</p>
            </div>
            <Link
              href={`/products?collection=${collection.slug}`}
              className="text-amber-700 hover:text-amber-900 font-medium text-sm flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
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
                      {product.is_new && (
                        <span className="absolute top-3 left-3 badge-primary badge-success text-xs px-2 py-1">New</span>
                      )}
                      {product.is_bestseller && (
                        <span className="absolute top-3 right-3 badge-primary text-xs px-2 py-1">Bestseller</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="caption text-amber-700 font-medium mb-1">{brand?.name}</p>
                      <h3 className="product-card-title font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
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
          ) : (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8-4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-4 heading-3 text-gray-900">No products yet</h3>
              <p className="mt-2 body text-gray-600">Products will appear here once added to this collection.</p>
            </div>
          )}
        </div>
      </section>

      {/* Related Collections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-2 text-gray-900 text-center mb-12">Explore More Collections</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections
                          .filter(c => c.is_active && c.id !== collection.id)
                          .slice(0, 6)
                          .map((relatedCollection) => {
                const relatedBrand = brands.find(b => b.id === relatedCollection.brand_id);
                return (
                  <Link
                    key={relatedCollection.id}
                    href={`/collections/${relatedCollection.slug}`}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden group bg-gray-100"
                  >
                    <Image
                      src={relatedCollection.hero_image_url || '/placeholder-collection.jpg'}
                      alt={`${relatedCollection.name} collection`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      placeholder="blur"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="heading-3 mb-1">{relatedCollection.name}</h3>
                      <p className="body-sm text-white/80">{relatedCollection.description}</p>
                    </div>
                  </Link>
                );
              })}
          </div>

          <div className="text-center mt-12">
            <Link href="/collections" className="btn-outline btn-lg">
              View All Collections →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-4">Ready to Transform Your Space?</h2>
          <p className="body-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
            Visit our showroom or contact our design consultants to experience the
            {collection.name} collection in person.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary btn-lg bg-amber-600 hover:bg-amber-500 w-full sm:w-auto">
              Contact Us
            </Link>
            <Link href="/products" className="btn-outline btn-lg border-amber-300/50 text-amber-100 hover:bg-amber-100/10 w-full sm:w-auto">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
export default CollectionDetailPage;
