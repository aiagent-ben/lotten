import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getProductBySlug, getAllActiveProducts, getCollectionBySlug, formatPrice, getCollectionBySlug as getCollection, getColorHex } from '@/lib/data/products';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const collection = getCollection(product.collection_id);
  
  return {
    title: product.name,
    description: product.short_description || product.description?.slice(0, 160),
    keywords: [product.name, collection?.name, 'Malaysian Oak', 'furniture'].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      type: 'website',
      images: product.images?.map(img => ({
        url: img.url,
        width: img.width || 1200,
        height: img.height || 630,
        alt: img.alt_text || product.name,
      })) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160) || '',
      images: product.images?.map(img => img.url) || [],
    },
    other: {
      'product:price:amount': product.price_usd.toString(),
      'product:price:currency': 'MYR',
      'product:brand': collection?.name || 'Lotten',
      'product:availability': product.stock_available > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export async function generateStaticParams() {
  const products = getAllActiveProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const collection = getCollection(product.collection_id);
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const galleryImages = product.images?.filter(img => !img.is_primary) || [];
  const allImages = primaryImage ? [primaryImage, ...galleryImages] : galleryImages;

  // Parse specifications string into structured data
  const specs = parseSpecifications(product);

  // Related products from same collection
  const relatedProducts = getAllActiveProducts()
    .filter(p => p.collection_id === product.collection_id && p.id !== product.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="py-4 bg-gray-50 border-b border-gray-100" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            </li>
            <li className="text-gray-300">/</li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-gray-700">Products</Link>
            </li>
            <li className="text-gray-300">/</li>
            {collection && (
              <>
                <li>
                  <Link href={`/collections/${collection.slug}`} className="text-gray-500 hover:text-gray-700">
                    {collection.name}
                  </Link>
                </li>
                <li className="text-gray-300">/</li>
              </>
            )}
            <li className="text-gray-900 font-medium" aria-current="page">
              {product.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Product Gallery & Info */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-50">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                    placeholder="blur"
                    quality={90}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 right-4 flex gap-2">
                  {product.is_new && (
                    <span className="badge-primary badge-success text-sm px-3 py-1">New Arrival</span>
                  )}
                  {product.is_bestseller && (
                    <span className="badge-primary text-sm px-3 py-1">Bestseller</span>
                  )}
                  {product.stock_available > 0 && product.stock_available <= (product.low_stock_threshold || 5) && (
                    <span className="badge-warning text-sm px-3 py-1">Low Stock</span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3" role="list" aria-label="Product images">
                  {allImages.slice(0, 8).map((image, index) => (
                    <button
                      key={image.id}
                      className={cn(
                        'relative aspect-square rounded-lg overflow-hidden border-2 transition-colors',
                        index === 0 ? 'border-amber-600' : 'border-transparent hover:border-gray-300'
                      )}
                      role="listitem"
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} - view ${index + 1}`}
                        fill
                        sizes="25vw"
                        className="object-cover"
                        placeholder="blur"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Collection Badge */}
              {collection && (
                <Link 
                  href={`/collections/${collection.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-amber-700 font-medium hover:text-amber-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-1.414 0L7.414 18.707a1 1 0 01-.707-.293H5a2 2 0 01-2-2V4z" />
                  </svg>
                  {collection.name} Collection
                </Link>
              )}

              {/* Product Name */}
              <h1 className="heading-1 text-gray-900">{product.name}</h1>

              {/* Article Number */}
              <p className="text-sm text-gray-500 font-mono">Article No: {product.article_no}</p>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price_usd)}
                </span>
                {product.stock_available > 0 ? (
                  <span className="badge-success text-sm px-3 py-1">In Stock</span>
                ) : (
                  <span className="badge-destructive text-sm px-3 py-1">Out of Stock</span>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="body-lg text-gray-600 border-t border-b border-gray-100 py-4">
                  {product.short_description}
                </p>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                {specs.dimensions && (
                  <div className="text-center">
                    <p className="caption text-gray-500">Dimensions</p>
                    <p className="font-medium text-gray-900">{specs.dimensions}</p>
                  </div>
                )}
                {specs.weight && (
                  <div className="text-center">
                    <p className="caption text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{specs.weight} kg</p>
                  </div>
                )}
                {specs.volume && (
                  <div className="text-center">
                    <p className="caption text-gray-500">Volume</p>
                    <p className="font-medium text-gray-900">{specs.volume} m³</p>
                  </div>
                )}
                {specs.packType && (
                  <div className="text-center">
                    <p className="caption text-gray-500">Packaging</p>
                    <p className="font-medium text-gray-900">{specs.packType}</p>
                  </div>
                )}
              </div>

              {/* Color Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="border-t border-b border-gray-100 py-6">
                  <h3 className="heading-4 text-gray-900 mb-4">Available Finishes</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color, index) => (
                      <button
                        key={`${color.part}-${color.code}`}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                          index === 0
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-200 text-gray-700 hover:border-amber-300'
                        )}
                      >
                        <span
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                            title={`${color.name} (${color.code})`}
                          />
                        <span className="text-sm font-medium">{color.name}</span>
                        <span className="text-xs text-gray-500 font-mono">#{color.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  className="btn-primary btn-lg flex-1"
                  disabled={product.stock_available <= 0}
                >
                  {product.stock_available > 0 ? 'Add to Cart' : 'Out of Stock'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </button>
                <Link href="/contact" className="btn-outline btn-lg flex-1 text-center">
                  Enquire Now
                </Link>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{product.lead_time_weeks} weeks lead time</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>MOQ: {product.moq}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30-day returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs: Description, Specifications, Materials */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <nav className="mb-8" aria-label="Product details tabs">
              <ul className="flex gap-8 border-b border-gray-200" role="tablist">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Specifications' },
                  { id: 'materials', label: 'Materials & Finishes' },
                  { id: 'dimensions', label: 'Dimensions' },
                ].map((tab) => (
                  <li key={tab.id} role="presentation">
                    <button
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-controls={`panel-${tab.id}`}
                      aria-selected={tab.id === 'description'}
                      className="pb-3 font-medium text-sm border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-t-lg"
                      data-tab={tab.id}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Tab Panels */}
            <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" className="prose prose-amber max-w-none">
              <h2 className="heading-3 text-gray-900 mb-4">About This Product</h2>
              <div className="body text-gray-700 whitespace-pre-wrap">{product.description}</div>
            </div>

            <div role="tabpanel" id="panel-specifications" aria-labelledby="tab-specifications" className="hidden prose prose-amber max-w-none">
              <h2 className="heading-3 text-gray-900 mb-4">Technical Specifications</h2>
              <dl className="space-y-4">
                {specs.dimensions && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <dt className="font-medium text-gray-900">Dimensions</dt>
                    <dd className="text-gray-600 font-mono">{specs.dimensions}</dd>
                  </div>
                )}
                {specs.weight && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <dt className="font-medium text-gray-900">Gross Weight</dt>
                    <dd className="text-gray-600 font-mono">{specs.weight} kg</dd>
                  </div>
                )}
                {specs.volume && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <dt className="font-medium text-gray-900">Volume</dt>
                    <dd className="text-gray-600 font-mono">{specs.volume} m³</dd>
                  </div>
                )}
                {specs.packType && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <dt className="font-medium text-gray-900">Pack Type</dt>
                    <dd className="text-gray-600 font-mono">{specs.packType}</dd>
                  </div>
                )}
                {product.carton_length_mm && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <dt className="font-medium text-gray-900">Carton Dimensions</dt>
                    <dd className="text-gray-600 font-mono">
                      L{product.carton_length_mm} × W{product.carton_width_mm} × H{product.carton_height_mm} mm
                    </dd>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <dt className="font-medium text-gray-900">Article Number</dt>
                  <dd className="text-gray-600 font-mono">{product.article_no}</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <dt className="font-medium text-gray-900">Lead Time</dt>
                  <dd className="text-gray-600 font-mono">{product.lead_time_weeks} weeks</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <dt className="font-medium text-gray-900">Minimum Order Quantity</dt>
                  <dd className="text-gray-600 font-mono">{product.moq} unit</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="font-medium text-gray-900">Stock Status</dt>
                  <dd className="text-gray-600 font-mono">
                    {product.stock_available} available ({product.stock_available - product.stock_reserved} net)
                  </dd>
                </div>
              </dl>
            </div>

            <div role="tabpanel" id="panel-materials" aria-labelledby="tab-materials" className="hidden prose prose-amber max-w-none">
              <h2 className="heading-3 text-gray-900 mb-4">Materials & Finishes</h2>
              
              {product.materials && product.materials.length > 0 && (
                <div className="mb-8">
                  <h3 className="heading-4 text-gray-900 mb-3">Materials</h3>
                  <ul className="space-y-3">
                    {product.materials.map((material, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{material.part.replace(/_/g, ' ')}</p>
                          <p className="text-gray-600 text-sm">{material.material}</p>
                          {material.finish && (
                            <p className="text-gray-500 text-sm">Finish: {material.finish}</p>
                          )}
                          {material.code && (
                            <p className="text-gray-400 text-xs font-mono">Code: {material.code}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="heading-4 text-gray-900 mb-3">Color Options</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.colors.map((color) => (
                      <div 
                        key={`${color.part}-${color.code}`}
                        className="p-4 bg-white rounded-lg border border-gray-100 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-lg border border-gray-200"
                            style={{ backgroundColor: color.hex || getColorHex(color.code) }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{color.part.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-600">{color.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">Code: {color.code}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div role="tabpanel" id="panel-dimensions" aria-labelledby="tab-dimensions" className="hidden prose prose-amber max-w-none">
              <h2 className="heading-3 text-gray-900 mb-4">Detailed Dimensions</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                  <h3 className="heading-4 text-gray-900 mb-4">Product Dimensions</h3>
                  <dl className="space-y-3">
                    {product.width_mm && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Width</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.width_mm} mm</dd>
                      </div>
                    )}
                    {product.depth_mm && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Depth</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.depth_mm} mm</dd>
                      </div>
                    )}
                    {product.height_mm && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Height</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.height_mm} mm</dd>
                      </div>
                    )}
                    {product.weight_kg && (
                      <div className="flex justify-between py-2">
                        <dt className="text-gray-600">Weight</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.weight_kg} kg</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {product.carton_length_mm && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="heading-4 text-gray-900 mb-4">Carton Dimensions</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Length</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.carton_length_mm} mm</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Width</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.carton_width_mm} mm</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="text-gray-600">Height</dt>
                        <dd className="font-medium text-gray-900 font-mono">{product.carton_height_mm} mm</dd>
                      </div>
                      {product.volume_m3 && (
                        <div className="flex justify-between py-2">
                          <dt className="text-gray-600">Volume</dt>
                          <dd className="font-medium text-gray-900 font-mono">{product.volume_m3} m³</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-2 text-gray-900">You May Also Like</h2>
              <Link href={`/collections/${collection?.slug}`} className="text-amber-700 hover:text-amber-900 font-medium text-sm">
                View All {collection?.name} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => {
                const primaryImg = related.images?.find(img => img.is_primary) || related.images?.[0];
                return (
                  <Link 
                    key={related.id} 
                    href={`/products/${related.slug}`}
                    className="product-card group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                      {primaryImg ? (
                        <Image
                          src={primaryImg.url}
                          alt={related.name}
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
                      {related.is_new && (
                        <span className="absolute top-3 left-3 badge-primary badge-success text-xs px-2 py-1">New</span>
                      )}
                      {related.is_bestseller && (
                        <span className="absolute top-3 right-3 badge-primary text-xs px-2 py-1">Bestseller</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="caption text-amber-700 font-medium mb-1">
                        {getCollectionName(related.collection_id)}
                      </p>
                      <h3 className="product-card-title font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {related.name}
                      </h3>
                      <p className="product-card-price text-lg font-bold text-gray-900">
                        {formatPrice(related.price_usd)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-4">Ready to Order?</h2>
          <p className="body-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
            Contact our team for pricing, customization options, or to place your order.
            We're here to help you find the perfect piece for your space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary btn-lg bg-amber-600 hover:bg-amber-500 w-full sm:w-auto">
              Contact Sales
            </Link>
            <Link href="/collections" className="btn-outline btn-lg border-amber-300/50 text-amber-100 hover:bg-amber-100/10 w-full sm:w-auto">
              Browse Collections
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// Helper functions
function parseSpecifications(product: NonNullable<ReturnType<typeof getProductBySlug>>) {
  // Use parsed specs from database if available, otherwise parse from description
  return {
    dimensions: product.width_mm && product.depth_mm && product.height_mm
      ? `${product.width_mm} × ${product.depth_mm} × ${product.height_mm} mm`
      : undefined,
    weight: product.weight_kg?.toString(),
    volume: product.volume_m3?.toString(),
    packType: product.pack_type,
  };
}

function getCollectionName(collectionId: string): string {
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
}