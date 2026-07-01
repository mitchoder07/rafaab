import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, View, AddressData, OrderData } from "./types";

type CartLine = { product: Product; quantity: number };

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  role?: string;
};

type AIChatMsg = { role: "user" | "assistant"; content: string; products?: Product[] };

type State = {
  // navigation
  view: View;
  viewHistory: View[];
  navigate: (view: View) => void;
  back: () => void;
  canGoBack: () => boolean;

  // data cache
  productsCache: Record<string, Product>; // id -> product (for cart lines after refresh)
  cacheProduct: (p: Product) => void;

  // cart
  cart: CartLine[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;

  // wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // recently viewed
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;

  // orders (guest order numbers stored locally)
  orderNumbers: string[];
  addOrderNumber: (num: string) => void;
  lastOrder: OrderData | null;
  setLastOrder: (o: OrderData | null) => void;

  // auth
  user: User | null;
  setUser: (u: User | null) => void;

  // UI overlays
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  authOpen: boolean;
  authMode: "login" | "register";
  setAuthOpen: (open: boolean, mode?: "login" | "register") => void;
  aiChatOpen: boolean;
  setAiChatOpen: (open: boolean) => void;
  aiMessages: AIChatMsg[];
  addAiMessage: (m: AIChatMsg) => void;
  clearAiMessages: () => void;

  // address (checkout)
  savedAddress: AddressData | null;
  setSavedAddress: (a: AddressData | null) => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      view: { name: "home" },
      viewHistory: [],
      navigate: (view) => {
        const { view: current, viewHistory } = get();
        if (current.name === view.name && JSON.stringify(current) === JSON.stringify(view)) return;
        set({ view, viewHistory: [...viewHistory, current] });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      },
      back: () => {
        const { viewHistory } = get();
        if (viewHistory.length === 0) {
          set({ view: { name: "home" } });
          return;
        }
        const prev = viewHistory[viewHistory.length - 1];
        set({ view: prev, viewHistory: viewHistory.slice(0, -1) });
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      },
      canGoBack: () => get().viewHistory.length > 0,

      productsCache: {},
      cacheProduct: (p) =>
        set((s) => ({ productsCache: { ...s.productsCache, [p.id]: p } })),

      cart: [],
      addToCart: (product, qty = 1) => {
        const { cart } = get();
        const existing = cart.find((l) => l.product.id === product.id);
        if (existing) {
          set({
            cart: cart.map((l) =>
              l.product.id === product.id ? { ...l, quantity: l.quantity + qty } : l
            ),
          });
        } else {
          set({ cart: [...cart, { product, quantity: qty }] });
        }
        get().cacheProduct(product);
        set({ cartOpen: true });
      },
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((l) => l.product.id !== productId) })),
      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((s) => ({
          cart: s.cart.map((l) => (l.product.id === productId ? { ...l, quantity: qty } : l)),
        }));
      },
      clearCart: () => set({ cart: [] }),
      cartCount: () => get().cart.reduce((n, l) => n + l.quantity, 0),
      cartSubtotal: () =>
        get().cart.reduce(
          (sum, l) => sum + (l.product.discountPrice ?? l.product.price) * l.quantity,
          0
        ),

      wishlist: [],
      toggleWishlist: (productId) =>
        set((s) => ({
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((id) => id !== productId)
            : [...s.wishlist, productId],
        })),
      isWishlisted: (productId) => get().wishlist.includes(productId),

      recentlyViewed: [],
      addRecentlyViewed: (productId) =>
        set((s) => ({
          recentlyViewed: [productId, ...s.recentlyViewed.filter((id) => id !== productId)].slice(0, 10),
        })),

      orderNumbers: [],
      addOrderNumber: (num) =>
        set((s) => ({
          orderNumbers: Array.from(new Set([num, ...s.orderNumbers])),
        })),
      lastOrder: null,
      setLastOrder: (o) => set({ lastOrder: o }),

      user: null,
      setUser: (u) => set({ user: u }),

      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      authOpen: false,
      authMode: "login",
      setAuthOpen: (open, mode) =>
        set({ authOpen: open, authMode: mode || get().authMode }),
      aiChatOpen: false,
      setAiChatOpen: (open) => set({ aiChatOpen: open }),
      aiMessages: [],
      addAiMessage: (m) => set((s) => ({ aiMessages: [...s.aiMessages, m] })),
      clearAiMessages: () => set({ aiMessages: [] }),

      savedAddress: null,
      setSavedAddress: (a) => set({ savedAddress: a }),
    }),
    {
      name: "rafaab-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        recentlyViewed: s.recentlyViewed,
        orderNumbers: s.orderNumbers,
        savedAddress: s.savedAddress,
        user: s.user,
        aiMessages: s.aiMessages,
      }),
    }
  )
);
