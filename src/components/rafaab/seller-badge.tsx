"use client";

import { Store } from "lucide-react";
import { useStore } from "@/lib/store";
import type { StoreData } from "@/lib/types";

export function SellerBadge({ store, size = "sm" }: { store: StoreData | null | undefined; size?: "sm" | "md" }) {
  const navigate = useStore((s) => s.navigate);
  if (!store) return null;

  const classes = size === "md"
    ? "px-2.5 py-1 text-xs"
    : "px-2 py-0.5 text-[10px]";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate({ name: "store", storeSlug: store.slug });
      }}
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 font-semibold text-primary transition hover:bg-primary/20 ${classes}`}
    >
      {store.logo ? (
        <img src={store.logo} alt="" className={size === "md" ? "h-4 w-4 rounded-full object-cover" : "h-3 w-3 rounded-full object-cover"} />
      ) : (
        <Store width={size === "md" ? 12 : 10} height={size === "md" ? 12 : 10} />
      )}
      {store.name}
    </button>
  );
}
