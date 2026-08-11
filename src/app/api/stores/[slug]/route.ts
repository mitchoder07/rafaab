import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeStore } from "@/lib/seller";
import { serializeProduct } from "@/lib/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await db.store.findUnique({
    where: { slug },
    include: {
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!store || store.status !== "approved") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 24;
  const [total, products] = await Promise.all([
    db.product.count({ where: { storeId: store.id, approvalStatus: "approved" } }),
    db.product.findMany({
      where: { storeId: store.id, approvalStatus: "approved" },
      orderBy: { soldCount: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, store: true },
    }),
  ]);
  return NextResponse.json({
    store: serializeStore(store),
    products: products.map(serializeProduct),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
    reviews: store.reviews.map((r) => ({
      id: r.id,
      storeId: r.storeId,
      userId: r.userId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: r.user ? { name: r.user.name, avatar: r.user.avatar } : null,
    })),
  });
}
