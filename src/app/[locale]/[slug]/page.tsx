import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getContentBySlug, getStaticParamsForType, compileContentMDX } from '@/lib/data/content';
import { buildLocaleAlternates } from '@/lib/i18n/seo';
import { locales, type Locale } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getStaticParamsForType('page');
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

  const [tCommon, content] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getContentBySlug(slug, 'page', locale),
  ]);

  if (!content) {
    return { title: tCommon('not_found') };
  }

  return {
    title: content.meta_title || content.title,
    description: content.meta_description || content.excerpt || undefined,
    alternates: buildLocaleAlternates(locale, `/${slug}`),
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
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [tCommon, content] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getContentBySlug(slug, 'page', locale),
  ]);

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
          {tCommon('home')}
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
        {html}
      </div>

      <footer className="mt-16 pt-8 border-t border-stone-200">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="btn btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {tCommon('back_to_home')}
          </Link>
        </nav>
      </footer>
    </article>
  );
}
