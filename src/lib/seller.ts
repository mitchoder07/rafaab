import { db } from "./db";
import { getSessionUserId } from "./auth";

export type StoreData = {
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
  createdAt: string;
};

// Returns the user's approved Store, or null if they're not a seller
export async function getSellerStore(): Promise<StoreData | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const store = await db.store.findUnique({
    where: { ownerId: userId },
  });
  if (!store || store.status !== "approved") return null;
  return serializeStore(store);
}

// Returns the user's store regardless of status (for seller dashboard access checks)
export async function getSellerStoreAnyStatus() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const store = await db.store.findUnique({
    where: { ownerId: userId },
  });
  return store;
}

export function serializeStore(store: {
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
  payoutDetails: string | null;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  createdAt: Date;
}): StoreData {
  return {
    id: store.id,
    ownerId: store.ownerId,
    name: store.name,
    slug: store.slug,
    logo: store.logo,
    banner: store.banner,
    description: store.description,
    supportEmail: store.supportEmail,
    supportPhone: store.supportPhone,
    status: store.status,
    vacationMode: store.vacationMode,
    commissionRate: store.commissionRate,
    productApprovalRequired: store.productApprovalRequired,
    rating: store.rating,
    numReviews: store.numReviews,
    availableBalance: store.availableBalance,
    pendingBalance: store.pendingBalance,
    lifetimeEarnings: store.lifetimeEarnings,
    createdAt: store.createdAt.toISOString(),
  };
}

// Get platform settings (singleton row, created lazily)
export async function getPlatformSettings() {
  let settings = await db.platformSetting.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) {
    settings = await db.platformSetting.create({
      data: { id: "singleton" },
    });
  }
  return settings;
}
