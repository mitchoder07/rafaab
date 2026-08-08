import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

type Product = ReturnType<typeof serializeProduct>;
type ChatHistory = { role: string; content: string }[];
type AssistantResponse = { reply: string; recommended: Product[] };

const pick = <T,>(items: T[], count = 4) => items.slice(0, count);

const productPrice = (product: Product) => product.discountPrice ?? product.price;

const formatPrice = (price: number) => `₦${Math.round(price).toLocaleString()}`;

function normalize(message: string) {
  return message
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s₦.,kmt]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function isGreeting(text: string) {
  return /^(?:hi+|hello+|hey+|how far|good morning|good afternoon|good evening|yo+|hiya|sannu|kedu)\b/.test(text);
}

function looksLikeShoppingIntent(text: string) {
  return hasAny(text, [
    "buy", "want", "need", "looking for", "recommend", "suggest", "find", "show", "shop",
    "product", "item", "gift", "price", "cheap", "affordable", "budget", "under", "below",
    "best", "top", "deal", "sale", "discount", "phone", "laptop", "headphone", "sneaker",
    "coffee", "dress", "watch", "air fryer", "camera", "makeup", "yoga", "dumbbell", "toy",
  ]);
}

function parsePriceLimit(message: string) {
  // Handles: under 200k, below ₦150,000, less than 50k, budget of 20k, <100k, etc.
  const match = message.match(
    /(?:under|below|less than|cheaper than|not above|max(?:imum)?(?: of)?|budget(?: of)?|up to|<|₦)?\s*([₦n]?\s*\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)?\b/i
  );

  if (!match) return undefined;

  const rawNumber = parseFloat(match[1].replace(/[₦n,\s]/g, ""));
  if (!Number.isFinite(rawNumber) || rawNumber <= 0) return undefined;

  const unit = match[2]?.toLowerCase();
  const hasExplicitCue = /under|below|less than|cheaper than|not above|max|budget|up to|<|₦|naira/i.test(message);

  // A bare number is only treated as a budget when it is not glued to letters
  // (e.g. "RAFAAB10" should not become ₦10).
  if (!hasExplicitCue && (!match[2] || /[a-z]/i.test(match[2]))) return undefined;

  if (unit === "m" || unit === "million") return rawNumber * 1_000_000;
  if (unit === "k" || unit === "thousand") return rawNumber * 1_000;
  if (rawNumber < 1000 && /budget|under|below|less than|<|up to|max/.test(message)) return rawNumber * 1_000;
  return rawNumber;
}

function rankProducts(products: Product[], keywords: string[], categorySlugs: string[] = []) {
  const scored = products
    .filter((product) => product.stock > 0 || true)
    .map((product) => {
      const title = product.title.toLowerCase();
      const brand = product.brand.toLowerCase();
      const category = product.category?.slug ?? "";
      const tags = (product.tags ?? []).map((tag) => tag.toLowerCase());
      const haystack = `${title} ${brand} ${category} ${tags.join(" ")} ${product.description?.toLowerCase() ?? ""}`;

      let score = 0;
      score += product.isBestSeller ? 7 : 0;
      score += product.isFeatured ? 4 : 0;
      score += product.isFlashSale ? 3 : 0;
      score += Math.min(product.rating * 2, 10);
      score += Math.min(Math.log10(product.soldCount + 1) * 2, 8);

      if (categorySlugs.includes(category)) score += 20;
      for (const keyword of keywords) {
        if (title.includes(keyword)) score += 14;
        else if (brand.includes(keyword)) score += 10;
        else if (tags.some((tag) => tag.includes(keyword))) score += 8;
        else if (category.includes(keyword)) score += 6;
        else if (haystack.includes(keyword)) score += 4;
      }

      return { product, score };
    })
    .sort((a, b) => b.score - a.score || b.product.soldCount - a.product.soldCount);

  const hasSignal = scored.some(({ score }) => score > 22);
  return hasSignal ? scored.filter(({ score }) => score > 22).map(({ product }) => product) : [];
}

