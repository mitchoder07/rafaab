import type { Product, Review, StoreData } from "./types";
import type { Product as PrismaProduct, Review as PrismaReview, Store as PrismaStore } from "@prisma/client";

type StoreFields = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  status: string;
  vacationMode: boolean;
  commissionRate: number;
  productApprovalRequired: boolean;
  rating: number;
  numReviews: number;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  createdAt: Date;
};

type ProductWithRelations = PrismaProduct & {
  category?: { id: string; name: string; slug: string; icon: string | null; image: string | null; color: string | null };
  store?: StoreFields | null;
};

export function serializeStore(s: StoreFields): StoreData {
  return {
    id: s.id,
    ownerId: s.ownerId,
    name: s.name,
    slug: s.slug,
    logo: s.logo,
    banner: s.banner,
    description: s.description,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    status: s.status,
    vacationMode: s.vacationMode,
    commissionRate: s.commissionRate,
    productApprovalRequired: s.productApprovalRequired,
    rating: s.rating,
    numReviews: s.numReviews,
    availableBalance: s.availableBalance,
    pendingBalance: s.pendingBalance,
    lifetimeEarnings: s.lifetimeEarnings,
    createdAt: s.createdAt.toISOString(),
  };
}

export function serializeProduct(p: ProductWithRelations): Product {
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
    storeId: p.storeId,
    store: p.store ? serializeStore(p.store) : null,
    approvalStatus: p.approvalStatus,
    rejectionReason: p.rejectionReason,
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
