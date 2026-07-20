import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/CartProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/request";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorantDisplay = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <html lang={locale} className={cn("h-full antialiased")}>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <CartProvider>
          <LocaleSwitcher />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}