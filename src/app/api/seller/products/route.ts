import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore } from "@/lib/seller";
import { serializeProduct } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: Record<string, unknown> = { storeId: store.id };
  if (status && status !== "all") where.approvalStatus = status;
  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true, store: true },
  });
  return NextResponse.json({ products: products.map(serializeProduct) });
}

export async function POST(req: NextRequest) {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    title, description, brand, price, discountPrice, stock,
    images, specs, tags, categoryId,
    isFeatured, isBestSeller, isNewArrival, isFlashSale,
  } = body as {
    title: string; description: string; brand: string;
    price: number; discountPrice?: number; stock: number;
    images: string[]; specs?: { name: string; value: string }[];
    tags?: string[]; categoryId: string;
    isFeatured?: boolean; isBestSeller?: boolean; isNewArrival?: boolean; isFlashSale?: boolean;
  };

  if (!title || !brand || !categoryId || typeof price !== "number") {
    return NextResponse.json({ error: "title, brand, categoryId and price are required" }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const approvalStatus = store.productApprovalRequired ? "pending" : "approved";

  const product = await db.product.create({
    data: {
      title, slug, description: description || "", brand,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock) || 0,
      images: JSON.stringify(images || []),
      specs: JSON.stringify(specs || []),
      tags: JSON.stringify(tags || []),
      categoryId,
      storeId: store.id,
      approvalStatus,
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isNewArrival: !!isNewArrival,
      isFlashSale: !!isFlashSale,
    },
    include: { category: true, store: true },
  });

  return NextResponse.json({ product: serializeProduct(product) });
}
