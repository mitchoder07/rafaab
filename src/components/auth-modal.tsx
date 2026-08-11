"use client";

import { useState } from "react";
import { Sparkles, Mail, Lock, User, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AuthModal() {
  const open = useStore((s) => s.authOpen);
  const mode = useStore((s) => s.authMode);
  const setAuthOpen = useStore((s) => s.setAuthOpen);
  const setUser = useStore((s) => s.setUser);
  const setAiChatOpen = useStore((s) => s.setAiChatOpen);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email, password } : { name, email, password };
      const res = await apiPost<{ user: { id: string; name: string; email: string; avatar: string | null; phone: string | null; role?: string } }>(endpoint, body);
      setUser(res.user);
      toast.success(isLogin ? `Welcome back, ${res.user.name.split(" ")[0]}!` : "Account created!");
      setAuthOpen(false);
      setPassword("");
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@rafaab.com");
    setPassword("demo1234");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setAuthOpen(o)}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="brand-gradient px-6 py-8 text-center text-white">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <Sparkles width={24} height={24} />
          </span>
          <h2 className="text-2xl font-black">{isLogin ? "Welcome back" : "Join Rafaab"}</h2>
          <p className="mt-1 text-sm text-white/90">
            {isLogin ? "Sign in to track orders and checkout faster" : "Create an account to start shopping smarter"}
          </p>
        </div>

        <div className="p-6">
          {/* toggle */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setAuthOpen(true, "login")}
              className={`rounded-md py-2 text-sm font-semibold transition ${isLogin ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthOpen(true, "register")}
              className={`rounded-md py-2 text-sm font-semibold transition ${!isLogin ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={17} height={17} />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={17} height={17} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={17} height={17} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full brand-gradient text-white hover:opacity-90">
              {loading ? <Loader2 className="animate-spin" width={18} height={18} /> : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Try the demo account:</p>
              <p className="text-sm font-semibold">demo@rafaab.com · demo1234</p>
              <button onClick={fillDemo} className="mt-1 text-xs font-semibold text-primary hover:underline">
                Auto-fill credentials
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to Rafaab's Terms & Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
