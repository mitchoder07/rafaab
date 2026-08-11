import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  let settings = await db.platformSetting.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.platformSetting.create({ data: { id: "singleton" } });
  }
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed = ["defaultCommissionRate", "requireProductApproval", "autoApproveSellers", "minPayoutAmount", "escrowReleaseOnDelivery"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = body[k];
  }
  if (typeof data.defaultCommissionRate === "number") {
    if (data.defaultCommissionRate < 0 || data.defaultCommissionRate > 1) {
      return NextResponse.json({ error: "Commission rate must be between 0 and 1" }, { status: 400 });
    }
  }
  let settings = await db.platformSetting.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.platformSetting.create({ data: { id: "singleton", ...data } });
  } else {
    settings = await db.platformSetting.update({ where: { id: "singleton" }, data });
  }
  return NextResponse.json({ settings });
}
