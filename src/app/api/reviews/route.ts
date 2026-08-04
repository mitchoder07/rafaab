import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { serializeReview } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { productId, rating, comment } = body as { productId: string; rating: number; comment: string };
  if (!productId || !rating || !comment) {
    return NextResponse.json({ error: "productId, rating and comment are required" }, { status: 400 });
  }
  const r = Math.max(1, Math.min(5, Math.round(Number(rating))));
  const review = await db.review.create({
    data: { userId, productId, rating: r, comment: String(comment).slice(0, 1000) },
    include: { user: { select: { name: true, avatar: true } } },
  });

  // Recompute product rating + numReviews
  const agg = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating || 0) * 10) / 10,
      numReviews: agg._count.rating,
    },
  });

  return NextResponse.json({ review: serializeReview(review) });
}
