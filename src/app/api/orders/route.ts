import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { serializeOrder } from "@/lib/order-serialize";
import type { AddressData } from "@/lib/types";

function genOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RF-${ts}-${rand}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const numbersParam = searchParams.get("numbers");
  const userId = await getSessionUserId();

  let orders;
  if (userId) {
    orders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true, trackingEvents: true },
    });
  } else if (numbersParam) {
    const numbers = numbersParam.split(",").map((s) => s.trim()).filter(Boolean);
    orders = await db.order.findMany({
      where: { orderNumber: { in: numbers } },
      orderBy: { createdAt: "desc" },
      include: { items: true, trackingEvents: true },
    });
  } else {
    orders = [];
  }

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { items, shippingAddress, paymentMethod, email, name, coupon } = body as {
    items: { productId: string; quantity: number }[];
    shippingAddress: AddressData;
    paymentMethod: string;
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

  // Resolve user: session first, else find/create by email
  let userId = await getSessionUserId();
  if (!userId) {
    const emailVal = String(email || "").toLowerCase();
    if (!emailVal) {
      return NextResponse.json({ error: "Email is required for guest checkout" }, { status: 400 });
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
  }

  // Fetch products and compute totals from DB (never trust client prices)
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
    orderItemsData.push({
      productId: p.id,
      title: p.title,
      image: imgs[0] || "",
      price: unit,
      quantity: qty,
    });
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

  const orderNumber = genOrderNumber();
  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + 4 * 86400000); // 4 days

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
      paymentMethod: paymentMethod || "card",
      paymentStatus: paymentMethod === "cod" ? "unpaid" : "paid",
      estimatedDelivery,
      carrier: "Rafaab Express",
      items: { create: orderItemsData },
      trackingEvents: {
        create: [
          {
            status: "confirmed",
            note: "Order received and payment confirmed. We're preparing your items.",
            location: "Rafaab Fulfillment Center",
            createdAt: now,
          },
        ],
      },
    },
    include: { items: true, trackingEvents: true },
  });

  // Decrement stock + increment soldCount
  await Promise.all(
    orderItemsData.map((it) =>
      db.product.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: it.quantity },
          soldCount: { increment: it.quantity },
        },
      })
    )
  );

  return NextResponse.json({ order: serializeOrder(order) });
}
