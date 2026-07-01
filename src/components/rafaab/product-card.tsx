"use client";

import { Heart, ShoppingCart, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { formatNaira, formatNumber, isFlashActive } from "@/lib/format";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const navigate = useStore((s) => s.navigate);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(product.id));

  const price = product.discountPrice ?? product.price;
  const off = product.discountPercent || 0;
  const flash = isFlashActive(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="card-lift group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-xl"
    >
      {/* image */}
      <button
        onClick={() => navigate({ name: "product", productId: product.id })}
        className="relative block aspect-square overflow-hidden bg-muted"
        aria-label={product.title}
      >
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
              -{off}%
            </span>
          )}
          {flash && (
            <span className="flex items-center gap-0.5 rounded-md deal-gradient px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
              <Zap width={10} height={10} className="fill-white" /> FLASH
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow">
              NEW
            </span>
          )}
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-bold text-white">
              Sold out
            </span>
          </div>
        )}
      </button>

      {/* wishlist */}
      <button
        onClick={() => {
          toggleWishlist(product.id);
          toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
        }}
        aria-label="Toggle wishlist"
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:scale-110 hover:bg-background"
      >
        <Heart
          width={16}
          height={16}
          className={cn("transition", isWishlisted ? "fill-primary text-primary" : "text-foreground/70")}
        />
      </button>

      {/* body */}
      <div className="flex flex-1 flex-col p-2.5">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-medium text-muted-foreground">{product.brand}</span>
          <span className="text-[10px] text-muted-foreground">{formatNumber(product.soldCount)} sold</span>
        </div>
        <button
          onClick={() => navigate({ name: "product", productId: product.id })}
          className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground hover:text-primary"
        >
          {product.title}
        </button>

        <div className="mt-1.5 flex items-center gap-1">
          <StarRating rating={product.rating} size={12} showValue />
          <span className="text-[10px] text-muted-foreground">({product.numReviews})</span>
        </div>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-foreground">{formatNaira(price)}</span>
            {product.discountPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatNaira(product.price)}</span>
            )}
          </div>

          <button
            onClick={() => {
              if (product.stock === 0) {
                toast.error("This item is sold out");
                return;
              }
              addToCart(product, 1);
              toast.success("Added to cart");
            }}
            disabled={product.stock === 0}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart width={13} height={13} />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-square shimmer" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-1/3 shimmer rounded" />
        <div className="h-4 w-full shimmer rounded" />
        <div className="h-4 w-2/3 shimmer rounded" />
        <div className="h-5 w-1/2 shimmer rounded" />
        <div className="h-7 w-full shimmer rounded-lg" />
      </div>
    </div>
  );
}
