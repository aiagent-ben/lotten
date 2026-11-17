import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Site-wide footer — rendered by `[locale]/layout.tsx` so every route
 * (products, collections, blog, stub pages) has a consistent footer.
 *
 * Dead links intentionally removed per audit:
 *   /sustainability, /careers, /press — no content, no route, no link.
 */
export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="mb-4 block"
              aria-label="Lotten Home"
            >
              <Logo variant="full" className="h-9 w-auto text-white" />
            </Link>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Curated Malaysian Oak furniture for modern homes. Direct from
              manufacturer to your door — honest pricing, exceptional quality.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Shop</h4>
            <nav className="space-y-2">
              <Link
                href="/products"
                className="text-sm hover:text-white transition-colors block"
              >
                All Products
              </Link>
              <Link
                href="/collections"
                className="text-sm hover:text-white transition-colors block"
              >
                Collections
              </Link>
              <Link
                href="/products?category=new"
                className="text-sm hover:text-white transition-colors block"
              >
                New Arrivals
              </Link>
              <Link
                href="/products?category=bestseller"
                className="text-sm hover:text-white transition-colors block"
              >
                Bestsellers
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Stories & Care</h4>
            <nav className="space-y-2">
              <Link
                href="/blog"
                className="text-sm hover:text-white transition-colors block"
              >
                Journal & News
              </Link>
              <Link
                href="/guides"
                className="text-sm hover:text-white transition-colors block"
              >
                Care Guides
              </Link>
              <Link
                href="/lookbooks"
                className="text-sm hover:text-white transition-colors block"
              >
                Lookbooks
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Support</h4>
            <nav className="space-y-2">
              <Link
                href="/contact"
                className="text-sm hover:text-white transition-colors block"
              >
                Contact Us
              </Link>
              <Link
                href="/faq"
                className="text-sm hover:text-white transition-colors block"
              >
                FAQ
              </Link>
              <Link
                href="/shipping"
                className="text-sm hover:text-white transition-colors block"
              >
                Shipping Info
              </Link>
              <Link
                href="/returns"
                className="text-sm hover:text-white transition-colors block"
              >
                Returns
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <nav className="space-y-2">
              <Link
                href="/about"
                className="text-sm hover:text-white transition-colors block"
              >
                About Us
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} Lotten Furniture. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://www.facebook.com/lottenfurniture/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
