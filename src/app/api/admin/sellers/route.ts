import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeStore } from "@/lib/seller";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  const stores = await db.store.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { products: true, payouts: true } },
    },
  });
  return NextResponse.json({
    stores: stores.map((s) => ({
      ...serializeStore(s),
      owner: s.owner,
      productCount: s._count.products,
      payoutCount: s._count.payouts,
    })),
  });
}
