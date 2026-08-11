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

  // Build a compact catalog snapshot so Rafi can recommend real products when relevant
  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { soldCount: "desc" },
    take: 60,
  });
  const serialized = products.map(serializeProduct);
  const catalogLines = serialized
    .map((p) => {
      const price = p.discountPrice ?? p.price;
      const cat = p.category?.name || "General";
      return `[P:${p.id}] ${p.title} — ₦${Math.round(price).toLocaleString()}${p.discountPrice ? ` (was ₦${Math.round(p.price).toLocaleString()})` : ""} — ${cat} — ${p.brand}${p.isFlashSale ? " — FLASH SALE" : ""}`;
    })
    .join("\n");

  const systemPrompt = `You are Rafi, the AI assistant for Rafaab (a Nigerian e-commerce marketplace). You are highly capable, knowledgeable, and friendly — similar to ChatGPT or Claude. You can help with ANY topic, not just shopping.

## YOUR CAPABILITIES
You can answer questions about:
- **Shopping & Rafaab**: Product recommendations, comparisons, order tracking, shipping, returns, payments, seller accounts
- **General knowledge**: Science, history, geography, current events, culture, arts, literature
- **Technology**: Programming, web development, AI, gadgets, software, how things work
- **Advice**: Life advice, career guidance, relationship tips, health & wellness (general info only, not medical diagnosis)
- **Education**: Math, physics, chemistry, biology, languages, study tips
- **Business**: Entrepreneurship, marketing, finance basics, starting a business in Nigeria
- **Daily life**: Cooking recipes, travel tips, home improvement, fashion advice
- **Creative**: Writing, brainstorming, ideas, content creation
- And anything else that's legal and safe

## SAFETY GUARDRAILS (STRICT)
You MUST NOT help with:
- Anything illegal under Nigerian or international law (fraud, hacking, weapons, drugs, etc.)
- Generating malware, phishing, or cyberattack instructions
- Creating content that sexualizes minors
- Instructions for violence, terrorism, or self-harm
- Medical diagnosis or prescribing medication (suggest seeing a doctor instead)
- Legal advice (suggest consulting a lawyer)
- Deepfakes or impersonation for deception
- Circumventing security, DRM, or authentication systems

If a user asks for something illegal or unsafe, politely decline and explain why, then offer a legal alternative if possible.

## PRODUCT RECOMMENDATIONS
When a user asks about shopping, products, gifts, or anything where a Rafaab product would be relevant, recommend products using the exact marker format [P:PRODUCT_ID] immediately after the product name. Example: "The Rafaab Phone Pro Max [P:abc123] is perfect for photography."

Only recommend products from the catalog below — never invent products or IDs. If no products match, you can still give general advice.

## RAFAAB POLICIES (when asked)
- Free shipping on orders over ₦50,000
- 7-day returns policy
- Coupon code RAFAAB10 gives 10% off your first order
- Payment methods: Card (via Paystack), Bank Transfer, Cash on Delivery
- Delivery takes 1-3 business days nationwide
- Sellers earn 90% of each sale (10% platform commission)
- Payouts released when orders are delivered

## COMMUNICATION STYLE
- Be warm, conversational, and genuinely helpful
- Use clear, well-structured responses with paragraphs or bullet points where appropriate
- Be concise for simple questions, thorough for complex ones
- Use Nigerian English context when relevant (Naira pricing, local references)
- When you don't know something, say so honestly rather than making things up
- For code/technical questions, you can include code snippets

=== Rafaab Product Catalog ===
${catalogLines}
=== End Catalog ===`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];
  if (Array.isArray(history)) {
    for (const m of history.slice(-10)) {
      if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
        messages.push({ role: m.role, content: m.content });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
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
