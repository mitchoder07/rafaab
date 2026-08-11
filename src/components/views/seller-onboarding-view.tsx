"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Mail, Phone, Loader2, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Category, StoreData, SellerApplicationData } from "@/lib/types";

export function SellerOnboardingView() {
  const navigate = useStore((s) => s.navigate);
  const setAiChatOpen = useStore((s) => s.setAiChatOpen);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingStore, setExistingStore] = useState<StoreData | null>(null);
  const [application, setApplication] = useState<SellerApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    description: "",
    supportEmail: "",
    supportPhone: "",
    businessType: "individual",
  });

  useEffect(() => {
    apiGet<{ categories: Category[] }>("/api/categories").then((r) => setCategories(r.categories)).catch(() => {});
    apiGet<{ store: StoreData | null; application: SellerApplicationData | null }>("/api/seller/me")
      .then((r) => {
        setExistingStore(r.store);
        setApplication(r.application);
        if (r.store) {
          setForm((f) => ({
            ...f,
            storeName: r.store!.name,
            supportEmail: r.store!.supportEmail || "",
            supportPhone: r.store!.supportPhone || "",
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName || !form.supportEmail || !form.supportPhone) {
      toast.error("Store name, email and phone are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ application: SellerApplicationData; autoApproved?: boolean }>("/api/seller/apply", form);
      if (res.autoApproved) {
        toast.success("Application approved! Welcome to Rafaab Marketplace.");
        navigate({ name: "seller" });
      } else {
        toast.success("Application submitted! We'll review it within 1-2 business days.");
        setApplication(res.application);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" width={28} height={28} />
      </div>
    );
  }

  // If already has an approved store
  if (existingStore) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 width={48} height={48} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">You're already a seller!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your store "{existingStore.name}" is active.</p>
        <Button onClick={() => navigate({ name: "seller" })} className="mt-4 brand-gradient text-white">
          Go to Seller Dashboard <ArrowRight width={16} height={16} />
        </Button>
      </div>
    );
  }

  // If application is pending
  if (application && application.status === "pending") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Clock width={48} height={48} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">Application Under Review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your application for "{application.storeName}" is being reviewed. We'll notify you within 1-2 business days.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-left text-sm">
          <p><span className="font-semibold">Store:</span> {application.storeName}</p>
          <p><span className="font-semibold">Submitted:</span> {new Date(application.submittedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
          <p><span className="font-semibold">Status:</span> <span className="text-amber-600 font-semibold">Pending</span></p>
        </div>
        <Button onClick={() => navigate({ name: "home" })} variant="outline" className="mt-4">Back to Home</Button>
      </div>
    );
  }

  // If rejected, allow reapply
  const rejected = application && application.status === "rejected";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white">
            <Store width={28} height={28} />
          </span>
          <h1 className="text-2xl font-black sm:text-3xl">Become a Seller</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the Rafaab marketplace and reach thousands of customers.</p>
        </div>

        {rejected && (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            <p className="font-semibold text-destructive">Your previous application was rejected.</p>
            {application?.rejectionReason && <p className="mt-1 text-muted-foreground">Reason: {application.rejectionReason}</p>}
            <p className="mt-1">You can submit a new application below.</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Store Name *</label>
            <input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              placeholder="e.g. TechHub Nigeria"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">This will be your public store name customers see.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Store Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Tell customers what you sell..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Support Email *</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={16} height={16} />
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  placeholder="support@yourstore.com"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Support Phone *</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={16} height={16} />
                <input
                  value={form.supportPhone}
                  onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                  placeholder="+234 800 000 0000"
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Business Type</label>
            <div className="flex gap-2">
              {["individual", "sme", "corporate"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, businessType: t })}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium capitalize transition ${
                    form.businessType === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {t === "sme" ? "SME" : t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-semibold">Commission Structure</p>
            <p className="mt-1 text-muted-foreground">
              Rafaab charges a 10% commission on each sale. You receive 90% of each order's value, paid out to your bank account.
              Payouts are released when orders are marked "Delivered".
            </p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full brand-gradient text-white" size="lg">
            {submitting ? <Loader2 className="animate-spin" width={18} height={18} /> : <>Submit Application <ArrowRight width={16} height={16} /></>}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => setAiChatOpen(true)} className="text-xs text-muted-foreground hover:text-primary">
            Have questions? Ask Rafi AI →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
