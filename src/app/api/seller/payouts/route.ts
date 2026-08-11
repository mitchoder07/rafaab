import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore, getPlatformSettings } from "@/lib/seller";

export async function GET() {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const payouts = await db.payout.findMany({
    where: { storeId: store.id },
    orderBy: { requestedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    payouts: payouts.map((p) => ({
      id: p.id,
      storeId: p.storeId,
      amount: p.amount,
      status: p.status,
      method: p.method,
      reference: p.reference,
      note: p.note,
      bankDetails: p.bankDetails,
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt ? p.processedAt.toISOString() : null,
      processedById: p.processedById,
    })),
  });
}

export async function POST(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const settings = await getPlatformSettings();
  const body = await req.json().catch(() => ({}));
  const { amount, note } = body as { amount: number; note?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (amount < settings.minPayoutAmount) {
    return NextResponse.json({ error: `Minimum payout is ₦${settings.minPayoutAmount.toLocaleString()}` }, { status: 400 });
  }
  if (!store.payoutDetails) {
    return NextResponse.json({ error: "Please add your bank details first in Store Settings" }, { status: 400 });
  }

  // Atomic transaction: check balance, decrement, create payout
  const result = await db.$transaction(async (tx) => {
    const fresh = await tx.store.findUnique({ where: { id: store.id } });
    if (!fresh || fresh.availableBalance < amount) {
      throw new Error("Insufficient available balance");
    }
    await tx.store.update({
      where: { id: store.id },
      data: { availableBalance: { decrement: amount } },
    });
    const payout = await tx.payout.create({
      data: {
        storeId: store.id,
        amount,
        status: "requested",
        method: "bank_transfer",
        note: note || null,
        bankDetails: fresh.payoutDetails!,
      },
    });
    return payout;
  });

  return NextResponse.json({
    payout: {
      id: result.id,
      storeId: result.storeId,
      amount: result.amount,
      status: result.status,
      method: result.method,
      reference: result.reference,
      note: result.note,
      bankDetails: result.bankDetails,
      requestedAt: result.requestedAt.toISOString(),
      processedAt: result.processedAt ? result.processedAt.toISOString() : null,
      processedById: result.processedById,
    },
  });
}
