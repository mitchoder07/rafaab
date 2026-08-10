import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // slug
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "popular";
  const flash = searchParams.get("flash") === "1";
  const featured = searchParams.get("featured") === "1";
  const bestSeller = searchParams.get("best") === "1";
  const newArrival = searchParams.get("new") === "1";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const brand = searchParams.get("brand");
  const minRating = searchParams.get("rating");
  const limit = parseInt(searchParams.get("limit") || "0") || 0;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(60, parseInt(searchParams.get("pageSize") || "24"));

  const where: Record<string, unknown> = {};

  if (category) {
    const cat = await db.category.findUnique({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  }
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
      { brand: { contains: query } },
      { tags: { contains: query } },
    ];
  }
  if (flash) {
    where.isFlashSale = true;
    where.flashSaleEndsAt = { gt: new Date() };
  }
  if (featured) where.isFeatured = true;
  if (bestSeller) where.isBestSeller = true;
  if (newArrival) where.isNewArrival = true;
  if (brand) where.brand = brand;

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
    where.price = priceFilter;
  }
  if (minRating) {
    where.rating = { gte: parseFloat(minRating) };
  }

  let orderBy: Record<string, "asc" | "desc"> = {};
  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { rating: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "discount":
      orderBy = { soldCount: "desc" };
      break;
    default:
      orderBy = { soldCount: "desc" };
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: limit ? 0 : (page - 1) * pageSize,
      take: limit || pageSize,
      include: { category: true },
    }),
  ]);

  return NextResponse.json({
    products: products.map(serializeProduct),
    total,
    page,
    pageSize,
    totalPages: limit ? 1 : Math.ceil(total / pageSize),
  });
}
