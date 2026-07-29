"use client";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" aria-label="Lotten Home">
            <span className="font-display text-xl font-semibold text-gray-900">Lotten</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors">
              Products
            </Link>
            <Link href="/collections" className="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors">
              Collections
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors">
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