import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX, incrementViewCount } from '@/lib/data/content';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, Tag, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getStaticParamsForType('guide');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'guide');
  
  if (!content) {
    return { title: 'Guide Not Found' };
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
    other: {
      'article:published_time': content.published_at || '',
      'article:modified_time': content.updated_at || '',
      'article:tag': content.tags.join(','),
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'guide');

  if (!content) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(content.id);

  const html = await compileContentMDX(content);
  const publishedDate = content.published_at ? format(new Date(content.published_at), 'MMMM d, yyyy') : '';
  const readTime = content.read_time_minutes ? `${content.read_time_minutes} min read` : '';

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <Link 
          href="/guides" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Guides
        </Link>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          {publishedDate && (
            <time dateTime={content.published_at!} className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {publishedDate}
            </time>
          )}
          {readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readTime}
            </span>
          )}
          {content.category && (
            <span className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full">
              <Tag className="w-3 h-3" />
              {content.category}
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

        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {content.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {content.featured_image_url && (
        <figure className="relative aspect-[16/9] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden mb-12">
          <Image
            src={content.featured_image_url}
            alt={content.featured_image_alt || content.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 800px"
            className="object-cover"
            priority
          />
        </figure>
      )}

      <div className="prose prose-lg prose-gray max-w-none dark:prose-invert">
        <MDXRemote source={html} />
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/guides" className="btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            All Care Guides
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Found this helpful?</span>
            <button className="btn-outline btn-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Save Guide
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