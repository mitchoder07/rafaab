"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  Save,
  Store as StoreIcon,
  Wallet,
  Settings as SettingsIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Category, Product, OrderData, StoreData, PlatformSettings } from "@/lib/types";

type Tab = "overview" | "products" | "orders" | "sellers" | "payouts" | "settings";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  lowStockCount: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
};

const ORDER_STATUSES = [
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  processing: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  shipped: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  out_for_delivery: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30",
  delivered: "text-green-600 bg-green-100 dark:bg-green-900/30",
  cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export function AdminView({ initialTab = "overview" }: { initialTab?: Tab }) {
  const navigate = useStore((s) => s.navigate);
  const user = useStore((s) => s.user);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiGet<{ categories: Category[] }>("/api/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => {});
  }, []);

  // Guard: non-admins can't see this
  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertTriangle width={40} height={40} className="mx-auto text-destructive" />
        <h1 className="mt-3 text-xl font-bold">Access Denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You need an admin account to access the seller dashboard.
        </p>
        <Button onClick={() => navigate({ name: "home" })} className="mt-4 brand-gradient text-white">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage the marketplace, products, orders and sellers</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Admin</span>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 no-scrollbar">
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "products", label: "Products", icon: Package },
          { id: "orders", label: "Orders", icon: ShoppingBag },
          { id: "sellers", label: "Sellers", icon: StoreIcon },
          { id: "payouts", label: "Payouts", icon: Wallet },
          { id: "settings", label: "Settings", icon: SettingsIcon },
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

      {tab === "overview" && <OverviewTab categories={categories} />}
      {tab === "products" && <ProductsTab categories={categories} />}
      {tab === "orders" && <OrdersTab />}
      {tab === "sellers" && <SellersTab />}
      {tab === "payouts" && <AdminPayoutsTab />}
      {tab === "settings" && <MarketplaceSettingsTab />}
    </div>
  );
}

