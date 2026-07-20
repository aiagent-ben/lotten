import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/request";

export const metadata: Metadata = {
  title: {
    default: "Lotten — Curated Malaysian Oak Furniture",
    template: "%s | Lotten",
  },
  description: "Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.",
  keywords: ["furniture", "malaysian oak", "home decor", "interior design", "oak furniture"],
  authors: [{ name: "Lotten" }],
  creator: "Lotten",
  publisher: "Lotten",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://lotten.com",
    siteName: "Lotten",
    title: "Lotten — Curated Malaysian Oak Furniture",
    description: "Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Lotten - Malaysian Oak Furniture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lotten — Curated Malaysian Oak Furniture",
    description: "Curated Malaysian Oak furniture for modern homes — direct from manufacturer to your door.",
    images: ["/og-default.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <CartProvider>
      <LocaleSwitcher />
      {children}
    </CartProvider>
  );
}
