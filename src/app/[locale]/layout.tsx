import type { Metadata } from "next";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/request";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

function getLocaleMetadata(locale: string) {
  const localeMap: Record<string, { title: string; description: string; ogLocale: string }> = {
    en: {
      title: 'Lotten — Curated Malaysian Oak Furniture',
      description: 'Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.',
      ogLocale: 'en_MY',
    },
    zh: {
      title: 'Lotten — 精选马来西亚橡木家具',
      description: '为现代家庭精选马来西亚橡木家具 — 直接从制造商到您家门口。',
      ogLocale: 'zh_MY',
    },
    my: {
      title: 'Lotten — Perabot Oak Malaysia Terpilih',
      description: 'Perabot oak Malaysia terpilih untuk rumah moden — terus dari kilang ke pintu anda.',
      ogLocale: 'ms_MY',
    },
  };

  const meta = localeMap[locale] || localeMap.en;
  return {
    title: {
      default: meta.title,
      template: '%s | Lotten',
    },
    description: meta.description,
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
      locale: meta.ogLocale,
      url: 'https://lotten.com',
      siteName: 'Lotten',
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: '/og-default.jpg',
          width: 1200,
          height: 630,
          alt: 'Lotten - Malaysian Oak Furniture',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/og-default.jpg'],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: 'https://lotten.2share.tech/site.webmanifest',
  };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return getLocaleMetadata(locale);
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <>
      <header className="fixed top-0 right-0 z-[60] p-4">
        <LocaleSwitcher />
      </header>
      <main className="pt-12 min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
