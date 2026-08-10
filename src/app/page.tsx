"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { Header } from "@/components/rafaab/header";
import { Footer } from "@/components/rafaab/footer";
import { CartDrawer } from "@/components/rafaab/cart-drawer";
import { AuthModal } from "@/components/rafaab/auth-modal";
import { AIChatWidget } from "@/components/rafaab/ai-chat-widget";
import { HomeView } from "@/components/rafaab/views/home-view";
import { CatalogView } from "@/components/rafaab/views/catalog-view";
import { ProductView } from "@/components/rafaab/views/product-view";
import { CheckoutView } from "@/components/rafaab/views/checkout-view";
import { OrdersView } from "@/components/rafaab/views/orders-view";
import { TrackView } from "@/components/rafaab/views/track-view";
import { WishlistView } from "@/components/rafaab/views/wishlist-view";
import { AdminView } from "@/components/rafaab/views/admin-view";
import { PaymentCallbackView } from "@/components/rafaab/views/payment-callback-view";
import type { Category } from "@/lib/types";

export default function Home() {
  const view = useStore((s) => s.view);
  const navigate = useStore((s) => s.navigate);
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

  // Detect Paystack payment callback (?reference=xxx in the URL)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      // Clean the URL so a refresh doesn't re-trigger verification
      window.history.replaceState({}, "", "/");
      navigate({ name: "payment-callback", reference });
    }
  }, [navigate]);

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
