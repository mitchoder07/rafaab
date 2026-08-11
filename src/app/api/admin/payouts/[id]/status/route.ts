import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, note, reference } = body as { status: string; note?: string; reference?: string };
  const valid = ["requested", "approved", "rejected", "paid", "failed"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const payout = await db.payout.findUnique({ where: { id } });
  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {
    status,
    processedAt: new Date(),
    processedById: admin.id,
  };
  if (note) data.note = note;
  if (reference) data.reference = reference;

  // If rejecting, refund the store's available balance
  if (status === "rejected" && payout.status !== "rejected") {
    await db.store.update({
      where: { id: payout.storeId },
      data: { availableBalance: { increment: payout.amount } },
    });
  }

  const updated = await db.payout.update({ where: { id }, data });
  return NextResponse.json({ payout: updated });
}
