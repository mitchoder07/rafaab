"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X, ChevronDown, Star, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { getCategoryIcon } from "../category-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

type View = { name: "catalog"; categoryId?: string; query?: string; flash?: boolean };

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

const PRICE_BANDS = [
  { label: "Under ₦20,000", min: 0, max: 20000 },
  { label: "₦20,000 - ₦50,000", min: 20000, max: 50000 },
  { label: "₦50,000 - ₦150,000", min: 50000, max: 150000 },
  { label: "₦150,000 - ₦400,000", min: 150000, max: 400000 },
  { label: "Over ₦400,000", min: 400000, max: 0 },
];

type FilterState = {
  page: number;
  selectedBrands: string[];
  minRating: number;
  priceBand: number | null;
  sort: string;
};

export function CatalogView({ view, categories }: { view: View; categories: Category[] }) {
  const navigate = useStore((s) => s.navigate);

  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    selectedBrands: [],
    minRating: 0,
    priceBand: null,
    sort: "popular",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Render-time reset of filters when the view identity changes (React-recommended pattern)
  const viewKey = `${view.categoryId || ""}|${view.query || ""}|${view.flash ? "1" : "0"}`;
  const [prevViewKey, setPrevViewKey] = useState(viewKey);
  if (prevViewKey !== viewKey) {
    setPrevViewKey(viewKey);
    setFilters({ page: 1, selectedBrands: [], minRating: 0, priceBand: null, sort: "popular" });
  }

  const activeCategory = view.categoryId
    ? categories.find((c) => c.id === view.categoryId)
    : undefined;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (view.categoryId) {
      const cat = categories.find((c) => c.id === view.categoryId);
      if (cat) params.set("category", cat.slug);
    }
    if (view.query) params.set("q", view.query);
    if (view.flash) params.set("flash", "1");
    if (filters.selectedBrands.length) params.set("brand", filters.selectedBrands[0]);
    if (filters.minRating) params.set("rating", String(filters.minRating));
    const band = filters.priceBand !== null ? PRICE_BANDS[filters.priceBand] : null;
    if (band) {
      if (band.min) params.set("minPrice", String(band.min));
      if (band.max) params.set("maxPrice", String(band.max));
    }
    params.set("sort", filters.sort);
    params.set("page", String(filters.page));
    params.set("pageSize", "24");
    return params.toString();
  }, [view, categories, filters]);

  const loading = loadedQuery !== queryString;

  useEffect(() => {
    let alive = true;
    apiGet<{ products: Product[]; total: number; totalPages: number }>(`/api/products?${queryString}`)
      .then((res) => {
        if (!alive) return;
        setProducts(res.products);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setLoadedQuery(queryString);
      })
      .catch(() => {
        if (!alive) return;
        setProducts([]);
        setLoadedQuery(queryString);
      });
    return () => {
      alive = false;
    };
  }, [queryString]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return Array.from(set).sort();
  }, [products]);

  const heading = view.flash
    ? "⚡ Flash Sale"
    : view.query
    ? `Results for "${view.query}"`
    : activeCategory
    ? activeCategory.name
    : "All Products";

  const resetFilters = () =>
    setFilters({ page: 1, selectedBrands: [], minRating: 0, priceBand: null, sort: "popular" });

  const setSort = (v: string) => setFilters((f) => ({ ...f, sort: v, page: 1 }));
  const setMinRating = (v: number) => setFilters((f) => ({ ...f, minRating: v, page: 1 }));
  const setPriceBand = (v: number | null) => setFilters((f) => ({ ...f, priceBand: v, page: 1 }));
  const toggleBrand = (b: string) =>
    setFilters((f) => ({
      ...f,
      selectedBrands: f.selectedBrands.includes(b) ? f.selectedBrands.filter((x) => x !== b) : [b],
      page: 1,
    }));
  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));

  const filterPanelProps = {
    view,
    categories,
    navigate,
    filters,
    availableBrands,
    setPriceBand,
    setMinRating,
    toggleBrand,
    resetFilters,
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading..." : `${total} ${total === 1 ? "product" : "products"} found`}
          {view.flash && " — grab them before they're gone!"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* sidebar filters (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-2xl border border-border bg-card p-4">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* products */}
        <div>
          {/* toolbar */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal width={15} height={15} /> Filters
            </button>
            <div className="relative ml-auto">
              <select
                value={filters.sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-sm font-medium outline-none focus:border-primary"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown width={15} height={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* active filter chips */}
          {(filters.selectedBrands.length > 0 || filters.minRating > 0 || filters.priceBand !== null) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {filters.selectedBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {b} <X width={12} height={12} />
                </button>
              ))}
              {filters.minRating > 0 && (
                <button
                  onClick={() => setMinRating(0)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {filters.minRating}★ & up <X width={12} height={12} />
                </button>
              )}
              {filters.priceBand !== null && (
                <button
                  onClick={() => setPriceBand(null)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {PRICE_BANDS[filters.priceBand].label} <X width={12} height={12} />
                </button>
              )}
            </div>
          )}

          {/* grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Package width={40} height={40} className="mx-auto text-muted-foreground/40" />
              <p className="mt-3 text-lg font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search.</p>
              <Button onClick={resetFilters} variant="outline" className="mt-4">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const start = Math.max(1, Math.min(filters.page - 2, totalPages - 4));
                const n = start + i;
                if (n > totalPages) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "h-9 w-9 rounded-lg text-sm font-medium transition",
                      n === filters.page ? "brand-gradient text-white" : "border border-border hover:bg-muted"
                    )}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, filters.page + 1))}
                disabled={filters.page === totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-2">
            <FilterPanel {...filterPanelProps} />
          </div>
          <SheetFooter>
            <Button onClick={() => setMobileFiltersOpen(false)} className="brand-gradient text-white">
              Show {total} Results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type FilterPanelProps = {
  view: View;
  categories: Category[];
  navigate: (v: View) => void;
  filters: FilterState;
  availableBrands: string[];
  setPriceBand: (v: number | null) => void;
  setMinRating: (v: number) => void;
  toggleBrand: (b: string) => void;
  resetFilters: () => void;
};

function FilterPanel({
  view,
  categories,
  navigate,
  filters,
  availableBrands,
  setPriceBand,
  setMinRating,
  toggleBrand,
  resetFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* categories quick switch */}
      <div>
        <h4 className="mb-2 text-sm font-bold">Category</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => navigate({ name: "catalog" })}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-muted",
              !view.categoryId && !view.flash ? "bg-primary/10 font-semibold text-primary" : ""
            )}
          >
            <Package width={14} height={14} /> All Products
          </button>
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <button
                key={c.id}
                onClick={() => navigate({ name: "catalog", categoryId: c.id })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-muted",
                  view.categoryId === c.id ? "bg-primary/10 font-semibold text-primary" : ""
                )}
              >
                <Icon width={14} height={14} style={{ color: c.color || undefined }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* price */}
      <div>
        <h4 className="mb-2 text-sm font-bold">Price Range</h4>
        <div className="space-y-1">
          {PRICE_BANDS.map((b, i) => (
            <button
              key={i}
              onClick={() => setPriceBand(filters.priceBand === i ? null : i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-muted",
                filters.priceBand === i ? "bg-primary/10 font-semibold text-primary" : ""
              )}
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-full border", filters.priceBand === i ? "border-primary" : "border-border")}>
                {filters.priceBand === i && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* rating */}
      <div>
        <h4 className="mb-2 text-sm font-bold">Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(filters.minRating === r ? 0 : r)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-muted",
                filters.minRating === r ? "bg-primary/10 font-semibold text-primary" : ""
              )}
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-full border", filters.minRating === r ? "border-primary" : "border-border")}>
                {filters.minRating === r && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <Star width={13} height={13} className="text-amber-400 fill-amber-400" />
              <span>{r} stars & up</span>
            </button>
          ))}
        </div>
      </div>

      {/* brands (if loaded) */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-bold">Brand</h4>
          <div className="max-h-40 space-y-1 overflow-y-auto scroll-thin">
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => toggleBrand(b)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-muted",
                  filters.selectedBrands.includes(b) ? "bg-primary/10 font-semibold text-primary" : ""
                )}
              >
                <span className={cn("grid h-4 w-4 place-items-center rounded border", filters.selectedBrands.includes(b) ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {filters.selectedBrands.includes(b) && <span className="text-[10px]">✓</span>}
                </span>
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button onClick={resetFilters} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  );
}
