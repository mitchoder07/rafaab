"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, ShoppingBag, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

const SUGGESTIONS = [
  "I need a phone with a great camera under ₦200k",
  "Best headphones for working out?",
  "Gift ideas for my mom's birthday",
  "What's on flash sale today?",
];

export function AIChatWidget() {
  const open = useStore((s) => s.aiChatOpen);
  const setOpen = useStore((s) => s.setAiChatOpen);
  const messages = useStore((s) => s.aiMessages);
  const addAiMessage = useStore((s) => s.addAiMessage);
  const clearMessages = useStore((s) => s.clearAiMessages);
  const addToCart = useStore((s) => s.addToCart);
  const navigate = useStore((s) => s.navigate);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    addAiMessage({ role: "user", content: trimmed });
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await apiPost<{ reply: string; recommended: Product[] }>("/api/ai-chat", {
        message: trimmed,
        history,
      });
      addAiMessage({ role: "assistant", content: res.reply, products: res.recommended });
    } catch {
      addAiMessage({
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Open AI assistant"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full brand-gradient px-4 py-3.5 text-white shadow-2xl transition hover:scale-105 sm:bottom-6 sm:right-6"
          >
            <span className="relative">
              <Sparkles width={22} height={22} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-white" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="hidden font-bold sm:block">Ask Rafi</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-border bg-background shadow-2xl sm:bottom-5 sm:right-5 sm:h-[620px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-2xl sm:border"
          >
            {/* header */}
            <div className="flex items-center justify-between brand-gradient px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur">
                  <Sparkles width={18} height={18} />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight">Rafi</p>
                  <p className="text-[11px] text-white/85">AI Shopping Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    aria-label="Clear chat"
                    className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/20"
                  >
                    <RotateCcw width={15} height={15} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/20"
                >
                  <X width={18} height={18} />
                </button>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scroll-thin bg-muted/30 p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-3 grid h-16 w-16 place-items-center rounded-2xl brand-gradient text-white shadow-lg">
                    <Sparkles width={30} height={30} />
                  </span>
                  <h3 className="text-lg font-bold">Hi, I'm Rafi 👋</h3>
                  <p className="mt-1 max-w-[280px] text-sm text-muted-foreground">
                    Your personal AI shopping assistant. Ask me to find products, compare options, or get recommendations.
                  </p>
                  <div className="mt-4 w-full space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm transition hover:border-primary hover:bg-primary/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "brand-gradient text-white"
                          : "border border-border bg-card text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.products.map((p) => {
                          const price = p.discountPrice ?? p.price;
                          return (
                            <div
                              key={p.id}
                              className="flex gap-2.5 rounded-xl border border-border bg-card p-2"
                            >
                              <button
                                onClick={() => {
                                  navigate({ name: "product", productId: p.id });
                                  setOpen(false);
                                }}
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                              >
                                <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                              </button>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <button
                                  onClick={() => {
                                    navigate({ name: "product", productId: p.id });
                                    setOpen(false);
                                  }}
                                  className="line-clamp-2 text-left text-xs font-medium hover:text-primary"
                                >
                                  {p.title}
                                </button>
                                <div className="mt-0.5 flex items-center gap-1">
                                  <StarRating rating={p.rating} size={10} />
                                  <span className="text-[10px] text-muted-foreground">({p.numReviews})</span>
                                </div>
                                <div className="mt-auto flex items-center justify-between pt-1">
                                  <span className="text-sm font-bold text-primary">{formatNaira(price)}</span>
                                  <button
                                    onClick={() => addToCart(p, 1)}
                                    className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingBag width={13} height={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm">
                    <Loader2 width={14} height={14} className="animate-spin text-primary" />
                    <span className="text-muted-foreground">Rafi is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="border-t border-border bg-background p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Rafi anything..."
                  className="h-11 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="h-11 w-11 shrink-0 rounded-full brand-gradient text-white hover:opacity-90"
                >
                  {loading ? <Loader2 className="animate-spin" width={17} height={17} /> : <Send width={17} height={17} />}
                </Button>
              </form>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Rafi can make mistakes. Verify product details before purchasing.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
