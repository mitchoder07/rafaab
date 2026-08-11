"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Wallet, Store as StoreIcon,
  Plus, Pencil, Trash2, Loader2, DollarSign, TrendingUp, Star,
  ArrowDownToLine, Banknote, Save, AlertTriangle, X, Upload,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Category, Product, OrderData, StoreData, PayoutData } from "@/lib/types";

type Tab = "overview" | "products" | "orders" | "payouts" | "settings";

export function SellerDashboardView({ initialTab = "overview" }: { initialTab?: Tab }) {
  const navigate = useStore((s) => s.navigate);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ store: StoreData | null }>("/api/seller/me")
      .then((r) => {
        setStore(r.store);
        if (!r.store) {
          navigate({ name: "seller-onboarding" });
        }
      })
      .catch(() => toast.error("Failed to load store"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" width={28} height={28} /></div>;
  }
  if (!store) {
    return null; // redirecting to onboarding
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{store.name}</h1>
          <p className="text-sm text-muted-foreground">Seller Dashboard · {store.status === "approved" ? "Active" : store.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-right">
            <p className="text-[10px] font-medium text-muted-foreground">Available</p>
            <p className="text-sm font-bold text-primary">{formatNaira(store.availableBalance)}</p>
          </div>
          <button
            onClick={() => navigate({ name: "store", storeSlug: store.slug })}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
          >
            View Store
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 no-scrollbar">
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "products", label: "Products", icon: Package },
          { id: "orders", label: "Orders", icon: ShoppingBag },
          { id: "payouts", label: "Payouts", icon: Wallet },
          { id: "settings", label: "Settings", icon: StoreIcon },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon width={16} height={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <SellerOverview store={store} />}
      {tab === "products" && <SellerProducts />}
      {tab === "orders" && <SellerOrders />}
      {tab === "payouts" && <SellerPayouts store={store} />}
      {tab === "settings" && <SellerSettings store={store} onUpdate={setStore} />}
    </div>
  );
}