function getKeywords(message: string) {
  const dictionary: Record<string, string[]> = {
    "phones-tablets": [
      "phone", "phones", "smartphone", "iphone", "samsung", "galaxy", "android", "tablet", "ipad",
      "mobile", "selfie", "camera phone",
    ],
    electronics: [
      "headphone", "headphones", "earbud", "earbuds", "airpod", "speaker", "speakers", "audio",
      "sound", "tv", "television", "keyboard", "laptop", "computer", "monitor", "gaming", "gadget",
      "electronics", "smart watch", "smartwatch", "action camera",
    ],
    fashion: [
      "fashion", "shirt", "jacket", "dress", "cloth", "clothes", "outfit", "sneaker", "sneakers",
      "shoe", "shoes", "bag", "bags", "watch", "watches", "sunglasses", "style", "wear",
    ],
    "home-kitchen": [
      "home", "house", "kitchen", "cookware", "cooking", "blender", "air fryer", "fryer", "coffee maker",
      "sheet", "bedding", "sofa", "chair", "appliance", "utensils",
    ],
    "beauty-health": [
      "beauty", "skin", "skincare", "serum", "makeup", "eyeshadow", "perfume", "fragrance", "hair",
      "dryer", "health", "glow", "cosmetics",
    ],
    "sports-outdoors": [
      "sport", "sports", "gym", "workout", "fitness", "yoga", "mat", "dumbbell", "dumbbells",
      "camping", "tent", "outdoor", "exercise",
    ],
    "toys-games": [
      "toy", "toys", "game", "games", "kids", "kid", "children", "block", "blocks", "rc car",
      "remote car", "play",
    ],
    groceries: [
      "grocery", "groceries", "food", "coffee", "beans", "arabica", "espresso", "ground coffee",
      "drink", "beverage", "pantry",
    ],
  };

  const tokens = new Set(message.split(/\s+/).filter(Boolean));
  const matchedSlugs = new Set<string>();
  const matchedKeywords = new Set<string>();

  for (const [slug, keywords] of Object.entries(dictionary)) {
    for (const keyword of keywords) {
      if (message.includes(keyword) || tokens.has(keyword)) {
        matchedSlugs.add(slug);
        matchedKeywords.add(keyword);
      }
    }
  }

  return { categorySlugs: [...matchedSlugs], keywords: [...matchedKeywords] };
}

function formatProductList(products: Product[]) {
  return products
    .map((product, index) => `${index + 1}. ${product.title} — ${formatPrice(productPrice(product))}`)
    .join("\n");
}

function policyResponse(text: string): AssistantResponse | null {
  if (hasAny(text, ["shipping", "delivery", "deliver", "how long", "when will", "ship"])) {
    return {
      reply:
        "Quick delivery, no stress! 🚚 Rafaab delivers in 1–4 business days in Lagos/Abuja and 3–5 business days nationwide. Orders over ₦50,000 ship free, and every order is trackable.",
      recommended: [],
    };
  }

  if (hasAny(text, ["return", "refund", "exchange", "collect"])) {
    return {
      reply:
        "Of course — we’ve got you. Rafaab offers a 7-day hassle-free return/exchange window. Just keep the item in its original condition, and support can arrange a replacement or refund.",
      recommended: [],
    };
  }

  if (hasAny(text, ["coupon", "promo", "discount code", "voucher", "coupon code"])) {
    return {
      reply:
        "Lucky you! 🎉 Use code RAFAAB10 at checkout for 10% off your order. You can also check the flash-sale section for extra discounts.",
      recommended: [],
    };
  }

  if (hasAny(text, ["pay", "payment", "paystack", "card", "transfer", "atm"])) {
    return {
      reply:
        "Payment is easy and secure. You can pay with card, bank transfer, or other supported options through Paystack at checkout.",
      recommended: [],
    };
  }

  if (hasAny(text, ["contact", "support", "customer care", "phone number", "email", "whatsapp", "call"])) {
    return {
      reply:
        "You can reach Rafaab support anytime at support@rafaab.com or +234 800 111 2222. I can also help with products, shipping, returns, discounts, and orders right here.",
      recommended: [],
    };
  }

  if (hasAny(text, ["track order", "track my order", "where is my order", "order status"])) {
    return {
      reply:
        "You can track your order from the Orders section after logging in. If it just shipped, allow a little time for the courier’s status to update.",
      recommended: [],
    };
  }

  return null;
}

