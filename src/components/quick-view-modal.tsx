"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { formatNaira, formatNumber } from "@/lib/format";
import { StarRating } from "./star-rating";
import { Heart, ShoppingCart, Truck, Zap, Check, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Product, Review } from "@/lib/types";

export function QuickViewModal() {
  const quickViewProductId = useStore((s) => s.quickViewProductId);
  const setQuickViewProductId = useStore((s) => s.setQuickViewProductId);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => (quickViewProductId ? s.wishlist.includes(quickViewProductId) : false));
  const navigate = useStore((s) => s.navigate);

  const [data, setData] = useState<{ product: Product; reviews: Review[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!quickViewProductId) {
      queueMicrotask(() => setData(null));
      return;
    }
    let alive = true;
    queueMicrotask(() => setLoading(true));
    apiGet<{ product: Product; reviews: Review[] }>(`/api/products/${quickViewProductId}`)
      .then((res) => {
        if (!alive) return;
        setData(res);
        setActiveImg(0);
        setQty(1);
      })
      .catch(() => {
        if (alive) toast.error("Failed to load product details");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [quickViewProductId]);

  if (!quickViewProductId) return null;

  const product = data?.product;
  const price = product ? product.discountPrice ?? product.price : 0;
  const off = product?.discountPercent || 0;
  const freeShipping = price >= 50000;

  return (
    <Dialog open={!!quickViewProductId} onOpenChange={(open) => !open && setQuickViewProductId(null)}>
      <DialogContent className="max-w-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight sm:text-2xl">
            {product ? product.title : "Product Quick View"}
          </DialogTitle>
          <DialogDescription className="sr-only">Quick view product inspection and checkout</DialogDescription>
        </DialogHeader>

        {loading || !product ? (
          <div className="flex h-72 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Gallery */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <img
                  src={product.images[activeImg] || product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
                {off > 0 && (
                  <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow">
                    -{off}% OFF
                  </span>
                )}
                <button
                  onClick={() => {
                    toggleWishlist(product.id);
                    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
                  }}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:scale-110"
                >
                  <Heart
                    width={18}
                    height={18}
                    className={isWishlisted ? "fill-primary text-primary" : "text-foreground/70"}
                  />
                </button>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeImg === idx ? "border-primary shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{product.brand}</span>
                <span className="text-xs text-muted-foreground">{formatNumber(product.soldCount)} sold</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <StarRating rating={product.rating} size={15} showValue />
                <span className="text-xs font-medium text-muted-foreground">({product.numReviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{formatNaira(price)}</span>
                {product.discountPrice && (
                  <span className="text-sm font-medium text-muted-foreground line-through">
                    {formatNaira(product.price)}
                  </span>
                )}
              </div>

              {/* Free shipping & delivery badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                {freeShipping ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Truck width={14} height={14} /> FREE Express Shipping
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Truck width={14} height={14} /> Ships in 24 hours
                  </span>
                )}
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check width={14} height={14} /> In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    Sold out
                  </span>
                )}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              {/* Actions */}
              <div className="mt-auto pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
                      disabled={qty <= 1}
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                      className="px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
                      disabled={qty >= product.stock}
                    >
                      +
                    </button>
                  </div>

                  <Button
                    onClick={() => {
                      if (product.stock === 0) {
                        toast.error("This item is sold out");
                        return;
                      }
                      addToCart(product, qty);
                      toast.success(`Added ${qty} × "${product.title}" to cart`);
                      setQuickViewProductId(null);
                    }}
                    disabled={product.stock === 0}
                    className="flex-1 font-bold shadow-md"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuickViewProductId(null);
                      navigate({ name: "product", productId: product.id });
                    }}
                    className="flex-1 text-xs font-semibold"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View Full Specs & Reviews
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
