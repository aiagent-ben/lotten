"use client";

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getAllActiveProducts, getCollectionById as getCollection, formatPrice, getColorHex } from '@/lib/data/products';
import { cn } from '@/lib/utils';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { RecentlyViewedCarousel } from '@/components/RecentlyViewedCarousel';

interface ProductDetailClientProps {
  product: {
    id: string;
    article_no: string;
    collection_id: string;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    width_mm: number | null;
    depth_mm: number | null;
    height_mm: number | null;
    weight_kg: number | null;
    volume_m3: number | null;
    pack_type: string | null;
    carton_length_mm: number | null;
    carton_width_mm: number | null;
    carton_height_mm: number | null;
    materials: any[] | null;
    colors: any[] | null;
    price_usd: number;
    cost_usd: number | null;
    moq: number;
    lead_time_weeks: number;
    stock_available: number;
    stock_reserved: number;
    stock_incoming: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_new: boolean;
    is_bestseller: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    collection?: any;
    variants?: any[];
  };
  images?: {
    id: string;
    product_id: string;
    url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
}

export default function ProductDetailClient({ product, images = [] }: ProductDetailClientProps) {
  const { addToRecentlyViewed, recentlyViewed } = useRecentlyViewed();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState<{ code: string; name: string; hex: string; part: string } | null>(product.colors?.[0] || null);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'materials' | 'dimensions'>('description');
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Track recently viewed
  useEffect(() => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_usd: product.price_usd,
      images: images.map(img => ({
        url: img.url,
        alt_text: img.alt_text ?? undefined,
        is_primary: img.is_primary,
      })) || [],
      collection_id: product.collection_id,
      is_new: product.is_new,
      is_bestseller: product.is_bestseller,
    });
  }, [product.id, addToRecentlyViewed]);

  const collection = getCollection(product.collection_id);

  // Filter primary image and gallery images - exclude color swatches (small 30x30 hinlim URLs)
  const isColorSwatch = (img: typeof images[0]) => {
    if (!img.url) return false;
    // Color swatches are small hinlim images with /color/ in URL
    return img.url.includes('/color/') && (img.width && img.width <= 100 || img.height && img.height <= 100);
  };

  const productImages = images.filter(img => !isColorSwatch(img));
  const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
  const galleryImages = productImages.filter(img => !img.is_primary) || [];
  const allImages = primaryImage ? [primaryImage, ...galleryImages] : galleryImages;

  // Handle finish selection
  const handleFinishSelect = useCallback((finish: { code: string; name: string; hex: string; part: string }) => {
    setSelectedFinish(finish);
    // Could filter images by finish here in the future
  }, []);

  // Update selected index if it goes out of bounds
  useEffect(() => {
    if (selectedIndex >= allImages.length) {
      setSelectedIndex(0);
    }
  }, [allImages.length, selectedIndex]);

  // Handle thumbnail click
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Keyboard navigation for thumbnails
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  }, [allImages.length]);

  // Scroll selected thumbnail into view
  const scrollThumbnailIntoView = useCallback((index: number) => {
    if (thumbnailRef.current) {
      const children = thumbnailRef.current.children;
      if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({ 
          behavior: 'smooth', 
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, []);

  // Scroll when selection changes
  useEffect(() => {
    scrollThumbnailIntoView(selectedIndex);
  }, [selectedIndex, scrollThumbnailIntoView]);

  // Parse specifications
  const specs = parseSpecifications(product);

  // Related products from same collection
  const relatedProducts = getAllActiveProducts()
    .filter(p => p.collection_id === product.collection_id && p.id !== product.id)
    .slice(0, 4);

  // Recently viewed (excluding current product)
  const filteredRecentlyViewed = recentlyViewed.filter(p => p.id !== product.id);

  // Get the currently selected image
  const selectedImage = allImages[selectedIndex] || allImages[0];

  return (
    <div>
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
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                  {selectedImage ? (
                    <Image
                      src={selectedImage.url}
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
                  <div
                    ref={thumbnailRef}
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                    role="list"
                    aria-label="Product images"
                  >
                    {allImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => handleThumbnailClick(index)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                          'relative flex-shrink-0 aspect-square w-20 rounded-lg overflow-hidden border-2 transition-all duration-200',
                          selectedIndex === index
                            ? 'border-amber-600 ring-2 ring-amber-600/50'
                            : 'border-transparent hover:border-gray-300'
                        )}
                        role="listitem"
                        aria-label={`View image ${index + 1}`}
                        aria-selected={selectedIndex === index}
                        tabIndex={selectedIndex === index ? 0 : -1}
                      >
                        <Image
                          src={image.url}
                          alt={`${product.name} - view ${index + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                          placeholder="blur"
                        />
                        {selectedIndex === index && (
                          <span className="absolute inset-0 bg-amber-600/20 pointer-events-none" aria-hidden="true" />
                        )}
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
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <h1 className="heading-1 text-gray-900">{product.name}</h1>
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Deduplicate colors by code */}
                      {Array.from(new Map(product.colors.map(c => [c.code, c])).values()).map((color, index) => (
                        <div
                          key={`${color.code}-${index}`}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-200 bg-white text-sm"
                        >
                          {/* Color swatch image from source */}
                          <img
                            src={`https://mm.hinlim.com/cache/b2bfs/color/${color.code} ${color.name}-30x30.jpg`}
                            alt={`${color.name} (${color.code})`}
                            className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="font-medium text-gray-900">{color.name}</span>
                          <span className="text-xs text-gray-500 font-mono">#{color.code}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

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
                      {Array.from(new Map(product.colors.map(c => [c.code, c])).values()).map((color, index) => (
                        <button
                          key={`${color.code}-${index}`}
                          onClick={() => handleFinishSelect(color)}
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                            selectedFinish?.code === color.code
                              ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/50'
                              : 'border-gray-200 text-gray-700 hover:border-amber-300'
                          )}
                          aria-pressed={selectedFinish?.code === color.code}
                        >
                          <span
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color.hex || getColorHex(color.code) }}
                            title={`${color.name} (${color.code})`}
                          />
                          <span className="text-sm font-medium">{color.name}</span>
                          <span className="text-xs text-gray-500 font-mono">#{color.code}</span>
                          {selectedFinish?.code === color.code && (
                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>30-day returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Secure payment</span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

        {/* Product Details Tabs */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="mb-8" aria-label="Product details tabs">
              <ul className="flex flex-wrap gap-4 border-b border-gray-200" role="tablist">
                <li>
                  <button 
                    role="tab" 
                    aria-selected={activeTab === 'description'}
                    onClick={() => setActiveTab('description')}
                    className={cn(
                      'font-medium pb-4 border-b-2 transition-colors',
                      activeTab === 'description'
                        ? 'text-amber-700 border-amber-700'
                        : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
                    )}
                  >
                    Description
                  </button>
                </li>
                <li>
                  <button 
                    role="tab" 
                    aria-selected={activeTab === 'specifications'}
                    onClick={() => setActiveTab('specifications')}
                    className={cn(
                      'font-medium pb-4 border-b-2 transition-colors',
                      activeTab === 'specifications'
                        ? 'text-amber-700 border-amber-700'
                        : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
                    )}
                  >
                    Specifications
                  </button>
                </li>
                <li>
                  <button 
                    role="tab" 
                    aria-selected={activeTab === 'materials'}
                    onClick={() => setActiveTab('materials')}
                    className={cn(
                      'font-medium pb-4 border-b-2 transition-colors',
                      activeTab === 'materials'
                        ? 'text-amber-700 border-amber-700'
                        : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
                    )}
                  >
                    Materials & Finishes
                  </button>
                </li>
                <li>
                  <button 
                    role="tab" 
                    aria-selected={activeTab === 'dimensions'}
                    onClick={() => setActiveTab('dimensions')}
                    className={cn(
                      'font-medium pb-4 border-b-2 transition-colors',
                      activeTab === 'dimensions'
                        ? 'text-amber-700 border-amber-700'
                        : 'text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300'
                    )}
                  >
                    Dimensions
                  </button>
                </li>
              </ul>
            </nav>

            {activeTab === 'description' && (
              <div className="prose prose-lg prose-gray max-w-none dark:prose-invert">
                <h2 className="heading-2 text-gray-900 mb-4">About This Product</h2>
                <div dangerouslySetInnerHTML={{ __html: product.description || '' }} />
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-8">
                <h2 className="heading-2 text-gray-900">Specifications</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specs.dimensions && (
                    <>
                      <dt className="text-gray-500">Dimensions</dt>
                      <dd className="font-medium text-gray-900">{specs.dimensions}</dd>
                    </>
                  )}
                  {specs.weight && (
                    <>
                      <dt className="text-gray-500">Weight</dt>
                      <dd className="font-medium text-gray-900">{specs.weight} kg</dd>
                    </>
                  )}
                  {specs.volume && (
                    <>
                      <dt className="text-gray-500">Volume</dt>
                      <dd className="font-medium text-gray-900">{specs.volume} m³</dd>
                    </>
                  )}
                  {specs.packType && (
                    <>
                      <dt className="text-gray-500">Packaging</dt>
                      <dd className="font-medium text-gray-900">{specs.packType}</dd>
                    </>
                  )}
                  {product.lead_time_weeks && (
                    <>
                      <dt className="text-gray-500">Lead Time</dt>
                      <dd className="font-medium text-gray-900">{product.lead_time_weeks} weeks</dd>
                    </>
                  )}
                  {product.moq && (
                    <>
                      <dt className="text-gray-500">MOQ</dt>
                      <dd className="font-medium text-gray-900">{product.moq}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-8">
                <h2 className="heading-2 text-gray-900">Materials & Finishes</h2>
                
                {product.materials && product.materials.length > 0 && (
                  <div>
                    <h3 className="heading-3 text-gray-900 mb-4">Materials</h3>
                    <ul className="space-y-3">
                      {product.materials.map((material: any, index: number) => (
                        <li key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                          <span className="text-gray-600 capitalize">{material.part?.replace(/_/g, ' ') || 'Material'}</span>
                          <div className="flex items-center gap-4 text-gray-900">
                            <span className="font-medium">{material.material || 'Malaysian Oak'}</span>
                            {material.finish && (
                              <span className="text-sm text-gray-500">({material.finish})</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h3 className="heading-3 text-gray-900 mb-4">Available Finishes</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color: any) => (
                        <div 
                          key={`${color.part}-${color.code}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        >
                          <span
                            className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: color.hex || getColorHex(color.code) }}
                            title={`${color.name} (${color.code})`}
                          />
                          <span className="font-medium text-gray-900">{color.name}</span>
                          <span className="text-xs text-gray-500 font-mono">#{color.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dimensions' && (
              <div className="space-y-8">
                <h2 className="heading-2 text-gray-900">Dimensions</h2>
                
                {product.width_mm || product.depth_mm || product.height_mm ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                      <p className="caption text-gray-500">Width</p>
                      <p className="heading-2 font-bold text-gray-900">{product.width_mm} mm</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                      <p className="caption text-gray-500">Depth</p>
                      <p className="heading-2 font-bold text-gray-900">{product.depth_mm} mm</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                      <p className="caption text-gray-500">Height</p>
                      <p className="heading-2 font-bold text-gray-900">{product.height_mm} mm</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Dimension data not available</p>
                )}

                {product.weight_kg && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <p className="caption text-gray-500">Weight</p>
                    <p className="heading-2 font-bold text-gray-900">{product.weight_kg} kg</p>
                  </div>
                )}

                {product.volume_m3 && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <p className="caption text-gray-500">Volume</p>
                    <p className="heading-2 font-bold text-gray-900">{product.volume_m3} m³</p>
                  </div>
                )}

                {product.carton_length_mm || product.carton_width_mm || product.carton_height_mm ? (
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="heading-3 text-gray-900 mb-4">Carton Dimensions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {product.carton_length_mm && (
                        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
                          <p className="caption text-gray-500">Length</p>
                          <p className="font-bold text-gray-900">{product.carton_length_mm} mm</p>
                        </div>
                      )}
                      {product.carton_width_mm && (
                        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
                          <p className="caption text-gray-500">Width</p>
                          <p className="font-bold text-gray-900">{product.carton_width_mm} mm</p>
                        </div>
                      )}
                      {product.carton_height_mm && (
                        <div className="bg-white p-4 rounded-lg border border-gray-100 text-center">
                          <p className="caption text-gray-500">Height</p>
                          <p className="font-bold text-gray-900">{product.carton_height_mm} mm</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {product.pack_type && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <p className="caption text-gray-500">Packaging</p>
                    <p className="font-bold text-gray-900">{product.pack_type}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* You May Also Like */}
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
                );})}
            </div>
          </div>
        </section>

        {/* Recently Viewed */}
        <RecentlyViewedCarousel products={filteredRecentlyViewed} />

        {/* CTA Section */}
        <section className="py-16 bg-amber-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="heading-2 mb-4">Ready to Order?</h2>
            <p className="text-lg text-amber-100/80 mb-8 max-w-2xl mx-auto">
              Contact our team for pricing, customization options, or to place your order. We're here to help you find the perfect piece for your space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary btn-lg bg-white text-amber-900 hover:bg-amber-50">
                Contact Sales
              </Link>
              <Link href="/products" className="btn-outline btn-lg border-white text-white hover:bg-white/10">
                Browse Collections
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Helper function to get collection name from collection_id
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

// Helper function to parse specifications from product
function parseSpecifications(product: any) {
  const specs: Record<string, string> = {};
  
  if (product.width_mm && product.depth_mm && product.height_mm) {
    specs.dimensions = `${product.width_mm} × ${product.depth_mm} × ${product.height_mm} mm`;
  }
  
  if (product.weight_kg) {
    specs.weight = product.weight_kg.toString();
  }
  
  if (product.volume_m3) {
    specs.volume = product.volume_m3.toString();
  }
  
  if (product.pack_type) {
    specs.packType = product.pack_type;
  }
  
  return specs;
}