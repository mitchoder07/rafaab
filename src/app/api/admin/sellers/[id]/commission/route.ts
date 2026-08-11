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
  const { commissionRate, productApprovalRequired } = body as {
    commissionRate?: number;
    productApprovalRequired?: boolean;
  };
  const data: Record<string, unknown> = {};
  if (typeof commissionRate === "number") {
    if (commissionRate < 0 || commissionRate > 1) {
      return NextResponse.json({ error: "Commission rate must be between 0 and 1" }, { status: 400 });
    }
    data.commissionRate = commissionRate;
  }
  if (typeof productApprovalRequired === "boolean") {
    data.productApprovalRequired = productApprovalRequired;
  }
  const store = await db.store.update({ where: { id }, data });
  return NextResponse.json({ store: serializeStore(store) });
}
