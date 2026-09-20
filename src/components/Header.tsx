"use client";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Lotten Home">
            <Logo variant="full" className="h-8 w-auto text-stone-900 dark:text-stone-100" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
            <Link href="/products" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/collections" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              Collections
            </Link>
            <Link href="/lookbooks" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              Lookbooks
            </Link>
            <Link href="/blog" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              Journal
            </Link>
            <Link href="/about" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right side: Locale switcher */}
          <div className="flex items-center space-x-4">
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}