import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeProduct } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { brand: { contains: q } },
      { sku: { contains: q } },
    ];
  }
  if (category) {
    const cat = await db.category.findUnique({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  }

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return NextResponse.json({ products: products.map(serializeProduct) });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    title,
    description,
    brand,
    price,
    discountPrice,
    stock,
    images,
    specs,
    tags,
    categoryId,
    isFeatured,
    isBestSeller,
    isNewArrival,
    isFlashSale,
    flashSaleEndsAt,
  } = body as {
    title: string;
    description: string;
    brand: string;
    price: number;
    discountPrice?: number;
    stock: number;
    images: string[];
    specs?: { name: string; value: string }[];
    tags?: string[];
    categoryId: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isFlashSale?: boolean;
    flashSaleEndsAt?: string;
  };

  if (!title || !brand || !categoryId || typeof price !== "number") {
    return NextResponse.json({ error: "title, brand, categoryId and price are required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).slice(2, 6);

  const product = await db.product.create({
    data: {
      title,
      slug,
      description: description || "",
      brand,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock) || 0,
      images: JSON.stringify(images || []),
      specs: JSON.stringify(specs || []),
      tags: JSON.stringify(tags || []),
      categoryId,
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isNewArrival: !!isNewArrival,
      isFlashSale: !!isFlashSale,
      flashSaleEndsAt: flashSaleEndsAt ? new Date(flashSaleEndsAt) : null,
    },
    include: { category: true },
  });

  return NextResponse.json({ product: serializeProduct(product) });
}
