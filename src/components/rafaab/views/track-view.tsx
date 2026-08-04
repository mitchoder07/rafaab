"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Package,
  Clock,
  Copy,
  CheckCircle2,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { TrackingTimeline } from "../tracking-timeline";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrderData } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  processing: { label: "Processing", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
  out_for_delivery: { label: "Out for Delivery", color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30" },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
};

export function TrackView({ orderId }: { orderId: string }) {
  const navigate = useStore((s) => s.navigate);
  const back = useStore((s) => s.back);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const loading = loadedId !== orderId;

  useEffect(() => {
    let alive = true;
    apiGet<{ order: OrderData }>(`/api/orders/${orderId}`)
      .then((res) => {
        if (!alive) return;
        setOrder(res.order);
        setLoadedId(orderId);
      })
      .catch(() => {
        if (!alive) return;
        toast.error("Order not found");
        setLoadedId(orderId);
      });
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-6 w-40 shimmer rounded mb-4" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Order not found</p>
        <Button onClick={() => navigate({ name: "orders" })} className="mt-4 brand-gradient text-white">
          Back to Orders
        </Button>
      </div>
    );
  }

  const sc = STATUS_BADGE[order.status] || STATUS_BADGE.confirmed;
  const eta = order.estimatedDelivery ? new Date(order.estimatedDelivery) : null;
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  const copyTracking = () => {
    navigator.clipboard?.writeText(order.orderNumber);
    setCopied(true);
    toast.success("Tracking number copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 sm:px-6">
      <button onClick={back} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft width={16} height={16} /> Back
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="brand-gradient px-5 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/80">Tracking Number</p>
              <button
                onClick={copyTracking}
                className="mt-0.5 flex items-center gap-1.5 text-lg font-bold hover:underline"
              >
                {order.orderNumber}
                {copied ? <CheckCircle2 width={15} height={15} /> : <Copy width={14} height={14} />}
              </button>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur`}>
              {sc.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/85">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* ETA banner */}
        {!isCancelled && (
          <div className={`flex items-center gap-3 px-5 py-4 ${isDelivered ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${isDelivered ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}>
              {isDelivered ? <CheckCircle2 width={22} height={22} /> : <Truck width={22} height={22} />}
            </span>
            <div>
              {isDelivered ? (
                <>
                  <p className="text-sm font-bold">Delivered successfully</p>
                  <p className="text-xs text-muted-foreground">
                    On {order.trackingEvents?.find((e) => e.status === "delivered") ? new Date(order.trackingEvents.find((e) => e.status === "delivered")!.createdAt).toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" }) : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">
                    {eta
                      ? `Estimated delivery: ${eta.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}`
                      : "In transit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.carrier || "Rafaab Express"} · {sc.label}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_320px]">
        {/* Tracking timeline */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
            <Package width={18} height={18} className="text-primary" /> Shipment Progress
          </h2>
          <TrackingTimeline status={order.status} events={order.trackingEvents} />

          {/* Carrier info */}
          <div className="mt-5 rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Truck width={14} height={14} /> Carrier
              </span>
              <span className="font-semibold">{order.carrier || "Rafaab Express"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock width={14} height={14} /> Service
              </span>
              <span className="font-semibold">Standard Delivery (3-5 days)</span>
            </div>
          </div>
        </div>

        {/* Side: items + shipping */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-bold">Items in Order ({order.items.length})</h3>
            <div className="space-y-2">
              {order.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => navigate({ name: "product", productId: it.productId })}
                  className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-muted"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">Qty: {it.quantity}</p>
                  </div>
                  <ChevronRight width={14} height={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "FREE" : formatNaira(order.shipping)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(order.discount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-1 font-bold"><span>Total</span><span className="text-primary">{formatNaira(order.total)}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
              <MapPin width={15} height={15} className="text-primary" /> Delivery Address
            </h3>
            <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.street}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.country}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone width={13} height={13} /> {order.shippingAddress.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