/* ---------- Overview ---------- */
function SellerOverview({ store }: { store: StoreData }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGet<{ stats: { totalProducts: number; pendingProducts: number; lowStockCount: number; orderCount: number; grossRevenue: number; availableBalance: number; pendingBalance: number; lifetimeEarnings: number; releasedEarnings: number; commissionRate: number; rating: number; numReviews: number }; recentOrders: { id: string; orderNumber: string; status: string; createdAt: string; total: number }[] }>>["then"] extends Promise<infer T> ? T : never> | null>(null);

  useEffect(() => {
    apiGet<{ stats: { totalProducts: number; pendingProducts: number; lowStockCount: number; orderCount: number; grossRevenue: number; availableBalance: number; pendingBalance: number; lifetimeEarnings: number; releasedEarnings: number; commissionRate: number; rating: number; numReviews: number }; recentOrders: { id: string; orderNumber: string; status: string; createdAt: string; total: number }[] }>("/api/seller/stats")
      .then((r) => setData(r))
      .catch(() => toast.error("Failed to load stats"));
  }, []);

  if (!data) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>;

  const cards = [
    { label: "Lifetime Earnings", value: formatNaira(data.stats.lifetimeEarnings), icon: DollarSign, color: "from-emerald-500 to-green-600" },
    { label: "Available Balance", value: formatNaira(store.availableBalance), icon: Wallet, color: "from-violet-500 to-purple-600" },
    { label: "Pending Balance", value: formatNaira(store.pendingBalance), icon: Clock, color: "from-amber-500 to-orange-600" },
    { label: "Total Orders", value: data.stats.orderCount, icon: ShoppingBag, color: "from-sky-500 to-blue-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-4">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow`}>
              <c.icon width={20} height={20} />
            </span>
            <p className="mt-3 text-xl font-black sm:text-2xl">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Products</p>
          <p className="text-2xl font-bold">{data.stats.totalProducts}</p>
          {data.stats.pendingProducts > 0 && <p className="text-xs text-amber-600">{data.stats.pendingProducts} pending approval</p>}
          {data.stats.lowStockCount > 0 && <p className="text-xs text-destructive">{data.stats.lowStockCount} low stock</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Gross Revenue</p>
          <p className="text-2xl font-bold">{formatNaira(data.stats.grossRevenue)}</p>
          <p className="text-xs text-muted-foreground">Commission: {(data.stats.commissionRate * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Store Rating</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            {data.stats.rating > 0 ? data.stats.rating.toFixed(1) : "New"}
            {data.stats.rating > 0 && <Star width={18} height={18} className="fill-amber-400 text-amber-400" />}
          </p>
          <p className="text-xs text-muted-foreground">{data.stats.numReviews} reviews</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Recent Orders</h3>
        {data.recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div>
                  <p className="text-xs font-bold">{o.orderNumber}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{formatNaira(o.total)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[o.status])}>
                    {o.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  processing: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  shipped: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  out_for_delivery: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30",
  delivered: "text-green-600 bg-green-100 dark:bg-green-900/30",
  cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
  pending: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  approved: "text-green-600 bg-green-100 dark:bg-green-900/30",
  requested: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  paid: "text-green-600 bg-green-100 dark:bg-green-900/30",
  rejected: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

import { Clock } from "lucide-react";

/* ---------- Products ---------- */
function SellerProducts() {
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const loading = loadedKey !== `tick-${reloadTick}`;

  const load = () => setReloadTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    apiGet<{ products: Product[] }>("/api/seller/products")
      .then((r) => { if (!alive) return; setProducts(r.products); setLoadedKey(`tick-${reloadTick}`); })
      .catch(() => { if (!alive) return; setProducts([]); setLoadedKey(`tick-${reloadTick}`); });
    apiGet<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
    return () => { alive = false; };
  }, [reloadTick]);

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await apiDelete(`/api/seller/products/${p.id}`);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">My Products</h2>
        <Button onClick={() => setCreating(true)} className="brand-gradient text-white">
          <Plus width={16} height={16} /> Add Product
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Package width={32} height={32} className="mx-auto text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No products yet</p>
          <p className="text-sm text-muted-foreground">Add your first product to start selling.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.brand}</p>
                  <p className="text-sm font-bold text-primary">{formatNaira(p.discountPrice ?? p.price)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1">
                  {p.approvalStatus !== "approved" && (
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", p.approvalStatus === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {p.approvalStatus.toUpperCase()}
                    </span>
                  )}
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", p.stock <= 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(p)} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-foreground/70 hover:bg-primary/10 hover:text-primary">
                    <Pencil width={13} height={13} />
                  </button>
                  <button onClick={() => handleDelete(p)} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-foreground/70 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 width={13} height={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <SellerProductEditor
          product={editing}
          categories={categories}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

/* ---------- Product Editor ---------- */
function SellerProductEditor({ product, categories, onClose, onSaved }: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    title: product?.title || "",
    description: product?.description || "",
    brand: product?.brand || "",
    price: product?.price?.toString() || "",
    discountPrice: product?.discountPrice?.toString() || "",
    stock: product?.stock?.toString() || "0",
    categoryId: product?.categoryId || categories[0]?.id || "",
    images: (product?.images || []).join("\n"),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title || !form.brand || !form.price || !form.categoryId) {
      toast.error("Title, brand, price and category are required");
      return;
    }
    setSaving(true);
    const images = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description,
      brand: form.brand,
      price: parseFloat(form.price),
      discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId,
      images,
    };
    try {
      if (isEdit && product) {
        await apiPatch(`/api/seller/products/${product.id}`, payload);
        toast.success("Product updated");
      } else {
        await apiPost("/api/seller/products", payload);
        toast.success("Product created");
      }
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Brand *</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Category *</label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Price (₦) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Discount</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Image URLs (one per line)</label>
            <textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={3} placeholder="https://..." className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="brand-gradient text-white">
            {saving ? <Loader2 className="animate-spin" width={16} height={16} /> : <Save width={16} height={16} />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Orders ---------- */
function SellerOrders() {
  const [orders, setOrders] = useState<(OrderData & { customer?: { name: string; email: string } })[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryKey = statusFilter;
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let alive = true;
    apiGet<{ orders: (OrderData & { customer?: { name: string; email: string } })[] }>(`/api/seller/orders${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`)
      .then((r) => { if (!alive) return; setOrders(r.orders); setLoadedKey(queryKey); })
      .catch(() => { if (!alive) return; setOrders([]); setLoadedKey(queryKey); });
    return () => { alive = false; };
  }, [queryKey, statusFilter]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["all", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition", statusFilter === s ? "brand-gradient text-white" : "border border-border text-muted-foreground hover:bg-muted")}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <ShoppingBag width={32} height={32} className="mx-auto text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                    {o.customer && ` · ${o.customer.name}`}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[o.status])}>{o.status.replace("_", " ")}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {o.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-sm">
                    <img src={it.image} alt="" className="h-8 w-8 rounded object-cover" />
                    <span className="flex-1 truncate">{it.title}</span>
                    <span className="text-xs text-muted-foreground">×{it.quantity}</span>
                    <span className="font-bold">{formatNaira(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Payouts ---------- */
function SellerPayouts({ store }: { store: StoreData }) {
  const [payouts, setPayouts] = useState<PayoutData[] | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState("");

  const load = () => {
    setPayouts(null);
    apiGet<{ payouts: PayoutData[] }>("/api/seller/payouts").then((r) => setPayouts(r.payouts)).catch(() => setPayouts([]));
  };
  useEffect(() => { load(); }, []);

  const requestPayout = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setRequesting(true);
    try {
      await apiPost("/api/seller/payouts", { amount: amt });
      toast.success("Payout requested!");
      setAmount("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRequesting(false);
    }
  };

  if (!payouts) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>;

  let bankName = "", accountNumber = "";
  try {
    const bd = payouts.find((p) => p.bankDetails)?.bankDetails;
    if (bd) { const parsed = JSON.parse(bd); bankName = parsed.bankName; accountNumber = parsed.accountNumber; }
  } catch {}

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Wallet width={20} height={20} className="text-primary" />
          <p className="mt-2 text-2xl font-bold">{formatNaira(store.availableBalance)}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Clock width={20} height={20} className="text-amber-500" />
          <p className="mt-2 text-2xl font-bold">{formatNaira(store.pendingBalance)}</p>
          <p className="text-xs text-muted-foreground">Pending (in orders)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <DollarSign width={20} height={20} className="text-green-600" />
          <p className="mt-2 text-2xl font-bold">{formatNaira(store.lifetimeEarnings)}</p>
          <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Request Payout</h3>
        {!bankName ? (
          <p className="text-sm text-muted-foreground">Add your bank details in Settings to request a payout.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">Bank: {bankName} · ••••{accountNumber.slice(-4)}</p>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₦)" className="h-10 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
              <Button onClick={requestPayout} disabled={requesting} className="brand-gradient text-white">
                {requesting ? <Loader2 className="animate-spin" width={16} height={16} /> : <ArrowDownToLine width={16} height={16} />} Request
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Min: ₦10,000 · Processed within 1-3 business days</p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Payout History</h3>
        {payouts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                <div>
                  <p className="text-sm font-bold">{formatNaira(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.requestedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[p.status])}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
function SellerSettings({ store, onUpdate }: { store: StoreData; onUpdate: (s: StoreData) => void }) {
  const [form, setForm] = useState({
    name: store.name,
    description: store.description || "",
    logo: store.logo || "",
    supportEmail: store.supportEmail || "",
    supportPhone: store.supportPhone || "",
  });
  const [bankForm, setBankForm] = useState({ bankName: "", accountNumber: "", accountName: "", bankCode: "" });
  const [savingStore, setSavingStore] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const saveStore = async () => {
    setSavingStore(true);
    try {
      const res = await apiPatch<{ store: StoreData }>("/api/seller/store", form);
      onUpdate(res.store);
      toast.success("Store updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingStore(false);
    }
  };

  const saveBank = async () => {
    setSavingBank(true);
    try {
      const res = await apiPatch<{ store: StoreData }>("/api/seller/store/payout-details", bankForm);
      onUpdate(res.store);
      toast.success("Bank details saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingBank(false);
    }
  };

  const toggleVacation = async () => {
    try {
      const res = await apiPatch<{ store: StoreData }>("/api/seller/store/vacation", { vacationMode: !store.vacationMode });
      onUpdate(res.store);
      toast.success(res.store.vacationMode ? "Vacation mode ON" : "Vacation mode OFF");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Store Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Store Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Logo URL</label>
            <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Email</label>
              <input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone</label>
              <input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <Button onClick={saveStore} disabled={savingStore} className="w-full brand-gradient text-white">
            {savingStore ? <Loader2 className="animate-spin" width={16} height={16} /> : <Save width={16} height={16} />} Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold">Payout Bank Details</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Bank Name</label>
              <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. Access Bank" className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Account Number</label>
              <input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="0123456789" className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Account Name</label>
              <input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="John Doe" className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <Button onClick={saveBank} disabled={savingBank} className="w-full brand-gradient text-white">
              {savingBank ? <Loader2 className="animate-spin" width={16} height={16} /> : <Banknote width={16} height={16} />} Save Bank Details
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-bold">Store Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Vacation Mode</p>
              <p className="text-xs text-muted-foreground">Hides your products temporarily</p>
            </div>
            <button onClick={toggleVacation} className={cn("relative h-7 w-12 rounded-full transition", store.vacationMode ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", store.vacationMode ? "left-6" : "left-1")} />
            </button>
          </div>
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>Commission rate: <span className="font-bold text-foreground">{(store.commissionRate * 100).toFixed(0)}%</span></p>
            <p>Product approval: <span className="font-bold text-foreground">{store.productApprovalRequired ? "Required" : "Auto-approved"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
