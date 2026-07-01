import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeOrder } from "@/lib/order-serialize";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true, trackingEvents: true, user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...serializeOrder(o),
      customer: o.user ? { name: o.user.name, email: o.user.email } : null,
    })),
  });
}
