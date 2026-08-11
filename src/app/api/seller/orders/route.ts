import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore } from "@/lib/seller";
import { serializeOrder } from "@/lib/order-serialize";

export async function GET(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  // Find orders that contain items belonging to this store
  const orderItems = await db.orderItem.findMany({
    where: { storeId: store.id },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const orderIds = orderItems.map((oi) => oi.orderId);

  const where: Record<string, unknown> = { id: { in: orderIds } };
  if (status && status !== "all") where.status = status;

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: { where: { storeId: store.id } },
      trackingEvents: true,
      user: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...serializeOrder(o),
      customer: o.user ? { name: o.user.name, email: o.user.email } : null,
    })),
  });
}
