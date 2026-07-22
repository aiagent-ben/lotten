import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "About Lotten",
  description:
    "Lotten is a direct-to-consumer Malaysian Oak furniture maker. We control every step from timber to finish — honest furniture at honest prices.",
};

export default function AboutPage() {
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
          About Lotten
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Lotten is a direct-to-consumer furniture maker specialising in
          Malaysian Oak — a hardwood prized for its tight grain, warm tone, and
          dimensional stability. Our pieces are designed for real homes: simple
          silhouettes, honest joinery, and finishes that age gracefully.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          We control the entire journey from timber selection to final finish
          in our Malaysian workshop. There are no middlemen, no showroom
          markups, and no inflated list prices. Every product is priced to
          reflect what it actually costs to make — plus a fair margin.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          The result is heirloom-quality furniture at manufacturer-direct prices,
          delivered to homes across Malaysia. We believe in craftsmanship that
          respects the material, the maker, and the customer in equal measure.
        </p>

        <section className="border-t border-gray-100 pt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            What We Make
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>TV cabinets and sideboards</strong> for living rooms,
              media walls, and dining spaces.
            </li>
            <li>
              <strong>Dining and coffee tables</strong> in solid Malaysian Oak
              with hand-applied finishes.
            </li>
            <li>
              <strong>Working desks and storage</strong> designed for home
              offices and small spaces.
            </li>
            <li>
              <strong>Curated collections</strong> across three brands —
              NestHouZ, NestNordic, and Luooma — each with its own design
              language.
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-100 pt-12 mt-12">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">
            Our Promise
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            If you have a question about a piece, a finish, or a delivery
            timeline, you can reach a human who knows the answer. Visit our{" "}
            <Link
              href="/contact"
              className="text-amber-700 hover:text-amber-900 underline underline-offset-4"
            >
              contact page
            </Link>{" "}
            — we typically reply within one business day.
          </p>
        </section>
      </article>
    </main>
  );
}
