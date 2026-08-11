import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore } from "@/lib/seller";
import { serializeProduct } from "@/lib/serialize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const { id } = await params;
  // Ensure product belongs to this store
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing || existing.storeId !== store.id) {
    return NextResponse.json({ error: "Product not found in your store" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const allowed = ["title", "description", "brand", "price", "discountPrice", "stock", "categoryId", "isFeatured", "isBestSeller", "isNewArrival", "isFlashSale"];
  for (const k of allowed) {
    if (k in body) {
      if (k === "price" || k === "discountPrice" || k === "stock") {
        data[k] = body[k] === null || body[k] === "" ? null : Number(body[k]);
        if (k === "stock" && body[k] !== null) data[k] = Number(body[k]);
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
  // If seller edits a previously-approved product, mark pending again if approval required
  if (store.productApprovalRequired && existing.approvalStatus === "approved") {
    data.approvalStatus = "pending";
  }
  const product = await db.product.update({
    where: { id },
    data,
    include: { category: true, store: true },
  });
  return NextResponse.json({ product: serializeProduct(product) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing || existing.storeId !== store.id) {
    return NextResponse.json({ error: "Product not found in your store" }, { status: 404 });
  }
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
