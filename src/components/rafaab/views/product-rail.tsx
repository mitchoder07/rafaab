"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductRail({
  title,
  endpoint,
  accent,
  seeAllView,
}: {
  title: string;
  endpoint: string;
  accent?: string;
  seeAllView?: () => void;
}) {
  const navigate = useStore((s) => s.navigate);
  const cacheProduct = useStore((s) => s.cacheProduct);
  const [products, setProducts] = useState<Product[] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    apiGet<{ products: Product[] }>(endpoint)
      .then((res) => {
        if (!alive) return;
        setProducts(res.products);
        res.products.forEach(cacheProduct);
      })
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
     
  }, [endpoint]);

  const scrollBy = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-extrabold sm:text-2xl">
          {accent && <span className="h-6 w-1.5 rounded-full" style={{ background: accent }} />}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {seeAllView && (
            <button onClick={seeAllView} className="text-sm font-semibold text-primary hover:underline">
              See all
            </button>
          )}
          <div className="hidden gap-1 sm:flex">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted"
            >
              <ChevronLeft width={18} height={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted"
            >
              <ChevronRight width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:gap-4"
      >
        {products === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-52">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p, i) => (
              <div key={p.id} className="w-40 shrink-0 sm:w-52">
                <ProductCard product={p} index={i} />
              </div>
            ))}
      </div>
    </section>
  );
}
