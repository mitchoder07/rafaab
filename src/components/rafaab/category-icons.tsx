import {
  Tv,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  ShoppingBasket,
  Tag,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Tv,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  ShoppingBasket,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Tag;
  return map[name] || Tag;
}
