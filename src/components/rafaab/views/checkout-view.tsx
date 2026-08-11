"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CreditCard, Truck, Banknote, Loader2, PartyPopper, Tag, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AddressData, OrderData } from "@/lib/types";

export function CheckoutView() {
  const navigate = useStore((s) => s.navigate);
  const back = useStore((s) => s.back);
  const cart = useStore((s) => s.cart);
  const subtotal = useStore((s) => s.cartSubtotal());
  const clearCart = useStore((s) => s.clearCart);
  const user = useStore((s) => s.user);
  const savedAddress = useStore((s) => s.savedAddress);
  const setSavedAddress = useStore((s) => s.setSavedAddress);
  const addOrderNumber = useStore((s) => s.addOrderNumber);
  const setLastOrder = useStore((s) => s.setLastOrder);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<AddressData>(
    savedAddress || {
      fullName: user?.name || "",
      phone: user?.phone || "",
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
    }
  );
  const [email, setEmail] = useState(user?.email || "");
  const [payment, setPayment] = useState<"card" | "transfer" | "cod">("card");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderData | null>(null);

  const shipping = subtotal >= 50000 ? 0 : 2500;
  const discount = appliedCoupon === "RAFAAB10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  if (cart.length === 0 && !placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Button onClick={() => navigate({ name: "catalog" })} className="mt-4 brand-gradient text-white">
          Continue Shopping
        </Button>
      </div>
    );
  }

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "RAFAAB10") {
      setAppliedCoupon("RAFAAB10");
      toast.success("Coupon applied! 10% off");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      const cartItems = cart.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
      const commonPayload = {
        items: cartItems,
        shippingAddress: address,
        email,
        name: address.fullName,
        coupon: appliedCoupon || undefined,
      };

      if (payment === "card") {
        // Card → Paystack redirect flow
        try {
          const res = await apiPost<{ authorization_url: string; reference: string; order: OrderData }>(
            "/api/paystack/initialize",
            commonPayload
          );
          addOrderNumber(res.order.orderNumber);
          setSavedAddress(address);
          // Redirect to Paystack's secure checkout page
          window.location.href = res.authorization_url;
          return;
        } catch (payErr) {
          // Paystack not configured (503) → fall back to demo mode for testing
          const errMsg = (payErr as Error).message;
          if (errMsg.includes("not configured")) {
            const res = await apiPost<{ order: OrderData }>("/api/orders", {
              ...commonPayload,
              paymentMethod: "card",
            });
            setPlacedOrder(res.order);
            addOrderNumber(res.order.orderNumber);
            setLastOrder(res.order);
            setSavedAddress(address);
            clearCart();
            setStep(3);
            toast.success("Order placed! (Demo mode — add Paystack keys for live payments)");
            window.scrollTo({ top: 0 });
            return;
          }
          throw payErr;
        }
      }

      // COD or Bank Transfer → create order directly
      const res = await apiPost<{ order: OrderData }>("/api/orders", {
        ...commonPayload,
        paymentMethod: payment,
      });
      setPlacedOrder(res.order);
      addOrderNumber(res.order.orderNumber);
      setLastOrder(res.order);
      setSavedAddress(address);
      clearCart();
      setStep(3);
      toast.success("Order placed successfully!");
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error((err as Error).message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Order confirmation
  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
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
              <Check width={40} height={40} />
            </motion.div>
            <h1 className="text-2xl font-black sm:text-3xl">Order Confirmed!</h1>
            <p className="mt-1 text-white/90">Thank you for shopping with Rafaab</p>
            <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
              Order #{placedOrder.orderNumber}
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4 rounded-xl bg-muted/50 p-4 text-center">
              <PartyPopper width={28} height={28} className="mx-auto text-primary" />
              <p className="mt-2 text-sm font-semibold">🎉 You saved {formatNaira(placedOrder.discount + (placedOrder.subtotal - placedOrder.subtotal))} on this order!</p>
              <p className="text-xs text-muted-foreground">A confirmation has been sent to {email}</p>
            </div>

            <h3 className="mb-2 text-sm font-bold">Order Summary</h3>
            <div className="space-y-2">
              {placedOrder.items.map((it) => (
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
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(placedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{placedOrder.shipping === 0 ? "FREE" : formatNaira(placedOrder.shipping)}</span></div>
              {placedOrder.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(placedOrder.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total Paid</span><span className="text-primary">{formatNaira(placedOrder.total)}</span></div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => navigate({ name: "track", orderId: placedOrder.id })} className="flex-1 brand-gradient text-white">
                <Truck width={16} height={16} /> Track My Order
              </Button>
              <Button onClick={() => navigate({ name: "home" })} variant="outline" className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
      <button onClick={back} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft width={16} height={16} /> Back
      </button>

      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">Checkout</h1>

      {/* steps indicator */}
      <div className="mb-6 flex items-center gap-2">
        {["Shipping", "Payment", "Review"].map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
              step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "brand-gradient text-white" : "bg-muted text-muted-foreground"
            }`}>
              {step > i + 1 ? <Check width={14} height={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < 2 && <div className={`h-0.5 flex-1 ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          {/* STEP 1: shipping */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Shipping Address</h2>
              {!user && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">We'll send your order confirmation here.</p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Full Name</label>
                  <input value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Phone</label>
                  <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="+234..." className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Street Address</label>
                <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="House no, street, area" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">City</label>
                  <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">State</label>
                  <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Country</label>
                  <input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!address.fullName || !address.phone || !address.street || !address.city) {
                    toast.error("Please complete all address fields");
                    return;
                  }
                  if (!user && !email) {
                    toast.error("Please enter your email");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full brand-gradient text-white"
                size="lg"
              >
                Continue to Payment <ArrowRight width={16} height={16} />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: payment */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Payment Method</h2>
              <div className="space-y-2">
                {[
                  { id: "card", label: "Credit / Debit Card", icon: CreditCard, sub: "Visa, Mastercard, Verve — instant" },
                  { id: "transfer", label: "Bank Transfer", icon: ShieldCheck, sub: "Pay via bank transfer — verify in minutes" },
                  { id: "cod", label: "Cash on Delivery", icon: Banknote, sub: "Pay when your order arrives" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id as typeof payment)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                      payment === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-lg ${payment === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <p.icon width={20} height={20} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.sub}</p>
                    </div>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${payment === p.id ? "border-primary" : "border-border"}`}>
                      {payment === p.id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>

              {payment === "card" && (
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck width={18} height={18} className="text-primary" />
                    <p className="text-sm font-bold">Secured by Paystack</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll be redirected to Paystack's secure checkout to enter your card details. We never see or store your card information. Supports Visa, Mastercard, Verve, and bank transfer.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {["VISA", "Mastercard", "Verve"].map((p) => (
                      <span key={p} className="rounded border border-border bg-background px-2 py-1 text-[10px] font-bold text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  <ArrowLeft width={16} height={16} /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 brand-gradient text-white">
                  Review Order <ArrowRight width={16} height={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: review */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Review Your Order</h2>

              <div className="rounded-xl border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Shipping To</h3>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
                </div>
                <p className="text-sm">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.street}, {address.city}, {address.state}, {address.country}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
              </div>

              <div className="rounded-xl border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Payment</h3>
                  <button onClick={() => setStep(2)} className="text-xs font-semibold text-primary hover:underline">Edit</button>
                </div>
                <p className="text-sm capitalize">{payment === "cod" ? "Cash on Delivery" : payment === "card" ? "Credit / Debit Card" : "Bank Transfer"}</p>
              </div>

              {/* coupon */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag width={15} height={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon code (try RAFAAB10)"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button onClick={applyCoupon} variant="outline">Apply</Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  <ArrowLeft width={16} height={16} /> Back
                </Button>
                <Button onClick={placeOrder} disabled={loading} className="flex-1 brand-gradient text-white">
                  {loading ? <Loader2 className="animate-spin" width={17} height={17} /> : <>{payment === "card" ? "Pay with Paystack" : "Place Order"} · {formatNaira(total)}</>}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* order summary */}
        <div>
          <div className="sticky top-32 rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-base font-bold">Order Summary</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin pr-1">
              {cart.map((l) => {
                const price = l.product.discountPrice ?? l.product.price;
                return (
                  <div key={l.product.id} className="flex gap-2.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {l.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-tight">{l.product.title}</p>
                      <p className="text-sm font-bold text-primary">{formatNaira(price * l.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? <span style={{ color: "var(--deal)" }} className="font-semibold">FREE</span> : formatNaira(shipping)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount (10%)</span><span>-{formatNaira(discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold"><span>Total</span><span className="text-primary">{formatNaira(total)}</span></div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
              <Truck width={15} height={15} className="shrink-0 text-primary" />
              {shipping === 0 ? "You unlocked FREE shipping!" : `Add ${formatNaira(50000 - subtotal)} for free shipping`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
