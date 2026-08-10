"use client";

import { Sparkles, Facebook, Instagram, Twitter, Youtube, Send, Shield, Truck, RotateCcw, Headset } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

const TRUST = [
  { icon: Truck, title: "Fast Delivery", sub: "Nationwide, 1-3 days" },
  { icon: Shield, title: "Secure Payments", sub: "Card, transfer & COD" },
  { icon: RotateCcw, title: "7-Day Returns", sub: "Hassle-free refunds" },
  { icon: Headset, title: "24/7 Support", sub: "We're always here" },
];

export function Footer({ onNavigateCategory }: { onNavigateCategory?: () => void }) {
  const navigate = useStore((s) => s.navigate);
  const setAiChatOpen = useStore((s) => s.setAiChatOpen);
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Subscribed! Check your inbox for a welcome offer.");
    setEmail("");
  };

  return (
    <footer className="mt-auto border-t border-border bg-card">
      {/* trust badges */}
      <div className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <t.icon width={20} height={20} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-5">
        <div className="col-span-2">
          <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-1.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-white shadow-md">
              <Sparkles width={18} height={18} />
            </span>
            <span className="text-xl font-black brand-gradient-text">Rafaab</span>
          </button>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Rafaab is the smarter way to shop online — premium products, AI-powered assistance, flash deals and reliable delivery, all in one place.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex max-w-sm gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for deals"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit" className="flex items-center gap-1.5 rounded-lg brand-gradient px-4 text-sm font-semibold text-white transition hover:opacity-90">
              <Send width={15} height={15} /> Join
            </button>
          </form>
          <div className="mt-4 flex gap-2">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <button
                key={i}
                aria-label="social"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground/70 transition hover:bg-primary hover:text-primary-foreground"
              >
                <Icon width={17} height={17} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><button onClick={() => navigate({ name: "catalog", flash: true })} className="transition hover:text-primary">Flash Sale</button></li>
            <li><button onClick={() => navigate({ name: "catalog" })} className="transition hover:text-primary">All Products</button></li>
            <li><button onClick={() => { navigate({ name: "catalog" }); onNavigateCategory?.(); }} className="transition hover:text-primary">Categories</button></li>
            <li><button onClick={() => navigate({ name: "wishlist" })} className="transition hover:text-primary">Wishlist</button></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><button onClick={() => setAiChatOpen(true)} className="transition hover:text-primary">Ask Rafi AI</button></li>
            <li><button onClick={() => navigate({ name: "orders" })} className="transition hover:text-primary">Track Order</button></li>
            <li><button className="transition hover:text-primary">Returns & Refunds</button></li>
            <li><button className="transition hover:text-primary">Shipping Info</button></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><button className="transition hover:text-primary">About Rafaab</button></li>
            <li><button className="transition hover:text-primary">Sell on Rafaab</button></li>
            <li><button className="transition hover:text-primary">Careers</button></li>
            <li><button className="transition hover:text-primary">Contact Us</button></li>
          </ul>
        </div>
      </div>

      {/* payment + copyright */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Rafaab. All rights reserved. Shop smarter, live better.</p>
          <div className="flex items-center gap-2">
            {["VISA", "Mastercard", "Verve", "Paystack", "COD"].map((p) => (
              <span key={p} className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-bold text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
