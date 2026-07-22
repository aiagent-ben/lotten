import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping Information",
  description:
    "Delivery timelines and shipping options for Lotten furniture within Malaysia.",
};

export default function ShippingPage() {
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
          Shipping Information
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          We deliver throughout Peninsular Malaysia and East Malaysia. All
          shipping is handled in-house — no third-party logistics — so your
          piece arrives exactly as it left the workshop.
        </p>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Delivery Timelines
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Stocked items:</strong> 3–5 business days within
              Peninsular Malaysia; 5–10 business days to East Malaysia.
            </li>
            <li>
              <strong>Made-to-order items:</strong> 6–10 weeks depending on the
              collection and finish. The lead time for each product is shown on
              its detail page.
            </li>
            <li>
              <strong>Custom orders:</strong> Quoted individually at the time
              of order.
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Shipping Rates
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Flat-rate shipping is calculated at checkout based on state and
            order size:
          </p>
          <ul className="space-y-2 mt-4 text-gray-700">
            <li>Peninsular Malaysia: RM 150 per shipment.</li>
            <li>Sabah and Sarawak: RM 250 per shipment.</li>
            <li>
              Orders above RM 2,000 ship free within Peninsular Malaysia.
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Rates are reviewed quarterly. Confirm at checkout before placing
            your order.
          </p>
        </section>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Track Your Order
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Once your order ships we'll send a tracking link by email. Having
            trouble?{" "}
            <Link
              href="/contact"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              Contact the Lotten team
            </Link>{" "}
            and we'll sort it out.
          </p>
        </section>
      </article>
    </main>
  );
}
