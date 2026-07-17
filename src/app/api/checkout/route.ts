import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, subtotal } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    if (!shipping?.email || !shipping?.firstName || !shipping?.lastName) {
      return NextResponse.json({ success: false, error: "Shipping details required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Calculate totals
    const shippingCost = subtotal >= 2000 ? 0 : 150; // MYR
    const total = subtotal + shippingCost;
    const orderNumber = `LOT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Check if customer exists by email
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", shipping.email)
      .single();

    let customerId: string | null = existingCustomer?.id || null;

    // Create customer if not exists
    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          email: shipping.email,
          contact_name: `${shipping.firstName} ${shipping.lastName}`,
          phone: shipping.phone,
          address: shipping,
        })
        .select("id")
        .single();

      if (customerError) {
        console.error("Customer creation error:", customerError);
        return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
      }

      customerId = newCustomer.id;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "pending",
        currency: "MYR",
        subtotal_usd: subtotal,
        shipping_usd: shippingCost,
        total_usd: total,
        shipping_address: shipping,
        billing_address: shipping,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      unit_price_usd: item.price,
      line_total_usd: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      return NextResponse.json({ success: false, error: "Failed to create order items" }, { status: 500 });
    }

    // Log order analytics
    for (const item of items) {
      await supabase.from("order_analytics").insert({
        event_type: "order_created",
        product_id: item.productId,
        variant_id: item.variantId || null,
        customer_id: customerId,
        order_id: order.id,
        value_usd: item.price * item.quantity,
        metadata: { order_number: orderNumber },
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      total,
    });
  } catch (error) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}