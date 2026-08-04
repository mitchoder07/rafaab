import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

// GET /api/recommendations?productId=... OR ?category=... OR generic mix
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const categorySlug = searchParams.get("category");

  if (productId) {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (product) {
      const related = await db.product.findMany({
        where: { categoryId: product.categoryId, id: { not: productId } },
        take: 10,
        orderBy: { soldCount: "desc" },
        include: { category: true },
      });
      return NextResponse.json({ products: related.map(serializeProduct) });
    }
  }

  if (categorySlug) {
    const cat = await db.category.findUnique({ where: { slug: categorySlug } });
    if (cat) {
      const products = await db.product.findMany({
        where: { categoryId: cat.id },
        take: 10,
        orderBy: { soldCount: "desc" },
        include: { category: true },
      });
      return NextResponse.json({ products: products.map(serializeProduct) });
    }
  }

  // generic: best sellers + new arrivals mix
  const [best, fresh] = await Promise.all([
    db.product.findMany({
      where: { isBestSeller: true },
      take: 6,
      orderBy: { soldCount: "desc" },
      include: { category: true },
    }),
    db.product.findMany({
      where: { isNewArrival: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
  ]);
  const seen = new Set<string>();
  const mix = [...best, ...fresh].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  return NextResponse.json({ products: mix.map(serializeProduct) });
}
