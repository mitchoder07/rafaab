"use client";

import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatNaira } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotal = useStore((s) => s.cartSubtotal());
  const navigate = useStore((s) => s.navigate);

  const goCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setOpen(false);
    navigate({ name: "checkout" });
  };

  const shipping = subtotal >= 50000 || subtotal === 0 ? 0 : 2500;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart width={18} height={18} /> Your Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-muted">
              <ShoppingCart width={32} height={32} className="text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add some products to get started.</p>
            <Button
              onClick={() => {
                setOpen(false);
                navigate({ name: "catalog" });
              }}
              className="brand-gradient text-white"
            >
              Start Shopping <ArrowRight width={16} height={16} />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3">
              <div className="space-y-3">
                {cart.map((line) => {
                  const price = line.product.discountPrice ?? line.product.price;
                  return (
                    <div key={line.product.id} className="flex gap-3 rounded-xl border border-border bg-card p-2.5">
                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate({ name: "product", productId: line.product.id });
                        }}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        <img src={line.product.images[0]} alt={line.product.title} className="h-full w-full object-cover" />
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{line.product.title}</p>
                        <p className="text-xs text-muted-foreground">{line.product.brand}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{formatNaira(price)}</span>
                          {line.product.discountPrice && (
                            <span className="text-xs text-muted-foreground line-through">{formatNaira(line.product.price)}</span>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-1">
                          <div className="flex items-center rounded-lg border border-border">
                            <button
                              onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                              className="grid h-7 w-7 place-items-center text-muted-foreground transition hover:text-foreground"
                              aria-label="Decrease"
                            >
                              <Minus width={13} height={13} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                            <button
                              onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                              className="grid h-7 w-7 place-items-center text-muted-foreground transition hover:text-foreground"
                              aria-label="Increase"
                            >
                              <Plus width={13} height={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              removeFromCart(line.product.id);
                              toast("Removed from cart");
                            }}
                            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove"
                          >
                            <Trash2 width={15} height={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <SheetFooter className="border-t border-border p-4">
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? <span className="text-deal" style={{ color: "var(--deal)" }}>FREE</span> : formatNaira(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add {formatNaira(50000 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between border-t border-border pt-1.5 text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-primary">{formatNaira(subtotal + shipping)}</span>
                </div>
              </div>
              <Button onClick={goCheckout} className="w-full brand-gradient text-white hover:opacity-90" size="lg">
                Checkout <ArrowRight width={16} height={16} />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
