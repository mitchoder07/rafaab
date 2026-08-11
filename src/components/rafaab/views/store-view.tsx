"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store as StoreIcon, Star, MapPin, Mail, Phone, Loader2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { StarRating } from "../star-rating";
import type { Product, StoreData, StoreReviewData } from "@/lib/types";

export function StoreView({ storeSlug }: { storeSlug: string }) {
  const navigate = useStore((s) => s.navigate);
  const back = useStore((s) => s.back);
  const [data, setData] = useState<{ store: StoreData; products: Product[]; reviews: StoreReviewData[]; total: number } | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const loading = loadedSlug !== storeSlug;

  useEffect(() => {
    let alive = true;
    apiGet<{ store: StoreData; products: Product[]; reviews: StoreReviewData[]; total: number }>(`/api/stores/${storeSlug}`)
      .then((r) => { if (alive) { setData(r); setLoadedSlug(storeSlug); } })
      .catch(() => { if (alive) { setError(true); setLoadedSlug(storeSlug); } });
    return () => { alive = false; };
  }, [storeSlug]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <StoreIcon width={40} height={40} className="mx-auto text-muted-foreground/40" />
        <p className="mt-3 text-lg font-semibold">Store not found</p>
        <button onClick={() => navigate({ name: "home" })} className="mt-4 text-sm font-semibold text-primary hover:underline">Back to Home</button>
      </div>
    );
  }

  if (!data) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" width={28} height={28} /></div>;
  }

  const { store, products, reviews } = data;

  return (
    <div>
      {/* Store banner */}
      <div className="relative h-40 sm:h-56 brand-gradient overflow-hidden">
        {store.banner && <img src={store.banner} alt="" className="h-full w-full object-cover" />}
        <button onClick={back} className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/30">
          ← Back
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Store info */}
        <div className="-mt-12 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-background bg-muted">
            {store.logo ? <img src={store.logo} alt={store.name} className="h-full w-full object-cover" /> : <StoreIcon width={36} height={36} className="text-muted-foreground" />}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-black sm:text-3xl">{store.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <StarRating rating={store.rating} size={14} showValue />
              <span className="text-muted-foreground">({store.numReviews} reviews)</span>
              {store.supportEmail && <span className="flex items-center gap-1 text-muted-foreground"><Mail width={13} height={13} /> {store.supportEmail}</span>}
            </div>
            {store.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{store.description}</p>}
          </div>
        </div>

        {/* Products */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Products ({products.length})</h2>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">This store has no products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold">Store Reviews</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                      {(r.user?.name || "A").charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.user?.name || "Anonymous"}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
