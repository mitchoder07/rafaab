"use client";

import { useEffect, useState } from "react";
import { Heart, ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { ProductCard } from "../product-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export function WishlistView() {
  const navigate = useStore((s) => s.navigate);
  const wishlist = useStore((s) => s.wishlist);
  const wishlistKey = wishlist.join(",");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = wishlist.length > 0 && loadedKey !== wishlistKey;

  useEffect(() => {
    if (wishlist.length === 0) return;
    let alive = true;
    Promise.all(
      wishlist.map((id) =>
        apiGet<{ product: Product }>(`/api/products/${id}`)
          .then((r) => r.product)
          .catch(() => null)
      )
    ).then((arr) => {
      if (!alive) return;
      setProducts(arr.filter(Boolean) as Product[]);
      setLoadedKey(wishlistKey);
    });
    return () => {
      alive = false;
    };
  }, [wishlistKey]);

  const effectiveProducts = wishlist.length === 0 ? [] : products;

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Heart className="fill-primary text-primary" width={26} height={26} />
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">My Wishlist</h1>
          <p className="text-sm text-muted-foreground">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" width={32} height={32} />
        </div>
      ) : effectiveProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Heart width={40} height={40} className="mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-lg font-semibold">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground">Tap the heart on any product to save it for later.</p>
          <Button onClick={() => navigate({ name: "catalog" })} className="mt-4 brand-gradient text-white">
            Discover Products <ArrowRight width={16} height={16} />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {effectiveProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
