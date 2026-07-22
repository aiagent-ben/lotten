import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "Lotten's 30-day return policy for undamaged items, and the conditions for made-to-order pieces.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-6">
          Returns & Exchanges
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          We want you to live with your furniture — not just look at it. If a
          piece doesn't work in your space, you have 30 days from delivery to
          return it.
        </p>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Eligibility
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              Items must be unused, undamaged, and in their original packaging.
            </li>
            <li>
              Made-to-order and custom-built pieces are non-returnable unless
              defective.
            </li>
            <li>
              Final-sale or clearance items are non-returnable; this is stated
              on the product page before purchase.
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            How to Start a Return
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Email{" "}
            <a
              href="mailto:hello@lotten.com"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              hello@lotten.com
            </a>{" "}
            with your order number and a short description of the issue. We'll
            reply with return instructions and arrange pickup if needed.
          </p>
        </section>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Refunds
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Once we receive and inspect the returned item, we'll refund the
            purchase price to your original payment method within 5–10 business
            days. Original shipping is non-refundable except in the case of a
            defective or wrong-item shipment.
          </p>
        </section>
      </article>
    </main>
  );
}
