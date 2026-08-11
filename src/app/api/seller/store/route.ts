import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore, serializeStore } from "@/lib/seller";

export async function PATCH(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "description", "logo", "banner", "supportEmail", "supportPhone"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = body[k];
  }
  const updated = await db.store.update({
    where: { id: store.id },
    data,
  });
  return NextResponse.json({ store: serializeStore(updated) });
}
