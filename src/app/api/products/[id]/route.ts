import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct, serializeReview } from "@/lib/serialize";
import { getSessionUserId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const reviews = await db.review.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true, avatar: true } } },
  });

  // related: same category, exclude self
  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: id } },
    take: 8,
    orderBy: { soldCount: "desc" },
    include: { category: true },
  });

  const userId = await getSessionUserId();
  let inWishlist = false;
  if (userId) {
    const wl = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: id } },
    });
    inWishlist = !!wl;
  }

  return NextResponse.json({
    product: serializeProduct(product),
    reviews: reviews.map(serializeReview),
    related: related.map(serializeProduct),
    inWishlist,
  });
}
