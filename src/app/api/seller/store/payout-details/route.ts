import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore, serializeStore } from "@/lib/seller";

export async function PATCH(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { bankCode, bankName, accountNumber, accountName } = body as {
    bankCode?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: "Bank name, account number and account name are required" }, { status: 400 });
  }
  const updated = await db.store.update({
    where: { id: store.id },
    data: {
      payoutDetails: JSON.stringify({ bankCode: bankCode || "", bankName, accountNumber, accountName }),
    },
  });
  return NextResponse.json({ store: serializeStore(updated) });
}
