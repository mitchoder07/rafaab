import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { serializeStore } from "@/lib/seller";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ store: null, application: null });
  }
  const store = await db.store.findUnique({ where: { ownerId: userId } });
  const application = await db.sellerApplication.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({
    store: store ? serializeStore(store) : null,
    application,
  });
}
