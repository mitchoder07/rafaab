"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Zap, Sparkles, TrendingUp, Gift } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { formatNaira, isFlashActive } from "@/lib/format";
import { Countdown } from "../countdown";
import { getCategoryIcon } from "../category-icons";
import { ProductRail } from "./product-rail";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import type { Category, Product } from "@/lib/types";

export function HomeView({ categories }: { categories: Category[] }) {
  const navigate = useStore((s) => s.navigate);
  const cacheProduct = useStore((s) => s.cacheProduct);
  const [hero, setHero] = useState<string[]>([]);
  const [flashProducts, setFlashProducts] = useState<Product[] | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    apiGet<{ hero: string[] }>("/api/hero").then((r) => setHero(r.hero || [])).catch(() => {});
    apiGet<{ products: Product[] }>("/api/products?flash=1&limit=8")
      .then((r) => {
        setFlashProducts(r.products);
        r.products.forEach(cacheProduct);
      })
      .catch(() => setFlashProducts([]));
  }, [cacheProduct]);

  useEffect(() => {
    if (hero.length <= 1) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % hero.length), 5000);
    return () => clearInterval(id);
  }, [hero.length]);

  // Touch swipe handlers for hero carousel
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || hero.length <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        setHeroIdx((i) => (i + 1) % hero.length);
      } else {
        setHeroIdx((i) => (i - 1 + hero.length) % hero.length);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="space-y-6 pb-4 pt-3 sm:space-y-10 sm:pb-4 sm:pt-4">
      {/* Hero + categories sidebar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
          {/* category sidebar (desktop) */}
          <aside className="hidden rounded-2xl border border-border bg-card p-2 lg:block">
            <h3 className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Shop by Category
            </h3>
            <div className="space-y-0.5">
              {categories.map((c) => {
                const Icon = getCategoryIcon(c.icon);
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate({ name: "catalog", categoryId: c.id })}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-muted"
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg"
                      style={{ background: `${c.color}1a`, color: c.color || undefined }}
                    >
                      <Icon width={15} height={15} />
                    </span>
                    <span className="flex-1 text-left font-medium">{c.name}</span>
                    <ChevronRight width={15} height={15} className="text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* hero carousel */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            {hero.length > 0 ? (
              <div
                className="relative aspect-[5/6] sm:aspect-[16/9] lg:aspect-[21/9] touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {hero.map((src, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i === heroIdx ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                  >
                    <img src={src} alt="Rafaab sale banner" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  </motion.div>
                ))}
                <div className="absolute inset-0 flex flex-col justify-center p-6 text-white sm:p-10">
                  <motion.div
                    key={heroIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                      <Sparkles width={13} height={13} /> Welcome to Rafaab
                    </span>
                    <h1 className="mt-3 max-w-md text-3xl font-black leading-tight sm:text-5xl">
                      Shop Smarter,<br />Live Better
                    </h1>
                    <p className="mt-2 max-w-sm text-sm text-white/90 sm:text-base">
                      Premium products, AI-powered shopping, flash deals and fast delivery — all in one place.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate({ name: "catalog", flash: true })}
                        className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition hover:scale-105"
                      >
                        <Zap width={16} height={16} className="fill-neutral-900" /> Shop Flash Sale
                      </button>
                      <button
                        onClick={() => navigate({ name: "catalog" })}
                        className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        Browse All
                      </button>
                    </div>
                  </motion.div>
                </div>
                {hero.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {hero.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIdx(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="shimmer aspect-[16/9] sm:aspect-[21/9]" />
            )}
          </div>
        </div>

        {/* category chips (mobile) */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <button
                key={c.id}
                onClick={() => navigate({ name: "catalog", categoryId: c.id })}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-primary"
              >
                <Icon width={13} height={13} style={{ color: c.color || undefined }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Category grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categories.map((c, i) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate({ name: "catalog", categoryId: c.id })}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition hover:shadow-lg card-lift"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{ background: `${c.color}1a`, color: c.color || undefined }}
                  >
                    <Icon width={22} height={22} />
                  </span>
                  <ChevronRight width={18} height={18} className="text-muted-foreground transition group-hover:translate-x-1" />
                </div>
                <p className="mt-3 text-sm font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">Shop now</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Flash Sale strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 deal-gradient px-4 py-3 text-white sm:px-5">
            <div className="flex items-center gap-2">
              <Zap width={22} height={22} className="fill-white" />
              <h2 className="text-xl font-black sm:text-2xl">Flash Sale</h2>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">LIVE</span>
            </div>
            {flashProducts && flashProducts[0]?.flashSaleEndsAt && (
              <Countdown endsAt={flashProducts[0].flashSaleEndsAt} variant="light" />
            )}
          </div>
          <div className="bg-card p-3 sm:p-4">
            {flashProducts === null ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : flashProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No active flash sales right now.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {flashProducts.slice(0, 8).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
            <div className="mt-3 text-center">
              <button
                onClick={() => navigate({ name: "catalog", flash: true })}
                className="inline-flex items-center gap-1.5 rounded-full deal-gradient px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                View All Flash Deals <ChevronRight width={15} height={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value props strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: TrendingUp, title: "Best Prices", sub: "Unbeatable deals daily" },
            { icon: Zap, title: "Fast Delivery", sub: "1-3 days nationwide" },
            { icon: Gift, title: "Daily Rewards", sub: "Earn with every order" },
            { icon: Sparkles, title: "AI Assistant", sub: "Rafi helps you choose" },
          ].map((v) => (
            <div key={v.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <v.icon width={20} height={20} />
              </span>
              <div>
                <p className="text-sm font-bold">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product rails */}
      <ProductRail
        title="Best Sellers"
        accent="var(--primary)"
        endpoint="/api/products?best=1&limit=12"
        seeAllView={() => navigate({ name: "catalog" })}
      />
      <ProductRail
        title="New Arrivals"
        accent="oklch(0.7 0.18 85)"
        endpoint="/api/products?new=1&limit=12"
        seeAllView={() => navigate({ name: "catalog" })}
      />
      <ProductRail
        title="Featured Picks"
        accent="oklch(0.62 0.24 145)"
        endpoint="/api/products?featured=1&limit=12"
        seeAllView={() => navigate({ name: "catalog" })}
      />

      {/* Recommended for you */}
      <ProductRail
        title="Recommended For You"
        accent="oklch(0.6 0.2 280)"
        endpoint="/api/recommendations"
        seeAllView={() => navigate({ name: "catalog" })}
      />

      {/* Big promo banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl brand-gradient p-5 text-white sm:p-8 lg:p-10">
          <div className="relative z-10 max-w-md sm:max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur sm:text-xs">
              <Gift width={13} height={13} /> First Order Offer
            </span>
            <h3 className="mt-3 text-xl font-black leading-tight sm:text-3xl lg:text-4xl">Get 10% off your first order</h3>
            <p className="mt-2 text-xs text-white/90 sm:text-sm">
              Use code <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold">RAFAAB10</span> at checkout. Plus free delivery on orders over {formatNaira(50000)}.
            </p>
            <button
              onClick={() => navigate({ name: "catalog" })}
              className="mt-4 rounded-full bg-white px-5 py-2 text-xs font-bold text-neutral-900 transition hover:scale-105 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              Start Shopping
            </button>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl sm:h-48 sm:w-48" />
          <div className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl sm:right-20 sm:h-40 sm:w-40" />
        </div>
      </section>
    </div>
  );
}
