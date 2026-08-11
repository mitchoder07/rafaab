import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  const payouts = await db.payout.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: {
      store: { select: { name: true, slug: true, owner: { select: { name: true, email: true } } } },
    },
    take: 100,
  });
  return NextResponse.json({
    payouts: payouts.map((p) => ({
      id: p.id,
      storeId: p.storeId,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      owner: p.store.owner,
      amount: p.amount,
      status: p.status,
      method: p.method,
      reference: p.reference,
      note: p.note,
      bankDetails: p.bankDetails,
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt ? p.processedAt.toISOString() : null,
    })),
  });
}
