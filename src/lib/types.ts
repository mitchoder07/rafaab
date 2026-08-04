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

export type View =
  | { name: "home" }
  | { name: "catalog"; categoryId?: string; query?: string; flash?: boolean }
  | { name: "product"; productId: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "orders" }
  | { name: "track"; orderId: string }
  | { name: "wishlist" }
  | { name: "admin"; tab?: "overview" | "products" | "orders" }
  | { name: "account" };
