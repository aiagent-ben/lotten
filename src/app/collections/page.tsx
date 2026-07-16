import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { collections, getCollectionsByBrand } from '@/lib/data/products';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore our curated furniture collections, each with their own design philosophy and finish options.',
};

export const revalidate = 3600; // ISR: revalidate every hour

export default function CollectionsPage() {
  const brands = [
    {
      id: 'brand-nesthouz',
      name: 'NestHouZ',
      description: 'Contemporary Malaysian Oak furniture with warm, sophisticated finishes for modern living spaces.',
      collections: collections.filter(c => c.brand_id === 'brand-nesthouz' && c.is_active),
    },
    {
      id: 'brand-nestnordic',
      name: 'NestNordic',
      description: 'Scandinavian-inspired designs featuring clean lines, light washes, and minimalist aesthetics.',
      collections: collections.filter(c => c.brand_id === 'brand-nestnordic' && c.is_active),
    },
    {
      id: 'brand-luooma',
      name: 'Luooma',
      description: 'Modern furniture collections with innovative material combinations and architectural silhouettes.',
      collections: collections.filter(c => c.brand_id === 'brand-luooma' && c.is_active),
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-100/50 text-amber-800 text-sm font-medium mb-6">
              Curated Collections
            </span>
            <h1 className="heading-1 text-gray-900 mb-4">Furniture Collections</h1>
            <p className="body-lg text-gray-600">
              Each collection tells a story through material, form, and finish. 
              Explore our curated ranges designed for modern living.
            </p>
          </div>
        </div>
      </section>

      {/* Brand Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {brands.map((brand) => (
            <section key={brand.id} className="mb-24">
              {/* Brand Header */}
              <div className="mb-10">
                <h2 className="heading-2 text-gray-900 mb-2">{brand.name}</h2>
                <p className="body-lg text-gray-600 max-w-2xl">{brand.description}</p>
              </div>

              {/* Collections Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {brand.collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.slug}`}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden group bg-gray-100"
                    aria-label={`View ${collection.name} collection`}
                  >
                    {/* Hero Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={collection.hero_image_url || '/placeholder-collection.jpg'}
                        alt={`${collection.name} collection`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        placeholder="blur"
                        loading="lazy"
                      />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                      <h3 className="heading-3 mb-2">{collection.name}</h3>
                      <p className="body-sm text-white/80 mb-4 line-clamp-2">{collection.description}</p>
                      
                      {/* Color Palette */}
                      {collection.color_palette && collection.color_palette.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {collection.color_palette.slice(0, 5).map((color, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30"
                              style={{ backgroundColor: color.hex + '33' }}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-white/50"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </span>
                          ))}
                          {collection.color_palette.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                              +{collection.color_palette.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1 font-medium self-start">
                        View Collection
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-4">Looking for Something Specific?</h2>
          <p className="body-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
            Browse all products with advanced filtering, or contact our team for 
            custom orders and design consultations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-primary btn-lg bg-amber-600 hover:bg-amber-500 w-full sm:w-auto">
              Browse All Products
            </Link>
            <Link href="/contact" className="btn-outline btn-lg border-amber-300/50 text-amber-100 hover:bg-amber-100/10 w-full sm:w-auto">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}