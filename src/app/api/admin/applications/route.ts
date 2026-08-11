import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/seller";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  const applications = await db.sellerApplication.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ applications });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { applicationId, action, rejectionReason } = body as {
    applicationId: string;
    action: "approve" | "reject";
    rejectionReason?: string;
  };
  const application = await db.sellerApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (action === "approve") {
    const settings = await getPlatformSettings();
    const store = await db.store.create({
      data: {
        ownerId: application.userId,
        name: application.storeName,
        slug: application.storeSlug,
        description: application.description,
        supportEmail: application.supportEmail,
        supportPhone: application.supportPhone,
        status: "approved",
        commissionRate: settings.defaultCommissionRate,
        productApprovalRequired: settings.requireProductApproval,
      },
    });
    await db.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status: "approved",
        storeId: store.id,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ store, application: { ...application, status: "approved", storeId: store.id } });
  } else {
    const updated = await db.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status: "rejected",
        rejectionReason: rejectionReason || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ application: updated });
  }
}
