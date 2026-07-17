"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, CreditCard, Building, Truck } from "lucide-react";
import { useCart } from "@/components/CartDrawer";
import { formatPrice } from "@/lib/utils";

export function CheckoutPageClient() {
  const { items, subtotal, itemCount, closeCart } = useCart();
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Malaysia",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Close cart drawer when on checkout page
  useEffect(() => {
    closeCart();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
          shipping,
          subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="heading-1 text-gray-900 mb-4">Your cart is empty</h1>
            <p className="body-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Add some furniture to your cart before checking out.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all duration-200">
              Browse Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const shippingCost = subtotal >= 2000 ? 0 : 150;
  const total = subtotal + shippingCost;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="py-8 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {success ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <svg className="mx-auto w-16 h-16 text-amber-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h1 className="heading-1 text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="body-lg text-gray-600 mb-8">
                Thank you for your order. A confirmation email has been sent to {shipping.email}.
              </p>
              <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all duration-200">
                Continue Shopping
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shipping Details */}
                <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
                  <h2 className="heading-3 text-gray-900 mb-6">Shipping Details</h2>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="label">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={shipping.firstName}
                        onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                        className="input mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="label">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={shipping.lastName}
                        onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                        className="input mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="label">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={shipping.email}
                      onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                      className="input mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      className="input mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="label">Address *</label>
                    <textarea
                      id="address"
                      name="address"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      className="input mt-1"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="city" className="label">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        className="input mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="label">State *</label>
                      <select
                        id="state"
                        name="state"
                        value={shipping.state}
                        onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                        className="input mt-1"
                        required
                      >
                        <option value="">Select state</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Johor">Johor</option>
                        <option value="Penang">Penang</option>
                        <option value="Perak">Perak</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Terengganu">Terengganu</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Perlis">Perlis</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="postalCode" className="label">Postal Code *</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={shipping.postalCode}
                        onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                        className="input mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="label">Country *</label>
                      <select
                        id="country"
                        name="country"
                        value={shipping.country}
                        onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                        className="input mt-1"
                        required
                      >
                        <option value="Malaysia">Malaysia</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Payment Method */}
                <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
                  <h2 className="heading-3 text-gray-900 mb-6">Payment Method</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                      <input type="radio" name="payment" value="card" defaultChecked className="w-5 h-5 text-amber-600 border-gray-300 focus:ring-amber-500" />
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Credit / Debit Card</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                      <input type="radio" name="payment" value="fpx" className="w-5 h-5 text-amber-600 border-gray-300 focus:ring-amber-500" />
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">FPX Online Banking</p>
                          <p className="text-sm text-gray-500">Direct bank transfer via FPX</p>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                      <input type="radio" name="payment" value="installment" className="w-5 h-5 text-amber-600 border-gray-300 focus:ring-amber-500" />
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Installment (Atome / GrabPayLater)</p>
                          <p className="text-sm text-gray-500">Pay in 3 interest-free payments</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 sticky top-24">
                  <h2 className="heading-3 text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId || "default"}`} className="flex gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.brand} / {item.collection}</p>
                          <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Shipping</span>
                      <span className="font-medium">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                    </div>
                    {subtotal >= 2000 && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        Free shipping on orders over RM 2,000!
                      </p>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                    className="btn-primary btn-lg w-full mt-6"
                  >
                    {loading ? "Processing..." : `Place Order — ${formatPrice(total)}`}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </section>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}