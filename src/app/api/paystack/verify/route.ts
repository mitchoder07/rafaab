import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder } from "@/lib/order-serialize";
import { verifyTransaction, isPaystackConfigured } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const verification = await verifyTransaction(reference);

    if (!verification.status || verification.data.status !== "success") {
      return NextResponse.json({
        verified: false,
        status: verification.data?.status || "failed",
        message: verification.data?.gateway_response || "Payment was not successful",
      });
    }

    // Find the order by the reference prefix (reference = orderNumber + "-" + timestamp)
    // The order number is everything before the last dash-segment
    const orderIdFromMeta = verification.data.metadata?.custom_fields?.find(
      (f) => f.display_name === "Order Number"
    )?.value;

    let order = null;
    if (orderIdFromMeta) {
      order = await db.order.findUnique({
        where: { orderNumber: orderIdFromMeta },
        include: { items: true, trackingEvents: true },
      });
    }
    if (!order) {
      // Fallback: find by matching orderNumber prefix
      const allOrders = await db.order.findMany({ include: { items: true, trackingEvents: true } });
      order = allOrders.find((o) => reference.startsWith(o.orderNumber)) || null;
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found for this reference" }, { status: 404 });
    }

    // Mark as paid + add a tracking event
    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: order.status === "confirmed" ? "processing" : order.status,
        trackingEvents: {
          create: {
            status: "processing",
            note: "Payment confirmed. Your order is being prepared for dispatch.",
            location: "Rafaab Fulfillment Center",
          },
        },
      },
      include: { items: true, trackingEvents: true },
    });

    return NextResponse.json({
      verified: true,
      status: "success",
      order: serializeOrder(updated),
    });
  } catch (err) {
    return NextResponse.json(
      { verified: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
