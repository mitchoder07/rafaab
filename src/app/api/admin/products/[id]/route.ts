import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeProduct } from "@/lib/serialize";

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

  const data: Record<string, unknown> = {};
  const allowed = [
    "title",
    "description",
    "brand",
    "price",
    "discountPrice",
    "stock",
    "categoryId",
    "isFeatured",
    "isBestSeller",
    "isNewArrival",
    "isFlashSale",
    "flashSaleEndsAt",
  ];
  for (const k of allowed) {
    if (k in body) {
      if (k === "price" || k === "discountPrice" || k === "stock") {
        data[k] = body[k] === null || body[k] === "" ? null : Number(body[k]);
        if (k === "stock" && body[k] !== null) data[k] = Number(body[k]);
      } else if (k === "flashSaleEndsAt") {
        data[k] = body[k] ? new Date(body[k]) : null;
      } else if (k.startsWith("is")) {
        data[k] = !!body[k];
      } else {
        data[k] = body[k];
      }
    }
  }
  if (body.images) data.images = JSON.stringify(body.images);
  if (body.specs) data.specs = JSON.stringify(body.specs);
  if (body.tags) data.tags = JSON.stringify(body.tags);

  const product = await db.product.update({
    where: { id },
    data,
    include: { category: true },
  });

  return NextResponse.json({ product: serializeProduct(product) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