function conversationalResponse(text: string, products: Product[]): AssistantResponse | null {
  if (isGreeting(text)) {
    const name = hasAny(text, ["how far", "sannu", "kedu"]) ? "My guy" : "Hi";
    return {
      reply:
        `${name}! 👋 I'm Rafi, your Rafaab shopping plug. What are you looking for today? I can suggest phones, fashion, home items, gifts, flash-sale deals, or answer shipping/payment questions.`,
      recommended: [],
    };
  }

  if (hasAny(text, ["how are you", "how you doing", "how far you", "what's up", "whats up", "how body"])) {
    return {
      reply:
        "I'm doing great and ready to help you find something nice! 😊 Want me to recommend bestsellers, a gift, or something within a budget?",
      recommended: [],
    };
  }

  if (hasAny(text, ["thank", "thanks", "thank you", "appreciate", "nagode", "imela"])) {
    return {
      reply: "You’re welcome! 💛 If you need more options or want me to compare products, just say the word.",
      recommended: [],
    };
  }

  if (hasAny(text, ["bye", "goodbye", "see you", "see ya", "later"])) {
    return {
      reply: "Bye for now! Come back whenever you want great deals. Happy shopping! 🛍️",
      recommended: [],
    };
  }

  if (hasAny(text, ["who are you", "your name", "what can you do", "help me", "what do you do"])) {
    return {
      reply:
        "I'm Rafi, Rafaab’s friendly shopping assistant. I can recommend products, find budget-friendly deals, explain shipping/returns, share discounts, and help you compare items. What do you feel like buying?",
      recommended: [],
    };
  }

  if (hasAny(text, ["you are stupid", "you're stupid", "useless", "rubbish", "annoying", "bad assistant", "hate you"])) {
    return {
      reply:
        "I’m sorry about that — no excuse for a poor experience. Let me make it easier: tell me what you need or your budget, and I’ll give useful options instead of a generic reply.",
      recommended: pick(products.filter((p) => p.isBestSeller || p.isFeatured), 4),
    };
  }

  if (hasAny(text, ["not working", "isn't working", "isnt working", "same reply", "same response", "broken"])) {
    return {
      reply:
        "Sorry about that! I’m designed to chat about more than just product links. Try: ‘Best headphones under ₦150k’, ‘Gift for my mom’, ‘What’s on flash sale?’, or ask about shipping and payments.",
      recommended: [],
    };
  }

  if (hasAny(text, ["joke", "laugh", "funny"])) {
    return {
      reply:
        "Why did the shopper bring a ladder to Rafaab? Because they heard the deals were sky-high! 😄 Okay, back to business — what should I find for you?",
      recommended: [],
    };
  }

  return null;
}

function catalogResponse(message: string, products: Product[]): AssistantResponse {
  const maxPrice = parsePriceLimit(message);
  const { categorySlugs, keywords } = getKeywords(message);
  let matches = rankProducts(products, keywords, categorySlugs);
  let intentNote = "";

  if (matches.length === 0 && hasAny(message, ["gift", "mom", "mum", "dad", "birthday", "present", "someone"])) {
    matches = products.filter((p) => p.rating >= 4.6 || p.isBestSeller || p.isFeatured);
    intentNote = "Here are some crowd-pleasing gift ideas";
  } else if (matches.length === 0 && hasAny(message, ["flash", "sale", "deal", "discount", "cheap", "affordable", "bestseller", "best seller", "popular"])) {
    matches = products.filter((p) => p.isFlashSale || (p.discountPrice && p.discountPrice < p.price) || p.isBestSeller);
    intentNote = "Here are some sweet deals";
  } else if (matches.length === 0 && looksLikeShoppingIntent(message)) {
    matches = products.filter((p) => p.isBestSeller || p.isFeatured || p.soldCount > 50);
    intentNote = "I don’t have an exact match yet, but these popular picks are worth seeing";
  }

  if (maxPrice) {
    const withinBudget = matches.filter((p) => productPrice(p) <= maxPrice);
    if (withinBudget.length > 0) {
      matches = withinBudget;
      intentNote = `For ${formatPrice(maxPrice)} or below, these look good`;
    }
  }

  const recommended = pick(
    matches.sort((a, b) => b.soldCount * b.rating - a.soldCount * a.rating),
    4
  );

  if (recommended.length === 0) {
    return {
      reply:
        "I hear you! I don’t want to spam unrelated products. Tell me the category, who it’s for, or your budget — for example, ‘headphones under ₦150k’ or ‘a birthday gift for my mom’.",
      recommended: [],
    };
  }

  const opener = intentNote || "Nice choice — here are my top picks";
  return {
    reply: `${opener}:\n\n${formatProductList(recommended)}\n\nTap any card below to view specs/reviews or add it to cart. Want me to narrow it by budget, brand, or category?`,
    recommended,
  };
}

