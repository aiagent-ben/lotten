import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX } from '@/lib/data/content';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft, Calendar, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getStaticParamsForType('page');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'page');
  
  if (!content) {
    return { title: 'Page Not Found' };
  }

  return {
    title: content.meta_title || content.title,
    description: content.meta_description || content.excerpt || undefined,
    openGraph: {
      title: content.meta_title || content.title,
      description: content.meta_description || content.excerpt || undefined,
      type: 'website',
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

export default async function PagePage({ params }: PageProps) {
  const { slug } = await params;
  const content = await getContentBySlug(slug, 'page');

  if (!content) {
    notFound();
  }

  const html = await compileContentMDX(content);

  return (
    <article className={`max-w-6xl mx-auto px-4 py-12 lg:px-8 lg:py-16 ${content.template === 'wide' ? 'max-w-full' : ''}`}>
      <header className="mb-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </Link>
        
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
          {content.title}
        </h1>

        {content.featured_image_url && (
          <figure className="relative aspect-[16/9] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden mt-8 mb-12">
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
      </header>

      <div className="prose prose-lg prose-gray max-w-none dark:prose-invert">
        <MDXRemote source={html} />
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </nav>
      </footer>
    </article>
  );
}