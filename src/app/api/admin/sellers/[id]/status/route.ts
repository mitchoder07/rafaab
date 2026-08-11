import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeStore } from "@/lib/seller";

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
  const { status } = body as { status: string };
  const valid = ["pending", "approved", "suspended", "rejected"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const store = await db.store.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ store: serializeStore(store) });
}
