import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Lotten — sizing, finishes, delivery timelines, and returns.",
};

const faqs = [
  {
    q: "Are your products made from solid Malaysian Oak?",
    a: "Most pieces are built from solid Malaysian Oak for structural parts (legs, frames, tops) and use MDF with ash veneer for panel bodies — the same industry-standard construction you'll find in premium furniture. Each product's specifications list the materials and finishes in detail.",
  },
  {
    q: "How long does delivery take?",
    a: "Stocked items typically ship within 3–5 business days. Made-to-order items have a lead time of 6–10 weeks depending on the collection. The lead time for each product is shown on its detail page and on our shipping info page.",
  },
  {
    q: "Do you ship outside Malaysia?",
    a: "Currently we deliver within Peninsular Malaysia and East Malaysia. For international enquiries, please email hello@lotten.com and we'll quote separately.",
  },
  {
    q: "What finishes are available?",
    a: "Finishes vary by collection — Natural, Cocoa, Walnut, White Marble, White Wash, Black, and a small number of accent codes (Gold, Space Blue). Each product page lists the finish codes with the materials used.",
  },
  {
    q: "Can I see a piece before buying?",
    a: "Yes. Our workshop is in Selangor and visits are by appointment. Email hello@lotten.com to arrange a viewing — we'll have the pieces you're considering ready.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 30 days of delivery on undamaged, unused items in their original packaging. Custom and made-to-order pieces are non-returnable unless defective. See our returns page for full details.",
  },
];

export default function FAQPage() {
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

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-12">
          Frequently Asked Questions
        </h1>

        <div className="space-y-12">
          {faqs.map((faq) => (
            <section key={faq.q} className="border-t border-gray-100 pt-8">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-3">
                {faq.q}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">{faq.a}</p>
            </section>
          ))}
        </div>

        <section className="border-t border-gray-100 pt-12 mt-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            Still have a question?{" "}
            <Link
              href="/contact"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              Reach the Lotten team
            </Link>{" "}
            — we typically reply within one business day.
          </p>
        </section>
      </article>
    </main>
  );
}
