import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });
  }
  const store = await db.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const { rating, comment } = body as { rating: number; comment?: string };
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  const review = await db.storeReview.upsert({
    where: { storeId_userId: { storeId: store.id, userId } },
    create: { storeId: store.id, userId, rating: Math.round(rating), comment: comment || null },
    update: { rating: Math.round(rating), comment: comment || null },
  });
  // Recompute store rating
  const agg = await db.storeReview.aggregate({
    where: { storeId: store.id },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.store.update({
    where: { id: store.id },
    data: {
      rating: Math.round((agg._avg.rating || 0) * 10) / 10,
      numReviews: agg._count.rating,
    },
  });
  return NextResponse.json({ review });
}
