"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight, RotateCcw, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrderData } from "@/lib/types";

export function PaymentCallbackView({ reference }: { reference: string }) {
  const navigate = useStore((s) => s.navigate);
  const clearCart = useStore((s) => s.clearCart);
  const addOrderNumber = useStore((s) => s.addOrderNumber);
  const setLastOrder = useStore((s) => s.setLastOrder);
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    let alive = true;
    apiGet<{ verified: boolean; status?: string; order?: OrderData; message?: string; error?: string }>(
      `/api/paystack/verify?reference=${encodeURIComponent(reference)}`
    )
      .then((res) => {
        if (!alive) return;
        if (res.verified && res.order) {
          setStatus("success");
          setOrder(res.order);
          addOrderNumber(res.order.orderNumber);
          setLastOrder(res.order);
          clearCart();
          toast.success("Payment successful!");
        } else {
          setStatus("failed");
          setMessage(res.message || res.error || "Payment verification failed. Please try again.");
        }
      })
      .catch((err) => {
        if (!alive) return;
        setStatus("failed");
        setMessage((err as Error).message || "Could not verify payment. Please contact support.");
      });
    return () => {
      alive = false;
    };
     
  }, [reference]);

  // Verifying state
  if (status === "verifying") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 width={48} height={48} className="mx-auto animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-bold">Confirming your payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <p className="mt-2 text-xs text-muted-foreground">Reference: {reference}</p>
      </div>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <XCircle width={56} height={56} className="mx-auto text-destructive" />
        </motion.div>
        <h1 className="mt-4 text-2xl font-bold">Payment not completed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate({ name: "checkout" })} variant="outline">
            <RotateCcw width={16} height={16} /> Try Again
          </Button>
          <Button onClick={() => navigate({ name: "orders" })} className="brand-gradient text-white">
            View My Orders
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Already paid? Your order is safe. Contact support with reference: <span className="font-mono">{reference}</span>
        </p>
      </div>
    );
  }

  // Success state
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="brand-gradient px-6 py-10 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-white/20 backdrop-blur"
          >
            <CheckCircle2 width={40} height={40} />
          </motion.div>
          <h1 className="text-2xl font-black sm:text-3xl">Payment Successful!</h1>
          <p className="mt-1 text-white/90">Your order has been confirmed and is being processed</p>
          {order && (
            <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
              Order #{order.orderNumber}
            </p>
          )}
        </div>

        {order && (
          <div className="p-6">
            <div className="mb-4 rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-sm font-semibold">Payment confirmed via Paystack</p>
              <p className="text-xs text-muted-foreground">
                Estimated delivery:{" "}
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString("en-NG", { weekday: "short", month: "long", day: "numeric" })
                  : "3-5 business days"}
              </p>
            </div>

            <h3 className="mb-2 text-sm font-bold">Order Summary</h3>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                    <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">Qty: {it.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatNaira(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "FREE" : formatNaira(order.shipping)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(order.discount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total Paid</span><span className="text-primary">{formatNaira(order.total)}</span></div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => navigate({ name: "track", orderId: order.id })} className="flex-1 brand-gradient text-white">
                <Package width={16} height={16} /> Track My Order
              </Button>
              <Button onClick={() => navigate({ name: "home" })} variant="outline" className="flex-1">
                Continue Shopping <ArrowRight width={16} height={16} />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
