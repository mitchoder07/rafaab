import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/seller";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "store-" + Math.random().toString(36).slice(2, 6);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to apply as a seller" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { storeName, description, supportEmail, supportPhone, businessType, categories } = body as {
    storeName: string;
    description?: string;
    supportEmail: string;
    supportPhone: string;
    businessType?: string;
    categories?: string[];
  };

  if (!storeName || !supportEmail || !supportPhone) {
    return NextResponse.json({ error: "Store name, support email and phone are required" }, { status: 400 });
  }

  // Check if user already has a store or pending application
  const existingStore = await db.store.findUnique({ where: { ownerId: userId } });
  if (existingStore) {
    return NextResponse.json({ error: "You already have a store", store: existingStore }, { status: 409 });
  }
  const existingApp = await db.sellerApplication.findFirst({
    where: { userId, status: "pending" },
    orderBy: { submittedAt: "desc" },
  });
  if (existingApp) {
    return NextResponse.json({ error: "You already have a pending application", application: existingApp }, { status: 409 });
  }

  const storeSlug = slugify(storeName);
  // Ensure slug uniqueness
  const slugExists = await db.store.findUnique({ where: { slug: storeSlug } });
  const finalSlug = slugExists ? `${storeSlug}-${Math.random().toString(36).slice(2, 5)}` : storeSlug;

  const settings = await getPlatformSettings();

  const application = await db.sellerApplication.create({
    data: {
      userId,
      storeName,
      storeSlug: finalSlug,
      description: description || null,
      supportEmail,
      supportPhone,
      businessType: businessType || null,
      categories: categories ? JSON.stringify(categories) : null,
    },
  });

  // Auto-approve if setting is enabled
  if (settings.autoApproveSellers) {
    const store = await db.store.create({
      data: {
        ownerId: userId,
        name: storeName,
        slug: finalSlug,
        description: description || null,
        supportEmail,
        supportPhone,
        status: "approved",
        commissionRate: settings.defaultCommissionRate,
        productApprovalRequired: settings.requireProductApproval,
      },
    });
    await db.sellerApplication.update({
      where: { id: application.id },
      data: { status: "approved", storeId: store.id, reviewedAt: new Date() },
    });
    return NextResponse.json({ application: { ...application, status: "approved", storeId: store.id }, autoApproved: true });
  }

  return NextResponse.json({ application });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ application: null, store: null });
  }
  const store = await db.store.findUnique({ where: { ownerId: userId } });
  const application = await db.sellerApplication.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ application, store });
}
