"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label={t("home_aria")}>
            <Logo variant="full" className="h-8 w-auto text-stone-900 dark:text-stone-100" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label={t("main_nav_aria")}>
            <Link href="/products" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("products")}
            </Link>
            <Link href="/collections" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("collections")}
            </Link>
            <Link href="/lookbooks" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("lookbooks")}
            </Link>
            <Link href="/blog" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("journal")}
            </Link>
            <Link href="/about" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("about")}
            </Link>
            <Link href="/contact" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              {t("contact")}
            </Link>
          </nav>

          {/* Right side: Locale switcher */}
          <div className="flex items-center space-x-4">
            <Suspense fallback={<div className="w-[160px] h-[38px] rounded-lg border border-gray-200 bg-gray-50" />}>
              <LocaleSwitcher />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
