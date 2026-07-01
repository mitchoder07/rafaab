import type { Product, Review } from "./types";
import type { Product as PrismaProduct, Review as PrismaReview } from "@prisma/client";

type ProductWithCategory = PrismaProduct & { category?: { id: string; name: string; slug: string; icon: string | null; image: string | null; color: string | null } };

export function serializeProduct(p: ProductWithCategory): Product {
  let images: string[] = [];
  try {
    images = JSON.parse(p.images);
  } catch {
    images = [];
  }
  let specs: { name: string; value: string }[] = [];
  try {
    specs = p.specs ? JSON.parse(p.specs) : [];
  } catch {
    specs = [];
  }
  let tags: string[] = [];
  try {
    tags = p.tags ? JSON.parse(p.tags) : [];
  } catch {
    tags = [];
  }
  const effectivePrice = p.discountPrice ?? p.price;
  const discountPercent =
    p.discountPrice && p.price > 0
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
      : 0;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    images,
    specs,
    tags,
    rating: p.rating,
    numReviews: p.numReviews,
    soldCount: p.soldCount,
    categoryId: p.categoryId,
    isFlashSale: p.isFlashSale,
    flashSaleEndsAt: p.flashSaleEndsAt ? p.flashSaleEndsAt.toISOString() : null,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          icon: p.category.icon,
          image: p.category.image,
          color: p.category.color,
        }
      : undefined,
    effectivePrice,
    discountPercent,
  };
}

export function serializeReview(r: PrismaReview & { user?: { name: string | null; avatar: string | null } }): Review {
  return {
    id: r.id,
    userId: r.userId,
    productId: r.productId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    user: r.user ? { name: r.user.name || "Anonymous", avatar: r.user.avatar } : undefined,
  };
}
