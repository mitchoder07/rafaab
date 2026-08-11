import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore } from "@/lib/seller";

export async function GET() {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const earnings = await db.sellerEarning.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { orderItem: { select: { title: true } } },
  });
  return NextResponse.json({
    earnings: earnings.map((e) => ({
      id: e.id,
      orderItemId: e.orderItemId,
      storeId: e.storeId,
      grossAmount: e.grossAmount,
      commissionRate: e.commissionRate,
      commissionAmount: e.commissionAmount,
      netAmount: e.netAmount,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      releasedAt: e.releasedAt ? e.releasedAt.toISOString() : null,
      itemTitle: e.orderItem?.title || null,
    })),
  });
}
