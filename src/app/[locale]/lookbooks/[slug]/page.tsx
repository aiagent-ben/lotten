import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX, incrementViewCount } from '@/lib/data/content';
import { getProductById, getProductBySlug, formatPrice } from '@/lib/data/products';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft, Calendar, MapPin, Tag, ShoppingBag, ArrowRight, Grid } from 'lucide-react';
import { HotspotsOverlay } from '@/components/content/HotspotsOverlay';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getStaticParamsForType('lookbook');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'lookbook');
  
  if (!content) {
    return { title: 'Lookbook Not Found' };
  }

  return {
    title: content.meta_title || content.title,
    description: content.meta_description || content.excerpt || undefined,
    openGraph: {
      title: content.meta_title || content.title,
      description: content.meta_description || content.excerpt || undefined,
      type: 'article',
      publishedTime: content.published_at || undefined,
      images: content.og_image_url || content.featured_image_url ? [{ url: content.og_image_url || content.featured_image_url || '' }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.meta_title || content.title,
      description: content.meta_description || content.excerpt || undefined,
      images: content.og_image_url || content.featured_image_url ? [content.og_image_url || content.featured_image_url!] : undefined,
    },
  };
}

export default async function LookbookPage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'lookbook');

  if (!content) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(content.id);

  const [html, resolvedProducts] = await Promise.all([
    compileContentMDX(content),
    Promise.all(
      (content.featured_products || []).map(async (idOrSlug) => {
        const product = (await getProductById(idOrSlug)) || (await getProductBySlug(idOrSlug));
        return { idOrSlug, product };
      })
    ),
  ]);

  const publishedDate = content.published_at ? format(new Date(content.published_at), 'MMMM d, yyyy') : '';

  return (
    <article className="max-w-6xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <Link 
          href="/lookbooks" 
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Lookbooks
        </Link>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-4">
          {publishedDate && (
            <time dateTime={content.published_at!} className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-400" />
              {publishedDate}
            </time>
          )}
          {content.room_type && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-stone-900/80 text-stone-100 rounded-full text-xs font-medium capitalize">
              <MapPin className="w-3 h-3 text-amber-300" />
              {content.room_type.replace('-', ' ')}
            </span>
          )}
        </div>

        <h1 className="text-4xl lg:text-5xl font-serif font-medium text-stone-900 leading-tight mb-4 tracking-tight">
          {content.title}
        </h1>

        {content.excerpt && (
          <p className="text-xl text-stone-600 leading-relaxed max-w-3xl">
            {content.excerpt}
          </p>
        )}

        {content.style_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {content.style_tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/50 rounded-full capitalize">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {content.featured_image_url && (
        <figure className="relative aspect-[16/10] w-full max-w-6xl mx-auto rounded-2xl overflow-hidden mb-12 shadow-sm border border-stone-200">
          <Image
            src={content.featured_image_url}
            alt={content.featured_image_alt || content.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
            className="object-cover"
            priority
          />
          
          <HotspotsOverlay hotspots={content.hotspots} />
        </figure>
      )}

      <div className="prose prose-lg prose-stone max-w-none dark:prose-invert mb-16">
        {html}
      </div>

      {resolvedProducts.length > 0 && (
        <section className="mb-16 pt-8 border-t border-stone-200">
          <h2 className="text-2xl font-serif font-medium text-stone-900 mb-6 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-800" />
            Shop This Look
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resolvedProducts.map(({ idOrSlug, product }) => (
              <Link 
                key={idOrSlug} 
                href={`/products/${product ? product.slug : idOrSlug}`} 
                className="group card overflow-hidden border border-stone-200 hover:border-amber-700/40 hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-square bg-stone-100 relative overflow-hidden">
                  {product?.product_images?.[0]?.url ? (
                    <Image
                      src={product.product_images[0].url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-stone-300 group-hover:text-amber-800 transition-colors" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-serif font-medium text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {product ? product.name : `Product ${idOrSlug.slice(-6)}`}
                  </p>
                  {product && (
                    <p className="text-sm font-medium text-stone-600 mt-1">
                      {formatPrice(product.price_usd)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 pt-8 border-t border-stone-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/lookbooks" className="btn btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            All Lookbooks
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <span>Love this look?</span>
            <button className="btn btn-outline btn-sm flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Save Lookbook
            </button>
            <button className="btn btn-outline btn-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Share
            </button>
          </div>
        </nav>
      </footer>
    </article>
  );
}