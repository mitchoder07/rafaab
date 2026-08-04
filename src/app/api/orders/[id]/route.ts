import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder } from "@/lib/order-serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // id can be the order id OR the orderNumber
  const order = await db.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: { items: true, trackingEvents: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: serializeOrder(order) });
}
