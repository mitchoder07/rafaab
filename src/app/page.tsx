"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthModal } from "@/components/auth-modal";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { HomeView } from "@/components/views/home-view";
import { CatalogView } from "@/components/views/catalog-view";
import { ProductView } from "@/components/views/product-view";
import { CheckoutView } from "@/components/views/checkout-view";
import { OrdersView } from "@/components/views/orders-view";
import { TrackView } from "@/components/views/track-view";
import { WishlistView } from "@/components/views/wishlist-view";
import { AdminView } from "@/components/views/admin-view";
import { SellerDashboardView } from "@/components/views/seller-dashboard-view";
import { SellerOnboardingView } from "@/components/views/seller-onboarding-view";
import { StoreView } from "@/components/views/store-view";
import { PaymentCallbackView } from "@/components/views/payment-callback-view";
import type { Category } from "@/lib/types";

export default function Home() {
  const view = useStore((s) => s.view);
  const setUser = useStore((s) => s.setUser);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    apiGet<{ categories: Category[] }>("/api/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Restore session on mount
  useEffect(() => {
    apiGet<{ user: { id: string; name: string; email: string; avatar: string | null; phone: string | null; role?: string } | null }>("/api/auth/me")
      .then((r) => {
        if (r.user) setUser(r.user);
      })
      .catch(() => {});
  }, [setUser]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header categories={categories} />

      <main className="flex-1">
        {view.name === "home" && <HomeView categories={categories} />}
        {view.name === "catalog" && (
          <CatalogView view={view} categories={categories} />
        )}
        {view.name === "product" && <ProductView productId={view.productId} />}
        {view.name === "checkout" && <CheckoutView />}
        {view.name === "orders" && <OrdersView />}
        {view.name === "track" && <TrackView orderId={view.orderId} />}
        {view.name === "wishlist" && <WishlistView />}
        {view.name === "admin" && <AdminView initialTab={view.tab} />}
        {view.name === "seller" && <SellerDashboardView initialTab={view.tab} />}
        {view.name === "seller-onboarding" && <SellerOnboardingView />}
        {view.name === "store" && <StoreView storeSlug={view.storeSlug} />}
        {view.name === "payment-callback" && <PaymentCallbackView reference={view.reference} />}
      </main>

      <Footer />

      {/* overlays */}
      <CartDrawer />
      <AuthModal />
      <AIChatWidget />

      {/* keep categoriesLoading referenced to avoid unused warning */}
      <span className="sr-only">{categoriesLoading ? "loading" : "ready"}</span>
    </div>
  );
}
