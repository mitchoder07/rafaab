"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getTrackingProgress } from "../tracking-steps";
import { cn } from "@/lib/utils";
import type { OrderData } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30", icon: Clock },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-100 dark:bg-red-900/30", icon: XCircle },
};

const STEP_LABELS = ["Placed", "Processing", "Shipped", "Out", "Delivered"];

export function OrdersView() {
  const navigate = useStore((s) => s.navigate);
  const user = useStore((s) => s.user);
  const orderNumbers = useStore((s) => s.orderNumbers);
  const lastOrder = useStore((s) => s.lastOrder);
  const [orders, setOrders] = useState<OrderData[] | null>(null);

  useEffect(() => {
    let alive = true;
    const numbersParam = orderNumbers.length ? orderNumbers.join(",") : undefined;
    const qs = numbersParam ? `?numbers=${encodeURIComponent(numbersParam)}` : "";
    apiGet<{ orders: OrderData[] }>(`/api/orders${qs}`)
      .then((res) => {
        if (!alive) return;
        const list = [...res.orders];
        if (lastOrder && !list.some((o) => o.orderNumber === lastOrder.orderNumber)) {
          list.unshift(lastOrder);
        }
        setOrders(list);
      })
      .catch(() => alive && setOrders([]));
    return () => {
      alive = false;
    };
  }, [orderNumbers, lastOrder]);

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6">
      <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">My Orders</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {user ? `Signed in as ${user.email}` : "Showing your recent orders on this device"}
      </p>

      {orders === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" width={32} height={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Package width={40} height={40} className="mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-lg font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground">When you place an order, it'll appear here.</p>
          <Button onClick={() => navigate({ name: "catalog" })} className="mt-4 brand-gradient text-white">
            Start Shopping <ArrowRight width={16} height={16} />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o, i) => {
            const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.confirmed;
            const progress = getTrackingProgress(o.status);
            const eta = o.estimatedDelivery ? new Date(o.estimatedDelivery) : null;
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${sc.color}`}>
                    <sc.icon width={13} height={13} /> {sc.label}
                  </span>
                </div>

                <div className="p-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <button
                          onClick={() => navigate({ name: "product", productId: it.productId })}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted"
                        >
                          <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => navigate({ name: "product", productId: it.productId })}
                            className="line-clamp-1 text-left text-sm font-medium hover:text-primary"
                          >
                            {it.title}
                          </button>
                          <p className="text-xs text-muted-foreground">Qty: {it.quantity} · {formatNaira(it.price)} each</p>
                        </div>
                        <span className="text-sm font-bold">{formatNaira(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini progress bar */}
                  {o.status !== "cancelled" && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Shipment Progress</span>
                        {eta && o.status !== "delivered" && (
                          <span className="text-xs font-medium text-foreground">
                            ETA: {eta.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center justify-between">
                        {STEP_LABELS.map((label, idx) => {
                          const reached = progress >= 0 && idx <= progress;
                          const isCurrent = progress === idx;
                          return (
                            <div key={label} className="flex flex-1 flex-col items-center relative">
                              {idx < STEP_LABELS.length - 1 && (
                                <div className="absolute top-[7px] left-1/2 w-full h-0.5 bg-border">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: reached && idx < progress ? "100%" : "0%" }}
                                  />
                                </div>
                              )}
                              <span
                                className={cn(
                                  "relative z-10 grid h-3.5 w-3.5 place-items-center rounded-full border-2 transition",
                                  reached ? "border-primary bg-primary" : "border-border bg-background",
                                  isCurrent && "ring-4 ring-primary/20"
                                )}
                              />
                              <span
                                className={cn(
                                  "mt-1 text-[10px] font-medium",
                                  reached ? "text-foreground" : "text-muted-foreground/60"
                                )}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-bold text-primary">{formatNaira(o.total)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({o.paymentMethod === "cod" ? "Cash on Delivery" : o.paymentMethod === "card" ? "Card" : "Transfer"})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate({ name: "product", productId: o.items[0].productId })}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                      >
                        Buy again
                      </button>
                      <Button
                        onClick={() => navigate({ name: "track", orderId: o.id })}
                        size="sm"
                        className="h-8 gap-1 brand-gradient text-white hover:opacity-90"
                      >
                        <MapPin width={13} height={13} /> Track Order <ChevronRight width={13} height={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
