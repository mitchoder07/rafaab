"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Zap,
  Package,
  LogOut,
  Bot,
  LayoutDashboard,
  Truck,
  Store,
  Gift,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCategoryIcon } from "./category-icons";
import type { Category } from "@/lib/types";

const DEAL_MESSAGES = [
  { icon: Zap, text: "Mega Flash Sale — up to 60% off, ends today!" },
  { icon: Truck, text: "Free delivery on orders over ₦50,000" },
  { icon: Gift, text: "Use code RAFAAB10 for 10% off your first order" },
  { icon: Sparkles, text: "New arrivals every week — shop the latest drops" },
  { icon: Bot, text: "Meet Rafi — your AI assistant, bottom right" },
];

export function Header({ categories }: { categories: Category[] }) {
  const navigate = useStore((s) => s.navigate);
  const view = useStore((s) => s.view);
  const cartCount = useStore((s) => s.cartCount());
  const wishlistCount = useStore((s) => s.wishlist.length);
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const setAuthOpen = useStore((s) => s.setAuthOpen);
  const setAiChatOpen = useStore((s) => s.setAiChatOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close account dropdown when clicking outside (with small delay for touch)
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-account-dropdown]")) setAccountOpen(false);
    };
    // Delay adding the listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [accountOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    navigate({ name: "catalog", query: q });
    setMobileNav(false);
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout");
      setUser(null);
      toast.success("Signed out");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement marquee */}
      <div className="overflow-hidden brand-gradient text-white">
        <div className="flex w-max animate-marquee whitespace-nowrap py-1.5 text-xs font-medium">
          {[...DEAL_MESSAGES, ...DEAL_MESSAGES].map((m, i) => {
            const Icon = m.icon;
            return (
              <span key={i} className="mx-6 inline-flex items-center gap-1.5">
                <Icon width={13} height={13} className="shrink-0" />
                {m.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "border-b border-border bg-background/95 backdrop-blur transition-shadow relative z-50",
          scrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-6">
          {/* logo */}
          <button
            onClick={() => navigate({ name: "home" })}
            className="flex shrink-0 items-center gap-2"
            aria-label="Rafaab home"
          >
            <img src="/logo-light.svg" alt="Rafaab" width={36} height={36} className="rounded-lg shadow-sm block dark:hidden" />
            <img src="/logo-dark.svg" alt="Rafaab" width={36} height={36} className="rounded-lg shadow-sm hidden dark:block" />
            <span className="text-xl font-black tracking-tight brand-gradient-text">Rafaab</span>
          </button>

          {/* search (desktop) */}
          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search for products, brands and categories..."
              className="h-10 w-full rounded-full border border-border bg-muted/60 pl-10 pr-24 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 rounded-full brand-gradient px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Search
            </button>
          </form>

          {/* right actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setAiChatOpen(true)}
              className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 lg:flex"
            >
              <Bot width={14} height={14} /> Ask Rafi
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              suppressHydrationWarning
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:bg-muted"
            >
              {theme === "dark" ? <Sun width={18} height={18} /> : <Moon width={18} height={18} />}
            </button>

            <button
              onClick={() => navigate({ name: "orders" })}
              aria-label="Track orders"
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:bg-muted md:hidden"
            >
              <Truck width={18} height={18} />
            </button>

            <button
              onClick={() => navigate({ name: "wishlist" })}
              aria-label="Wishlist"
              className="relative grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:bg-muted"
            >
              <Heart width={19} height={19} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* account */}
            {user ? (
              <div className="relative" data-account-dropdown>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Account"
                  aria-expanded={accountOpen}
                  className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition hover:bg-muted"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-20 truncate font-medium sm:block">{user.name.split(" ")[0]}</span>
                </button>
                <div
                  className={`absolute right-0 top-full z-[60] w-56 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-xl transition-all ${
                    accountOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 -translate-y-1 pointer-events-none"
                  }`}
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate({ name: "orders" }); setAccountOpen(false); }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                  >
                    <Package width={16} height={16} /> My Orders
                  </button>
                  <button
                    onClick={() => { navigate({ name: "wishlist" }); setAccountOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                  >
                    <Heart width={16} height={16} /> Wishlist
                  </button>
                  <button
                    onClick={() => { navigate({ name: "seller" }); setAccountOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <Store width={16} height={16} /> Seller Dashboard
                  </button>
                  {user.role === "admin" && (
                    <button
                      onClick={() => { navigate({ name: "admin" }); setAccountOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 transition hover:bg-muted"
                    >
                      <LayoutDashboard width={16} height={16} /> Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setAccountOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut width={16} height={16} /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true, "login")}
                className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition hover:bg-muted"
                aria-label="Sign in"
              >
                <User width={19} height={19} />
                <span className="hidden font-medium sm:block">Sign in</span>
              </button>
            )}

            {/* cart */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="relative flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <ShoppingCart width={18} height={18} />
              <span className="hidden sm:block">Cart</span>
              {cartCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-primary">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileNav((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:bg-muted md:hidden"
              aria-label="Menu"
            >
              {mobileNav ? <X width={20} height={20} /> : <Menu width={20} height={20} />}
            </button>
          </div>
        </div>

        {/* search (mobile) */}
        <form onSubmit={submitSearch} className="px-4 pb-2 md:hidden">
          <div className="relative h-10">
            <Search className="pointer-events-none absolute left-3 top-0 bottom-0 my-auto h-[18px] w-[18px] text-muted-foreground" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search Rafaab..."
              className="h-10 w-full rounded-full border border-border bg-muted/60 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-background"
            />
          </div>
        </form>
      </div>

      {/* Category nav (desktop) */}
      <nav className="hidden border-b border-border bg-background/95 backdrop-blur md:block relative z-30">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 sm:px-6 no-scrollbar">
          <button
            onClick={() => navigate({ name: "catalog" })}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-muted",
              view.name === "catalog" && !view.categoryId && !view.query && !view.flash && "text-primary"
            )}
          >
            <Menu width={15} height={15} /> All Products
          </button>
          <button
            onClick={() => navigate({ name: "catalog", flash: true })}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:bg-deal/10"
            style={{ color: "var(--deal)" }}
          >
            <Zap width={15} height={15} className="fill-current" /> Flash Sale
          </button>
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const active = view.name === "catalog" && view.categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => navigate({ name: "catalog", categoryId: c.id })}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-muted",
                  active && "text-primary"
                )}
              >
                <Icon width={15} height={15} style={{ color: c.color || undefined }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Category nav (mobile drawer) */}
      {mobileNav && (
        <div className="border-b border-border bg-background md:hidden">
          <div className="grid grid-cols-2 gap-1 p-3">
            <button
              onClick={() => {
                navigate({ name: "catalog", flash: true });
                setMobileNav(false);
              }}
              className="flex items-center gap-2 rounded-lg bg-deal/10 px-3 py-2.5 text-sm font-semibold"
              style={{ color: "var(--deal)" }}
            >
              <Zap width={16} height={16} className="fill-current" /> Flash Sale
            </button>
            <button
              onClick={() => {
                navigate({ name: "catalog" });
                setMobileNav(false);
              }}
              className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium"
            >
              <Package width={16} height={16} /> All Products
            </button>
            {categories.map((c) => {
              const Icon = getCategoryIcon(c.icon);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    navigate({ name: "catalog", categoryId: c.id });
                    setMobileNav(false);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium"
                >
                  <Icon width={16} height={16} style={{ color: c.color || undefined }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