/* ---------- Overview ---------- */
function OverviewTab({ categories }: { categories: Category[] }) {
  const [data, setData] = useState<{
    stats: Stats;
    recentOrders: { id: string; orderNumber: string; status: string; total: number; createdAt: string; itemCount: number }[];
    recentProducts: Product[];
    revenueByCategory: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    apiGet<{
      stats: Stats;
      recentOrders: { id: string; orderNumber: string; status: string; total: number; createdAt: string; itemCount: number }[];
      recentProducts: Product[];
      revenueByCategory: { name: string; value: number }[];
    }>("/api/admin/stats").then((r) => setData(r)).catch(() => toast.error("Failed to load stats"));
  }, []);

  if (!data) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" width={28} height={28} /></div>;
  }

  const { stats } = data;
  const maxRev = Math.max(...data.revenueByCategory.map((c) => c.value), 1);

  const cards = [
    { label: "Total Revenue", value: formatNaira(stats.revenue), icon: DollarSign, color: "from-emerald-500 to-green-600" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "from-violet-500 to-purple-600" },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "from-sky-500 to-blue-600" },
    { label: "Customers", value: stats.totalUsers, icon: Users, color: "from-pink-500 to-rose-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow`}>
                <c.icon width={20} height={20} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending / Processing", value: stats.pendingOrders, icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
          { label: "In Transit", value: stats.shippedOrders, icon: Truck, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
          { label: "Delivered", value: stats.deliveredOrders, icon: CheckCircle2, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.color}`}>
              <s.icon width={20} height={20} />
            </span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle width={20} height={20} className="text-amber-600" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {stats.lowStockCount} {stats.lowStockCount === 1 ? "product is" : "products are"} running low on stock (≤10 left). Restock soon.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by category */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <TrendingUp width={16} height={16} className="text-primary" /> Revenue by Category (30 days)
          </h3>
          {data.revenueByCategory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales in the last 30 days.</p>
          ) : (
            <div className="space-y-2.5">
              {data.revenueByCategory.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-bold text-primary">{formatNaira(c.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.value / maxRev) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full brand-gradient"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <ShoppingBag width={16} height={16} className="text-primary" /> Recent Orders
          </h3>
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <div>
                    <p className="text-xs font-bold">{o.orderNumber}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {new Date(o.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </p>
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
    </div>
  );
}

/* ---------- Products ---------- */
function ProductsTab({ categories }: { categories: Category[] }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setProducts(null);
    apiGet<{ products: Product[] }>(`/api/admin/products${search ? `?q=${encodeURIComponent(search)}` : ""}`)
      .then((r) => setProducts(r.products))
      .catch(() => {
        toast.error("Failed to load products");
        setProducts([]);
      });
  };

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
     
  }, [search]);

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/admin/products/${p.id}`);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={16} height={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, brand..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Button onClick={() => setCreating(true)} className="brand-gradient text-white">
          <Plus width={16} height={16} /> Add Product
        </Button>
      </div>

      {products === null ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Package width={32} height={32} className="mx-auto text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No products found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="transition hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="line-clamp-1 font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{formatNaira(p.discountPrice ?? p.price)}</span>
                      {p.discountPrice && <span className="ml-1 text-xs text-muted-foreground line-through">{formatNaira(p.price)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("font-semibold", p.stock <= 10 ? "text-destructive" : "")}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.isFlashSale && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">FLASH</span>}
                        {p.isFeatured && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30">FEATURED</span>}
                        {p.isBestSeller && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30">BEST</span>}
                        {p.isNewArrival && <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/30">NEW</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          aria-label="Edit"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground/70 transition hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil width={14} height={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          aria-label="Delete"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground/70 transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(editing || creating) && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Product Editor Modal ---------- */
function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
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
    isFeatured: product?.isFeatured || false,
    isBestSeller: product?.isBestSeller || false,
    isNewArrival: product?.isNewArrival || false,
    isFlashSale: product?.isFlashSale || false,
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
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isFlashSale: form.isFlashSale,
    };
    try {
      if (isEdit && product) {
        await apiPatch(`/api/admin/products/${product.id}`, payload);
        toast.success("Product updated");
      } else {
        await apiPost("/api/admin/products", payload);
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
                <SelectTrigger className="h-10"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Price (₦) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Discount Price</label>
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
          <div className="flex flex-wrap gap-4">
            {([
              ["isFeatured", "Featured"],
              ["isBestSeller", "Best Seller"],
              ["isNewArrival", "New Arrival"],
              ["isFlashSale", "Flash Sale"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[k] as boolean}
                  onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                  className="h-4 w-4 rounded accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="brand-gradient text-white">
            {saving ? <Loader2 className="animate-spin" width={16} height={16} /> : <Save width={16} height={16} />}
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Orders ---------- */
function OrdersTab() {
  const navigate = useStore((s) => s.navigate);
  const [orders, setOrders] = useState<(OrderData & { customer?: { name: string; email: string } })[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reloadTick, setReloadTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const queryKey = `${statusFilter}|${reloadTick}`;
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let alive = true;
    apiGet<{ orders: (OrderData & { customer?: { name: string; email: string } })[] }>(
      `/api/admin/orders${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`
    )
      .then((r) => {
        if (!alive) return;
        setOrders(r.orders);
        setLoadedKey(queryKey);
      })
      .catch(() => {
        if (!alive) return;
        toast.error("Failed to load orders");
        setOrders([]);
        setLoadedKey(queryKey);
      });
    return () => {
      alive = false;
    };
  }, [queryKey, statusFilter]);

  const reload = () => setReloadTick((t) => t + 1);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await apiPatch(`/api/admin/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status.replace("_", " ")}`);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["all", ...ORDER_STATUSES.map((s) => s.value)].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              statusFilter === s ? "brand-gradient text-white" : "border border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s === "all" ? "All Orders" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <ShoppingBag width={32} height={32} className="mx-auto text-muted-foreground/40" />
          <p className="mt-2 font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{o.orderNumber}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[o.status])}>
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                    {o.customer && ` · ${o.customer.name} (${o.customer.email})`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{formatNaira(o.total)}</p>
                  <p className="text-xs text-muted-foreground">{o.items.length} {o.items.length === 1 ? "item" : "items"}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="text-xs font-semibold text-muted-foreground">Update status:</span>
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => navigate({ name: "track", orderId: o.id })}
                  className="ml-auto flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
                >
                  View Tracking <ChevronRight width={13} height={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Sellers Tab ---------- */
function SellersTab() {
  const navigate = useStore((s) => s.navigate);
  const [stores, setStores] = useState<(StoreData & { owner?: { name: string; email: string }; productCount?: number; payoutCount?: number })[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [applications, setApplications] = useState<{ id: string; storeName: string; storeSlug: string; status: string; supportEmail: string; supportPhone: string; submittedAt: string; user?: { name: string; email: string } }[]>([]);
  const [reloadTick, setReloadTick] = useState(0);
  const queryKey = `${statusFilter}|${reloadTick}`;
  const loading = loadedKey !== queryKey;

  const load = () => setReloadTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    apiGet<{ stores: (StoreData & { owner?: { name: string; email: string }; productCount?: number; payoutCount?: number })[] }>(`/api/admin/sellers${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`)
      .then((r) => { if (!alive) return; setStores(r.stores); })
      .catch(() => { if (!alive) return; setStores([]); });
    apiGet<{ applications: { id: string; storeName: string; storeSlug: string; status: string; supportEmail: string; supportPhone: string; submittedAt: string; user?: { name: string; email: string } }[] }>(`/api/admin/applications${statusFilter === "pending" ? "?status=pending" : ""}`)
      .then((r) => { if (!alive) return; setApplications(r.applications); setLoadedKey(queryKey); })
      .catch(() => { if (!alive) return; setApplications([]); setLoadedKey(queryKey); });
    return () => { alive = false; };
  }, [queryKey, statusFilter]);

  const approveApp = async (appId: string) => {
    try {
      await apiPatch("/api/admin/applications", { applicationId: appId, action: "approve" });
      toast.success("Application approved");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };
  const rejectApp = async (appId: string) => {
    const reason = prompt("Reason for rejection (optional):") || "";
    try {
      await apiPatch("/api/admin/applications", { applicationId: appId, action: "reject", rejectionReason: reason });
      toast.success("Application rejected");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };
  const updateStoreStatus = async (storeId: string, status: string) => {
    try {
      await apiPatch(`/api/admin/sellers/${storeId}/status`, { status });
      toast.success(`Store ${status}`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  };
  const updateCommission = async (storeId: string, rate: number) => {
    try {
      await apiPatch(`/api/admin/sellers/${storeId}/commission`, { commissionRate: rate });
      toast.success("Commission updated");
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  const pendingApps = applications?.filter((a) => a.status === "pending") || [];

  return (
    <div className="space-y-5">
      {/* Pending applications */}
      {pendingApps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold">Pending Applications ({pendingApps.length})</h3>
          <div className="space-y-2">
            {pendingApps.map((a) => (
              <div key={a.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{a.storeName}</p>
                    <p className="text-xs text-muted-foreground">{a.user?.name} · {a.user?.email}</p>
                    <p className="text-xs text-muted-foreground">{a.supportEmail} · {a.supportPhone}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => approveApp(a.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700">Approve</button>
                    <button onClick={() => rejectApp(a.id)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + stores list */}
      <div>
        <div className="mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {["all", "approved", "pending", "suspended", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition", statusFilter === s ? "brand-gradient text-white" : "border border-border text-muted-foreground hover:bg-muted")}>{s}</button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>
        ) : stores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No stores found.</div>
        ) : (
          <div className="space-y-2">
            {stores.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate({ name: "store", storeSlug: s.slug })} className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg brand-gradient text-white">
                      {s.logo ? <img src={s.logo} alt="" className="h-full w-full object-cover" /> : <StoreIcon width={18} height={18} />}
                    </button>
                    <div>
                      <p className="text-sm font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.owner?.name} · {s.owner?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.productCount} products</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", s.status === "approved" ? "bg-green-100 text-green-700" : s.status === "suspended" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{s.status}</span>
                    <Select value={s.status} onValueChange={(v) => updateStoreStatus(s.id, v)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-xs">
                  <span className="text-muted-foreground">Commission: <span className="font-bold text-foreground">{(s.commissionRate * 100).toFixed(0)}%</span></span>
                  <input type="number" step="0.05" min="0" max="1" defaultValue={s.commissionRate} onBlur={(e) => { const v = parseFloat(e.target.value); if (v !== s.commissionRate && !isNaN(v)) updateCommission(s.id, v); }} className="h-7 w-20 rounded border border-border px-2 text-xs outline-none focus:border-primary" />
                  <span className="text-muted-foreground">Available: <span className="font-bold text-foreground">{formatNaira(s.availableBalance)}</span></span>
                  <span className="text-muted-foreground">Lifetime: <span className="font-bold text-foreground">{formatNaira(s.lifetimeEarnings)}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Admin Payouts Tab ---------- */
function AdminPayoutsTab() {
  const [payouts, setPayouts] = useState<{ id: string; storeId: string; storeName: string; owner: { name: string; email: string }; amount: number; status: string; bankDetails: string; requestedAt: string; processedAt: string | null }[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const queryKey = `${statusFilter}|${reloadTick}`;
  const loading = loadedKey !== queryKey;

  const load = () => setReloadTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    apiGet<{ payouts: { id: string; storeId: string; storeName: string; owner: { name: string; email: string }; amount: number; status: string; bankDetails: string; requestedAt: string; processedAt: string | null }[] }>(`/api/admin/payouts${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`)
      .then((r) => { if (!alive) return; setPayouts(r.payouts); setLoadedKey(queryKey); })
      .catch(() => { if (!alive) return; setPayouts([]); setLoadedKey(queryKey); });
    return () => { alive = false; };
  }, [queryKey, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/api/admin/payouts/${id}/status`, { status });
      toast.success(`Payout marked ${status}`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {["all", "requested", "approved", "paid", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition", statusFilter === s ? "brand-gradient text-white" : "border border-border text-muted-foreground hover:bg-muted")}>{s}</button>
        ))}
      </div>
      {payouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No payouts found.</div>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => {
            let bank = {};
            try { bank = JSON.parse(p.bankDetails); } catch {}
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{formatNaira(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">{p.storeName} · {p.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{(bank as { bankName?: string; accountNumber?: string; accountName?: string }).bankName} · ••••{(bank as { accountNumber?: string }).accountNumber?.slice(-4)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{p.status}</span>
                    <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Marketplace Settings Tab ---------- */
function MarketplaceSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ settings: PlatformSettings }>("/api/admin/marketplace-settings")
      .then((r) => setSettings(r.settings))
      .catch(() => toast.error("Failed to load settings"));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiPatch("/api/admin/marketplace-settings", settings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" width={24} height={24} /></div>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Commission & Payouts</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Default Commission Rate (0-1)</label>
            <input type="number" step="0.01" min="0" max="1" value={settings.defaultCommissionRate} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: parseFloat(e.target.value) || 0 })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
            <p className="mt-1 text-xs text-muted-foreground">Platform takes {Math.round(settings.defaultCommissionRate * 100)}% of each sale. Sellers receive {Math.round((1 - settings.defaultCommissionRate) * 100)}%.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Minimum Payout Amount (₦)</label>
            <input type="number" value={settings.minPayoutAmount} onChange={(e) => setSettings({ ...settings, minPayoutAmount: parseFloat(e.target.value) || 0 })} className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Approval & Automation</h3>
        <div className="space-y-3">
          {[
            { key: "requireProductApproval", label: "Require product approval", desc: "New seller products must be approved by admin before going live" },
            { key: "autoApproveSellers", label: "Auto-approve seller applications", desc: "Skip manual review — sellers get approved instantly on application" },
            { key: "escrowReleaseOnDelivery", label: "Escrow release on delivery", desc: "Hold seller earnings until order is marked delivered" },
          ].map((opt) => (
            <div key={opt.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <button onClick={() => setSettings({ ...settings, [opt.key]: !settings[opt.key as keyof PlatformSettings] })} className={cn("relative h-7 w-12 rounded-full transition", settings[opt.key as keyof PlatformSettings] ? "bg-primary" : "bg-muted")}>
                <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", settings[opt.key as keyof PlatformSettings] ? "left-6" : "left-1")} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="w-full brand-gradient text-white">
        {saving ? <Loader2 className="animate-spin" width={16} height={16} /> : <Save width={16} height={16} />} Save Settings
      </Button>
    </div>
  );
}
