// Shared types for Rafaab frontend/backend

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  color: string | null;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  images: string[];
  specs: { name: string; value: string }[];
  tags: string[];
  rating: number;
  numReviews: number;
  soldCount: number;
  categoryId: string;
  isFlashSale: boolean;
  flashSaleEndsAt: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  category?: Category;
  // Marketplace fields
  storeId?: string | null;
  store?: StoreData | null;
  approvalStatus?: string;
  rejectionReason?: string | null;
  // computed
  effectivePrice?: number;
  discountPercent?: number;
};

export type Review = {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string; avatar: string | null };
};

export type CartItemData = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type CartData = {
  id: string;
  items: CartItemData[];
};

export type OrderItemData = {
  id: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  storeId?: string | null;
  store?: StoreData | null;
};

export type TrackingEventData = {
  id: string;
  status: string;
  note: string | null;
  location: string | null;
  createdAt: string;
};

export type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: AddressData;
  paymentMethod: string;
  paymentStatus: string;
  estimatedDelivery: string | null;
  carrier: string | null;
  createdAt: string;
  items: OrderItemData[];
  trackingEvents?: TrackingEventData[];
};

export type AddressData = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
};

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

export type SellerApplicationData = {
  id: string;
  userId: string;
  storeId: string | null;
  storeName: string;
  storeSlug: string;
  description: string | null;
  supportEmail: string;
  supportPhone: string;
  businessType: string | null;
  categories: string | null;
  status: string;
  rejectionReason: string | null;
  reviewedById: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type PayoutData = {
  id: string;
  storeId: string;
  amount: number;
  status: string;
  method: string;
  reference: string | null;
  note: string | null;
  bankDetails: string;
  requestedAt: string;
  processedAt: string | null;
  processedById: string | null;
};

export type SellerEarningData = {
  id: string;
  orderItemId: string;
  storeId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  releasedAt: string | null;
};

export type StoreReviewData = {
  id: string;
  storeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { name: string; avatar: string | null };
};

export type PlatformSettings = {
  defaultCommissionRate: number;
  requireProductApproval: boolean;
  autoApproveSellers: boolean;
  minPayoutAmount: number;
  escrowReleaseOnDelivery: boolean;
};

export type View =
  | { name: "home" }
  | { name: "catalog"; categoryId?: string; query?: string; flash?: boolean }
  | { name: "product"; productId: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "orders" }
  | { name: "track"; orderId: string }
  | { name: "wishlist" }
  | { name: "admin"; tab?: "overview" | "products" | "orders" | "sellers" | "payouts" | "settings" }
  | { name: "seller"; tab?: "overview" | "products" | "orders" | "payouts" | "settings" }
  | { name: "seller-onboarding" }
  | { name: "store"; storeSlug: string }
  | { name: "payment-callback"; reference: string }
  | { name: "account" };
