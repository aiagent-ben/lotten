import Link from "next/link";

/**
 * Site-wide footer — rendered by `[locale]/layout.tsx` so every route
 * (products, collections, blog, stub pages) has a consistent footer.
 *
 * Dead links intentionally removed per audit:
 *   /sustainability, /careers, /press — no content, no route, no link.
 */
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="font-display text-2xl font-semibold text-white mb-4 block"
            >
              Lotten
            </Link>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
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

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Lotten. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.163-6.162-6.163zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
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
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Pinterest"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-3.193 0-5.523-2.248-5.523-5.273 0-1.233.602-2.17 1.392-2.687.097-.065.134-.13.112-.215l-.268-1.071c-.066-.271.01-.538.278-.456 1.672.479 3.532.985 4.532.985 5.52 0 9.007-4.035 9.007-8.969 0-4.949-3.694-9.264-8.507-9.264z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