function smartCatalogAssistant(message: string, products: Product[]): AssistantResponse {
  const normalized = normalize(message);

  // 1. Human-like replies first, so greetings/thanks/complaints don't become product dumps.
  const chat = conversationalResponse(normalized, products);
  if (chat) return chat;

  // 2. Helpful policy answers.
  const policy = policyResponse(normalized);
  if (policy) return policy;

  // 3. Only recommend products when the message is actually shopping-related.
  if (looksLikeShoppingIntent(normalized)) {
    return catalogResponse(normalized, products);
  }

  // 4. Polite fallback for unrelated questions.
  return {
    reply:
      "I like where your head’s at, but I’m Rafaab’s shopping assistant — not a general know-it-all 😄. I can help find products, gifts, deals, or explain shipping, payments, discounts and returns. What are you shopping for?",
    recommended: [],
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { message, history } = body as { message: string; history?: ChatHistory };

  if (!message || typeof message !== "string" || !message.trim()) {
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

  const systemPrompt = `You are Rafi, Rafaab's friendly AI Shopping Assistant on a Nigerian e-commerce marketplace (all prices in Naira, ₦).

Your personality: warm, jovial, polite, concise, and genuinely helpful. Greet people naturally and never answer every message with the same product list.

Rules:
- If the user says hi, hello, thanks, asks who you are, jokes, or complains, respond naturally as a friendly assistant.
- Only recommend products when the user is clearly looking for something to buy, asks for recommendations, asks about deals/gifts, or asks what is available.
- If the question is unrelated to Rafaab/shopping, respond politely and gently steer them back to shopping. Do not invent products.
- If asked about orders, shipping, returns or accounts, give brief helpful guidance: free shipping over ₦50,000, 1–4 business days in Lagos/Abuja, 3–5 days nationwide, 7-day returns, Paystack payments, and RAFAAB10 for 10% off.
- Keep replies under 120 words. Use bullet points or numbered lists when listing products.

When you recommend a product, ALWAYS reference it using the exact marker format [P:PRODUCT_ID] immediately after its name, e.g. "The Rafaab Phone Pro Max [P:abc123] is great for photos." Only recommend products from the catalog below — never invent products or IDs.

=== Rafaab Product Catalog ===
${catalogLines}
=== End Catalog ===`;

  const messages: { role: string; content: string }[] = [{ role: "system", content: systemPrompt }];
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
    const ZAI =
      (ZAIModule as { default?: { create: () => Promise<unknown> } }).default ??
      (ZAIModule as unknown as { create: () => Promise<unknown> });
    const zai = await ZAI.create();
    const completion = await (
      zai as {
        chat: {
          completions: {
            create: (args: unknown) => Promise<{ choices?: { message?: { content?: string } }[] }>;
          };
        };
      }
    ).chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty AI response");
    }

    // Extract referenced product IDs and attach full product objects so the UI can render cards.
    const idMatches = [...reply.matchAll(/\[P:([^\]]+)\]/g)].map((m) => m[1].trim());
    const uniqueIds = Array.from(new Set(idMatches));
    const recommended = serialized.filter((p) => uniqueIds.includes(p.id)).slice(0, 4);
    const cleanReply = reply.replace(/\[P:[^\]]+\]/g, "").replace(/\s{2,}/g, " ").trim();

    // Safety net: if the AI somehow ignores a pure greeting and dumps products anyway,
    // use the deterministic assistant so users don't get the same canned list.
    const normalized = normalize(message);
    if (
      recommended.length > 0 &&
      (isGreeting(normalized) || hasAny(normalized, ["thank", "how are you", "who are you", "bye"])) &&
      !looksLikeShoppingIntent(normalized)
    ) {
      return NextResponse.json(conversationalResponse(normalized, serialized) ?? { reply: cleanReply, recommended: [] });
    }

    return NextResponse.json({ reply: cleanReply, recommended });
  } catch (err) {
    console.error("AI chat fallback to SmartCatalogAssistant due to:", err);
    return NextResponse.json(smartCatalogAssistant(message, serialized), { status: 200 });
  }
}
