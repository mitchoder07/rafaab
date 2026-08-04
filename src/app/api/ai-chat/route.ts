import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    console.error("AI chat error:", err);
    return NextResponse.json(
      { reply: "I'm having trouble connecting right now. Please try again in a moment.", recommended: [] },
      { status: 200 }
    );
  }
}
