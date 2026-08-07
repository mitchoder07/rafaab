import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

function smartCatalogAssistant(message: string, products: ReturnType<typeof serializeProduct>[]) {
  const q = message.toLowerCase();

  // 1. Check FAQ & policy topics first
  if (q.includes("shipping") || q.includes("delivery") || q.includes("free shipping") || q.includes("how long")) {
    return {
      reply:
        "We offer FREE express shipping across Nigeria on orders over ₦50,000! Standard delivery takes 1–4 business days in Lagos and Abuja, or 3–5 days nationwide. All shipments are fully insured and trackable.",
      recommended: [],
    };
  }
  if (q.includes("return") || q.includes("refund") || q.includes("exchange")) {
    return {
      reply:
        "Rafaab offers a 7-day hassle-free return and exchange policy! If you're not 100% satisfied with your order, return it in original condition for a fast replacement or full refund.",
      recommended: [],
    };
  }
  if (q.includes("coupon") || q.includes("promo") || q.includes("discount code") || q.includes("voucher")) {
    return {
      reply:
        "You can use promo code RAFAAB10 at checkout to enjoy an instant 10% discount on your entire order! Combine it with our flash sale deals for maximum savings.",
      recommended: [],
    };
  }
  if (q.includes("contact") || q.includes("support") || q.includes("phone number") || q.includes("email")) {
    return {
      reply:
        "You can reach our customer support team 24/7 at support@rafaab.com or call us at +234 800 111 2222. Or ask me anything right here—I'm always ready to help!",
      recommended: [],
    };
  }

  // 2. Extract price limit if present (e.g., "under 200k", "under 500,000")
  let maxPrice: number | undefined;
  const underMatch = q.match(/(?:under|below|less than|<|budget of)?\s*(?:₦|n|naira)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m|thousand|million)?/i);
  if (underMatch && underMatch[1]) {
    const rawNum = parseFloat(underMatch[1].replace(/,/g, ""));
    const unit = underMatch[2]?.toLowerCase();
    if (unit === "k" || unit === "thousand" || rawNum < 1000) {
      maxPrice = rawNum * (unit ? 1000 : rawNum < 1000 ? 1000 : 1);
    } else if (unit === "m" || unit === "million") {
      maxPrice = rawNum * 1000000;
    } else {
      maxPrice = rawNum;
    }
  }

  // 3. Match categories or keywords
  let filtered = [...products];

  if (
    q.includes("phone") ||
    q.includes("smartphone") ||
    q.includes("camera") ||
    q.includes("iphone") ||
    q.includes("samsung") ||
    q.includes("mobile") ||
    q.includes("tablet")
  ) {
    filtered = filtered.filter(
      (p) =>
        p.category?.slug === "phones-tablets" ||
        p.title.toLowerCase().includes("phone") ||
        p.title.toLowerCase().includes("camera") ||
        p.tags?.some((t) => t.toLowerCase().includes("phone"))
    );
  } else if (
    q.includes("headphone") ||
    q.includes("earbud") ||
    q.includes("speaker") ||
    q.includes("audio") ||
    q.includes("music") ||
    q.includes("sound") ||
    q.includes("workout") ||
    q.includes("gym")
  ) {
    filtered = filtered.filter(
      (p) =>
        p.category?.slug === "electronics" ||
        p.title.toLowerCase().includes("headphone") ||
        p.title.toLowerCase().includes("earbud") ||
        p.title.toLowerCase().includes("speaker") ||
        p.tags?.some((t) => t.toLowerCase().includes("audio") || t.toLowerCase().includes("sound"))
    );
  } else if (
    q.includes("fashion") ||
    q.includes("shirt") ||
    q.includes("shoe") ||
    q.includes("sneaker") ||
    q.includes("watch") ||
    q.includes("dress") ||
    q.includes("bag")
  ) {
    filtered = filtered.filter(
      (p) =>
        p.category?.slug === "fashion" ||
        p.title.toLowerCase().includes("watch") ||
        p.title.toLowerCase().includes("sneaker")
    );
  } else if (
    q.includes("home") ||
    q.includes("kitchen") ||
    q.includes("blender") ||
    q.includes("sofa") ||
    q.includes("chair") ||
    q.includes("cook")
  ) {
    filtered = filtered.filter((p) => p.category?.slug === "home-kitchen");
  } else if (q.includes("beauty") || q.includes("skin") || q.includes("perfume") || q.includes("makeup") || q.includes("health")) {
    filtered = filtered.filter((p) => p.category?.slug === "beauty-health");
  } else if (q.includes("gift") || q.includes("mom") || q.includes("dad") || q.includes("birthday") || q.includes("present")) {
    filtered = filtered.filter((p) => p.rating >= 4.7 || p.isBestSeller || p.isFeatured);
  } else if (q.includes("flash") || q.includes("sale") || q.includes("deal") || q.includes("discount") || q.includes("cheap")) {
    filtered = filtered.filter((p) => p.isFlashSale || (p.discountPrice && p.discountPrice < p.price));
  } else {
    // Check if user query matches any product title/brand/tag directly
    const keywordMatches = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags?.some((t) => q.includes(t.toLowerCase()))
    );
    if (keywordMatches.length > 0) {
      filtered = keywordMatches;
    }
  }

  // 4. Apply price filter if detected
  if (maxPrice && maxPrice > 0) {
    const priceFiltered = filtered.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
    if (priceFiltered.length > 0) {
      filtered = priceFiltered;
    }
  }

  // 5. Sort by soldCount & rating
  filtered.sort((a, b) => b.soldCount * b.rating - a.soldCount * a.rating);
  const recommended = filtered.slice(0, 4);

  if (recommended.length === 0) {
    const bestsellers = products.filter((p) => p.isBestSeller || p.soldCount > 50).slice(0, 4);
    return {
      reply:
        "I couldn't find an exact match for that specific price or category, but here are Rafaab's top-rated bestsellers that customers love! You can also browse our full catalog using the filters on the left.",
      recommended: bestsellers,
    };
  }

  const names = recommended
    .map((p) => `• ${p.title} (₦${Math.round(p.discountPrice ?? p.price).toLocaleString()})`)
    .join("\n");

  return {
    reply: `Here are our top recommendations matching your search on Rafaab:\n${names}\n\nClick any product card below to inspect specs, read customer reviews, or add directly to your cart!`,
    recommended,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { message, history } = body as { message: string; history?: { role: string; content: string }[] };

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Build a compact catalog snapshot so the AI can recommend real products
  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { soldCount: "desc" },
  });
  const serialized = products.map(serializeProduct);
  const catalogLines = serialized
    .map((p) => {
      const price = p.discountPrice ?? p.price;
      const cat = p.category?.name || "General";
      return `[P:${p.id}] ${p.title} — ₦${Math.round(price).toLocaleString()}${p.discountPrice ? ` (was ₦${Math.round(p.price).toLocaleString()})` : ""} — ${cat} — ${p.brand}${p.isFlashSale ? " — FLASH SALE" : ""}`;
    })
    .join("\n");

  const systemPrompt = `You are Rafi, Rafaab's AI Shopping Assistant on a Nigerian e-commerce marketplace (all prices in Naira, ₦). You help customers discover products, compare options, and make confident buying decisions.

Be warm, concise and genuinely helpful. Keep replies under 120 words. Use bullet points when listing options.

When you recommend a product, ALWAYS reference it using the exact marker format [P:PRODUCT_ID] immediately after its name, e.g. "The Rafaab Phone Pro Max [P:abc123] is perfect for photography." You may mention several products. Only recommend products from the catalog below — never invent products or IDs.

If asked about orders, shipping, returns or accounts, give brief helpful guidance (Rafaab offers free shipping over ₦50,000, 7-day returns, and a RAFAAB10 coupon for 10% off). If a question is unrelated to shopping, gently steer back to helping them shop.

=== Rafaab Product Catalog ===
${catalogLines}
=== End Catalog ===`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];
  if (Array.isArray(history)) {
    for (const m of history.slice(-8)) {
      if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
        messages.push({ role: m.role, content: m.content });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
    // Dynamic import keeps the SDK out of edge/telemetry bundling paths
    const ZAIModule = await import("z-ai-web-dev-sdk");
    const ZAI = (ZAIModule as { default: { create: () => Promise<unknown> } }).default ?? (ZAIModule as unknown as { create: () => Promise<unknown> });
    const zai = await ZAI.create();
    const completion = await (
      zai as {
        chat: {
          completions: {
            create: (args: unknown) => Promise<{ choices: { message: { content: string } }[] }>;
          };
        };
      }
    ).chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Could you rephrase that?";

    // Extract referenced product IDs and attach the full product objects so the UI can render chips
    const idMatches = [...reply.matchAll(/\[P:([^\]]+)\]/g)].map((m) => m[1].trim());
    const uniqueIds = Array.from(new Set(idMatches));
    const recommended = serialized.filter((p) => uniqueIds.includes(p.id)).slice(0, 4);

    // Strip the [P:...] markers from the displayed reply for clean text
    const cleanReply = reply.replace(/\[P:[^\]]+\]/g, "").replace(/\s{2,}/g, " ").trim();

    return NextResponse.json({ reply: cleanReply, recommended });
  } catch (err) {
    console.error("AI chat fallback to SmartCatalogAssistant due to:", err);
    const fallback = smartCatalogAssistant(message, serialized);
    return NextResponse.json(fallback, { status: 200 });
  }
}
