"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  Check,
  Star,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { formatNaira, formatNumber } from "@/lib/format";
import { StarRating } from "../star-rating";
import { Countdown } from "../countdown";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { toast } from "sonner";
import type { Product, Review } from "@/lib/types";

export function ProductView({ productId }: { productId: string }) {
  const navigate = useStore((s) => s.navigate);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(productId));
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const user = useStore((s) => s.user);
  const setAuthOpen = useStore((s) => s.setAuthOpen);

  const [data, setData] = useState<{
    product: Product;
    reviews: Review[];
    related: Product[];
    inWishlist: boolean;
  } | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setActiveImg(0);
    setQty(1);
    apiGet<{ product: Product; reviews: Review[]; related: Product[]; inWishlist: boolean }>(
      `/api/products/${productId}`
    )
      .then((res) => {
        if (!alive) return;
        setData(res);
        addRecentlyViewed(res.product.id);
      })
      .catch(() => {
        if (alive) toast.error("Product not found");
      });
    return () => {
      alive = false;
    };
     
  }, [productId]);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="aspect-square shimmer rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 w-24 shimmer rounded" />
            <div className="h-8 w-3/4 shimmer rounded" />
            <div className="h-6 w-1/3 shimmer rounded" />
            <div className="h-24 w-full shimmer rounded" />
            <div className="h-12 w-full shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  const { product, reviews, related } = data;
  const price = product.discountPrice ?? product.price;
  const off = product.discountPercent || 0;
  const flash = product.isFlashSale && product.flashSaleEndsAt;
  const wished = isWishlisted || data.inWishlist;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true, "login");
      toast.info("Please sign in to leave a review");
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ review: Review }>("/api/reviews", {
        productId,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setData({ ...data, reviews: [res.review, ...reviews] });
      setNewReview({ rating: 5, comment: "" });
      toast.success("Review posted!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      {/* breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => navigate({ name: "home" })} className="hover:text-primary">Home</button>
        <ChevronRight width={14} height={14} />
        {product.category && (
          <>
            <button
              onClick={() => navigate({ name: "catalog", categoryId: product.category!.id })}
              className="hover:text-primary"
            >
              {product.category.name}
            </button>
            <ChevronRight width={14} height={14} />
          </>
        )}
        <span className="line-clamp-1 text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_320px]">
        {/* gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            <motion.img
              key={activeImg}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              src={product.images[activeImg]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
            {off > 0 && (
              <span className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground shadow">
                -{off}%
              </span>
            )}
            {flash && (
              <div className="absolute right-3 top-3">
                <Countdown endsAt={product.flashSaleEndsAt!} variant="dark" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === activeImg ? "border-primary" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{product.brand}</span>
              <button
                onClick={() => {
                  toggleWishlist(product.id);
                  toast(wished ? "Removed from wishlist" : "Added to wishlist");
                }}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
              >
                <Heart width={14} height={14} className={wished ? "fill-primary text-primary" : ""} />
                {wished ? "Saved" : "Save"}
              </button>
            </div>
            <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StarRating rating={product.rating} size={16} showValue />
              <span className="text-sm text-muted-foreground">{product.numReviews} reviews</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{formatNumber(product.soldCount)} sold</span>
            </div>
          </div>

          {/* price */}
          <div className="rounded-2xl bg-muted/50 p-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-primary">{formatNaira(price)}</span>
              {product.discountPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatNaira(product.price)}</span>
              )}
              {off > 0 && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  You save {formatNaira(product.price - product.discountPrice)}
                </span>
              )}
            </div>
            {flash && (
              <div className="mt-2 flex items-center gap-2 rounded-lg deal-gradient px-3 py-2 text-white">
                <Zap width={15} height={15} className="fill-white" />
                <span className="text-xs font-bold">Flash sale ends in</span>
                <Countdown endsAt={product.flashSaleEndsAt!} variant="light" />
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Inclusive of all taxes. Free shipping on orders over {formatNaira(50000)}.
            </p>
          </div>

          {/* stock */}
          <div className="flex items-center gap-2 text-sm">
            {product.stock > 0 ? (
              <>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  <Check width={13} height={13} />
                </span>
                <span className="font-medium text-green-700 dark:text-green-400">In stock</span>
                {product.stock <= 10 && (
                  <span className="text-destructive">· Only {product.stock} left!</span>
                )}
              </>
            ) : (
              <span className="font-medium text-destructive">Out of stock</span>
            )}
          </div>

          {/* description */}
          <div>
            <h3 className="mb-1.5 text-sm font-bold">Description</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          {/* specs */}
          {product.specs.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-bold">Specifications</h3>
              <div className="overflow-hidden rounded-xl border border-border">
                {product.specs.map((s, i) => (
                  <div key={i} className={`flex gap-3 px-3 py-2 text-sm ${i % 2 === 0 ? "bg-muted/40" : ""}`}>
                    <span className="w-1/3 font-medium text-muted-foreground">{s.name}</span>
                    <span className="flex-1">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* qty + add to cart (mobile, shown here; desktop shows in sticky column) */}
          <div className="space-y-3 lg:hidden">
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center rounded-lg border border-border">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground">
                    <Minus width={15} height={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground">
                    <Plus width={15} height={15} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  addToCart(product, qty);
                  toast.success("Added to cart");
                }}
                disabled={product.stock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
              >
                <ShoppingCart width={17} height={17} /> Add to Cart
              </button>
              <button
                onClick={() => {
                  if (product.stock === 0) return;
                  addToCart(product, qty);
                  navigate({ name: "checkout" });
                }}
                disabled={product.stock === 0}
                className="flex-1 rounded-xl brand-gradient py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* trust */}
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
            {[
              { icon: Truck, label: "Fast Delivery" },
              { icon: Shield, label: "Secure Payment" },
              { icon: RotateCcw, label: "7-Day Returns" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1 text-center">
                <t.icon width={20} height={20} className="text-primary" />
                <span className="text-[11px] font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* sticky buy box (desktop) */}
        <div className="hidden xl:block">
          <div className="sticky top-32 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="text-2xl font-black text-primary">{formatNaira(price)}</div>
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Qty</span>
                <div className="flex items-center rounded-lg border border-border">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground">
                    <Minus width={14} height={14} />
                  </button>
                  <span className="w-9 text-center text-sm font-bold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground">
                    <Plus width={14} height={14} />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                addToCart(product, qty);
                toast.success("Added to cart");
              }}
              disabled={product.stock === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
            >
              <ShoppingCart width={16} height={16} /> Add to Cart
            </button>
            <button
              onClick={() => {
                if (product.stock === 0) return;
                addToCart(product, qty);
                navigate({ name: "checkout" });
              }}
              disabled={product.stock === 0}
              className="w-full rounded-xl brand-gradient py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Buy Now
            </button>
            <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Truck width={14} height={14} /> Ships in 1-2 business days</div>
              <div className="flex items-center gap-2"><RotateCcw width={14} height={14} /> 7-day easy returns</div>
              <div className="flex items-center gap-2"><Shield width={14} height={14} /> Rafaab Buyer Protection</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="mb-3 text-lg font-bold">Customer Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No reviews yet. Be the first to share your experience!
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                        {(r.user?.name || "A").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{r.user?.name || "Anonymous"}</p>
                        <div className="flex items-center gap-1">
                          <StarRating rating={r.rating} size={12} />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* write review */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-base font-bold">Write a Review</h3>
              <form onSubmit={submitReview} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewReview((v) => ({ ...v, rating: n }))}
                        aria-label={`${n} stars`}
                      >
                        <Star
                          width={24}
                          height={24}
                          className={n <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 fill-muted-foreground/20"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview((v) => ({ ...v, comment: e.target.value }))}
                    rows={4}
                    placeholder="Share your experience with this product..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg brand-gradient py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
