import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX, incrementViewCount } from '@/lib/data/content';
import { MDXRemote } from 'next-mdx-remote/rsc';
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

  const html = await compileContentMDX(content);
  const publishedDate = content.published_at ? format(new Date(content.published_at), 'MMMM d, yyyy') : '';

  return (
    <article className="max-w-6xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <Link 
          href="/lookbooks" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Lookbooks
        </Link>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          {publishedDate && (
            <time dateTime={content.published_at!} className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {publishedDate}
            </time>
          )}
          {content.room_type && (
            <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
              <MapPin className="w-3 h-3" />
              {content.room_type}
            </span>
          )}
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
          {content.title}
        </h1>

        {content.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
            {content.excerpt}
          </p>
        )}

        {content.style_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {content.style_tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {content.featured_image_url && (
        <figure className="relative aspect-[16/10] w-full max-w-6xl mx-auto rounded-2xl overflow-hidden mb-12">
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

      <div className="prose prose-lg prose-gray max-w-none dark:prose-invert mb-16">
        <MDXRemote source={html} />
      </div>

      {content.featured_products.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary-600" />
            Shop This Look
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.featured_products.map((productId) => (
              <Link key={productId} href={`/products/${productId}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:text-primary-400 transition-colors" />
                  </div>
                </div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  Product {productId.slice(-6)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 pt-8 border-t border-gray-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/lookbooks" className="btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            All Lookbooks
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Love this look?</span>
            <button className="btn-outline btn-sm flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Save Lookbook
            </button>
            <button className="btn-outline btn-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Share
            </button>
          </div>
        </nav>
      </footer>
    </article>
  );
}