import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX, incrementViewCount } from '@/lib/data/content';
import { getDateFnsLocale } from '@/lib/i18n/localize';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { format } from 'date-fns';
import { ChevronLeft, Calendar, Tag, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getStaticParamsForType('blog');
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const s of slugs) {
      params.push({ locale, slug: s.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  setRequestLocale(locale);

  const [t, content] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getContentBySlug(slug, 'blog', locale),
  ]);

  if (!content) {
    return { title: t('not_found') };
  }

  return {
    title: content.meta_title || content.title,
    description: content.meta_description || content.excerpt || undefined,
    alternates: buildLocaleAlternates(locale, `/blog/${slug}`),
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

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, content] = await Promise.all([
    getTranslations({ locale, namespace: 'blog' }),
    getContentBySlug(slug, 'blog', locale),
  ]);

  if (!content) {
    notFound();
  }

  incrementViewCount(content.id);

  const html = await compileContentMDX(content);
  const dateLocale = getDateFnsLocale(locale);
  const publishedDate = content.published_at
    ? format(new Date(content.published_at), 'MMMM d, yyyy', { locale: dateLocale })
    : '';
  const readTime = content.read_time_minutes
    ? t('min_read', { minutes: content.read_time_minutes })
    : '';

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 lg:px-8 lg:py-16">
      <header className="mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('back_to_blog')}
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
            {content.tags.map((tagItem) => (
              <span key={tagItem} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                <Tag className="w-3 h-3" />
                {tagItem}
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
        {html}
      </div>

      <footer className="mt-16 pt-8 border-t border-stone-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/blog" className="btn btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('all_blog_posts')}
          </Link>
        </nav>
      </footer>
    </article>
  );
}
