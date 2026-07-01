import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { serializeOrder } from "@/lib/order-serialize";
import { initializeTransaction, generateReference, isPaystackConfigured } from "@/lib/paystack";
import type { AddressData } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Paystack is not configured. Add your test keys to .env (see PAYSTACK_SECRET_KEY)." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { items, shippingAddress, email, name, coupon } = body as {
    items: { productId: string; quantity: number }[];
    shippingAddress: AddressData;
    email?: string;
    name?: string;
    coupon?: string;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
    return NextResponse.json({ error: "Please complete your shipping address" }, { status: 400 });
  }

  // Resolve user (session first, else find/create by email)
  let userId = await getSessionUserId();
  let userEmail = email || "";
  if (!userId) {
    const emailVal = String(email || "").toLowerCase();
    if (!emailVal) {
      return NextResponse.json({ error: "Email is required for payment" }, { status: 400 });
    }
    let user = await db.user.findUnique({ where: { email: emailVal } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: emailVal,
          name: String(name || shippingAddress.fullName || "Guest"),
          password: "guest-" + Math.random().toString(36).slice(2),
        },
      });
    }
    userId = user.id;
    userEmail = user.email;
  } else {
    const u = await db.user.findUnique({ where: { id: userId } });
    userEmail = u?.email || userEmail;
  }

  // Fetch products + compute totals (server-authoritative)
  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData: { productId: string; title: string; image: string; price: number; quantity: number }[] = [];
  for (const item of items) {
    const p = productMap.get(item.productId);
    if (!p) continue;
    const qty = Math.max(1, Math.min(item.quantity || 1, p.stock || 99));
    const unit = p.discountPrice ?? p.price;
    subtotal += unit * qty;
    const imgs: string[] = JSON.parse(p.images);
    orderItemsData.push({ productId: p.id, title: p.title, image: imgs[0] || "", price: unit, quantity: qty });
  }
  if (orderItemsData.length === 0) {
    return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
  }

  const shipping = subtotal >= 50000 ? 0 : 2500;
  let discount = 0;
  if (coupon && String(coupon).toUpperCase() === "RAFAAB10") {
    discount = Math.round(subtotal * 0.1);
  }
  const total = Math.max(0, subtotal + shipping - discount);

  // Create the order (paymentStatus unpaid until Paystack confirms)
  const orderNumber = `RF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + 4 * 86400000);
  const reference = generateReference(orderNumber);

  const order = await db.order.create({
    data: {
      userId: userId!,
      orderNumber,
      status: "confirmed",
      subtotal,
      shipping,
      discount,
      total,
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod: "card",
      paymentStatus: "unpaid",
      estimatedDelivery,
      carrier: "Rafaab Express",
      items: { create: orderItemsData },
      trackingEvents: {
        create: [
          {
            status: "confirmed",
            note: "Order received. Awaiting payment confirmation.",
            location: "Rafaab Fulfillment Center",
            createdAt: now,
          },
        ],
      },
    },
    include: { items: true, trackingEvents: true },
  });

  // Initialize Paystack transaction
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const init = await initializeTransaction({
      email: userEmail,
      amount: total,
      reference,
      callback_url: `${appUrl}/?reference=${reference}&order=${order.id}`,
      metadata: {
        custom_fields: [
          { display_name: "Order Number", value: orderNumber },
          { display_name: "Customer", value: shippingAddress.fullName },
        ],
        order_id: order.id,
      },
    });

    return NextResponse.json({
      authorization_url: init.data.authorization_url,
      reference: init.data.reference,
      order: serializeOrder(order),
    });
  } catch (err) {
    // If Paystack fails, still keep the order so we can retry — but report the error
    return NextResponse.json(
      { error: (err as Error).message, order: serializeOrder(order) },
      { status: 502 }
    );
  }
}
