import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Lotten",
  description:
    "Questions about a product, finish, or delivery? Reach the Lotten team — we typically reply within one business day.",
};

export default function ContactPage() {
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
          Contact Us
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          Have a question about a piece, a finish, or a delivery timeline? We
          typically reply within one business day. Choose whichever channel
          suits you best.
        </p>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            Email
          </h2>
          <p className="text-lg text-gray-700">
            <a
              href="mailto:hello@lotten.com"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              hello@lotten.com
            </a>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            For order enquiries, product specifications, or partnership
            requests.
          </p>
        </section>

        <section className="border-t border-gray-100 pt-12 mb-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            Workshop & Showroom
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Selangor, Malaysia
            <br />
            Visits by appointment — please email ahead so we can prepare the
            pieces you want to see.
          </p>
        </section>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
            Hours
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Monday – Friday, 9:00am – 6:00pm MYT
            <br />
            Closed on Malaysian public holidays.
          </p>
        </section>
      </article>
    </main>
  );
}
