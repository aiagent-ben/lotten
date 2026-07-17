import { NextRequest, NextResponse } from "next/server";
import { getCart, addToCart, updateCartQuantity, removeFromCart, clearCart } from "@/lib/actions/cart";

export async function GET() {
  try {
    const items = await getCart();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return NextResponse.json({ items, subtotal, itemCount });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ items: [], subtotal: 0, itemCount: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, item, productId, variantId, quantity } = body;

    switch (action) {
      case "add": {
        if (!item) {
          return NextResponse.json({ success: false, error: "Item is required" }, { status: 400 });
        }
        const result = await addToCart(item);
        return NextResponse.json(result);
      }

      case "update": {
        if (!productId || quantity === undefined) {
          return NextResponse.json({ success: false, error: "productId and quantity are required" }, { status: 400 });
        }
        const result = await updateCartQuantity(productId, variantId, quantity);
        return NextResponse.json(result);
      }

      case "remove": {
        if (!productId) {
          return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 });
        }
        const result = await removeFromCart(productId, variantId);
        return NextResponse.json(result);
      }

      case "clear": {
        await clearCart();
        return NextResponse.json({ success: true, items: [] });
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}