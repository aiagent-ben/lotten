import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LocaleProvider } from '@/components/LocaleProvider';
import { locales, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { interSans, cormorantDisplay } from '@/lib/fonts';
import { toHtmlLang, toOgLocale } from '@/lib/i18n/localize';

const CLIENT_NAMESPACES = [
  'nav',
  'footer',
  'localeSwitcher',
  'newsletter',
  'common',
  'product',
  'search',
  'lookbook',
  'categories',
  'materials',
  'errors',
] as const;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('site_title');
  const description = t('site_description');

  return {
    title: {
      default: title,
      template: '%s | Lotten',
    },
    description,
    keywords: ['furniture', 'malaysian oak', 'home decor', 'interior design', 'oak furniture'],
    authors: [{ name: 'Lotten' }],
    creator: 'Lotten',
    publisher: 'Lotten',
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      locale: toOgLocale(locale),
      url: 'https://lotten.com',
      siteName: 'Lotten',
      title,
      description,
      images: [
        {
          url: '/hero-furniture.jpg',
          width: 1200,
          height: 630,
          alt: t('og_image_alt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/hero-furniture.jpg'],
    },
    icons: {
      icon: '/favicon.ico',
    },
    manifest: '/site.webmanifest',
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const allMessages = (await getMessages()) as Record<string, unknown>;
  const clientMessages: Record<string, unknown> = {};
  for (const ns of CLIENT_NAMESPACES) {
    if (ns in allMessages) {
      clientMessages[ns] = allMessages[ns];
    }
  }

  return (
    <html
      lang={toHtmlLang(locale)}
      className={cn('h-full antialiased', interSans.variable, cormorantDisplay.variable)}
    >
      <head>
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="PajpQgo4HGinw17tro/UmA"
          async
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <LocaleProvider>
            <Header />
            <main className="pt-16 min-h-screen">{children}</main>
            <Footer />
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
