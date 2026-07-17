"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/db/client";

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  slug: string;
  brand?: string;
  collection?: string;
};

const CART_COOKIE_NAME = "lotten_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function getCartFromCookie(): Promise<CartItem[]> {
  try {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    if (!cartCookie) return [];
    return JSON.parse(cartCookie);
  } catch {
    return [];
  }
}

async function setCartCookie(items: CartItem[]) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, JSON.stringify(items), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getCart(): Promise<CartItem[]> {
  return getCartFromCookie();
}

export async function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }): Promise<{ success: boolean; items: CartItem[]; error?: string }> {
  const cart = await getCartFromCookie();
  const existingIndex = cart.findIndex(
    (i) => i.productId === item.productId && i.variantId === item.variantId
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }

  await setCartCookie(cart);
  return { success: true, items: cart };
}

export async function updateCartQuantity(
  productId: string,
  variantId: string | undefined,
  quantity: number
): Promise<{ success: boolean; items: CartItem[]; error?: string }> {
  if (quantity < 0) return { success: false, items: [], error: "Quantity cannot be negative" };

  const cart = await getCartFromCookie();
  const index = cart.findIndex(
    (i) => i.productId === productId && i.variantId === variantId
  );

  if (index === -1) {
    return { success: false, items: cart, error: "Item not found in cart" };
  }

  if (quantity === 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }

  await setCartCookie(cart);
  return { success: true, items: cart };
}

export async function removeFromCart(
  productId: string,
  variantId?: string
): Promise<{ success: boolean; items: CartItem[] }> {
  const cart = await getCartFromCookie();
  const filtered = cart.filter(
    (i) => i.productId !== productId || i.variantId !== variantId
  );
  await setCartCookie(filtered);
  return { success: true, items: filtered };
}

export async function clearCart(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE_NAME);
}

export async function getCartTotal(): Promise<{ subtotal: number; itemCount: number }> {
  const cart = await getCartFromCookie();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

// Merge anonymous cart with user's database cart on login
export async function mergeCartOnLogin(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const anonymousCart = await getCartFromCookie();

  if (anonymousCart.length === 0) return;

  // Get existing user cart from database
  const { data: existingCart } = await supabase
    .from("carts")
    .select("items")
    .eq("user_id", userId)
    .single();

  const userCartItems = existingCart?.items || [];
  const mergedItems = [...userCartItems];

  // Merge items - sum quantities for same product/variant
  for (const anonItem of anonymousCart) {
    const existingIndex = mergedItems.findIndex(
      (i) => i.product_id === anonItem.productId && i.variant_id === anonItem.variantId
    );

    if (existingIndex >= 0) {
      mergedItems[existingIndex].quantity += anonItem.quantity;
    } else {
      mergedItems.push({
        product_id: anonItem.productId,
        variant_id: anonItem.variantId,
        quantity: anonItem.quantity,
        price: anonItem.price,
      });
    }
  }

  // Upsert merged cart
  await supabase.from("carts").upsert({
    user_id: userId,
    items: mergedItems,
    updated_at: new Date().toISOString(),
  });

  // Clear anonymous cart
  await clearCart();
}