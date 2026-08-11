import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore, serializeStore } from "@/lib/seller";

export async function PATCH(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { vacationMode } = body as { vacationMode?: boolean };
  const updated = await db.store.update({
    where: { id: store.id },
    data: { vacationMode: vacationMode ?? !store.vacationMode },
  });
  return NextResponse.json({ store: serializeStore(updated) });
}
