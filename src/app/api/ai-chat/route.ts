import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: string; content: string };

// Post-process AI responses to fix markdown formatting issues
function fixMarkdown(text: string): string {
  let result = text;

  // 1. Fix inline headings: "some text. ## Heading" -> "some text.\n\n## Heading"
  // Don't match when the preceding char is itself a # (avoids splitting ## into #\n\n#)
  result = result.replace(/([^#\n])\s+(#{1,3}\s)/g, "$1\n\n$2");

  // 2. Fix "text) ## Heading" -> "text)\n\n## Heading"
  result = result.replace(/(\))\s+(#{1,3}\s)/g, "$1\n\n$2");

  // 3. Fix "- text. ##" -> "- text.\n\n##"
  result = result.replace(/(-\s[^#\n]+?)\.\s+(#{1,3}\s)/g, "$1.\n\n$2");

  // 4. Ensure blank line before any heading that starts a line (but not at start of text)
  result = result.replace(/([^\n#\s])\n(#{1,3}\s)/g, "$1\n\n$2");

  // 5. Fix multiple headings on same line: "## A text ## B" -> "## A text\n\n## B"
  result = result.replace(/(#{1,3}\s[^\n#]+?)\s\s+(#{1,3}\s)/g, "$1\n\n$2");

  // 6. Fix jammed bullet items: "- A - B" -> "- A\n- B" (but not ranges like "1-2")
  result = result.replace(/(-\s[^\n-]+?)\s+(-\s[A-Z])/g, "$1\n$2");

  // 7. Remove em dashes and en dashes
  result = result.replace(/—/g, " - ").replace(/–/g, " - ");

  // 8. Clean up excessive blank lines (max 2)
  result = result.replace(/\n{3,}/g, "\n\n");

  // 9. Trim trailing whitespace per line
  result = result.split("\n").map((line) => line.trimEnd()).join("\n");

  return result.trim();
}

async function callLLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  // If an external API key is configured, use fetch to call the OpenAI-compatible API
  if (apiKey) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      // 401 or 403 = invalid/blocked API key
      if (res.status === 401 || res.status === 403) {
        throw new Error("INVALID_API_KEY");
      }
      // 404 = model not found
      if (res.status === 404 && errText.includes("does not exist")) {
        throw new Error(`Model "${model}" not found. Set AI_MODEL=llama-3.1-8b-instant in your .env file. Check https://console.groq.com/docs/models for valid names.`);
      }
      throw new Error(`API returned ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
  }

  // Fallback: try z-ai-web-dev-sdk (works in Z.ai sandbox)
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
    return completion.choices?.[0]?.message?.content || "I couldn't generate a response.";
  } catch {
    throw new Error("NO_LLM_CONFIGURED");
  }
}

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
- DO NOT use em dashes or en dashes. Use regular hyphens (-) or commas instead
- Use markdown formatting: **bold** for emphasis, - for bullet lists, ## for section headings
- ALWAYS put ## headings on their OWN LINE with a blank line before and after
- NEVER put # or ## inline with other text on the same line
- Make sure your response is complete and never cuts off mid-sentence

=== Rafaab Product Catalog ===
${catalogLines}
=== End Catalog ===`;

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  if (Array.isArray(history)) {
    for (const m of history.slice(-10)) {
      if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
        messages.push({ role: m.role, content: m.content });
      }
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const rawReply = await callLLM(messages);

    // Post-process the markdown to fix formatting issues
    const reply = fixMarkdown(rawReply);

    // Extract referenced product IDs and attach the full product objects so the UI can render chips
    const idMatches = [...reply.matchAll(/\[P:([^\]]+)\]/g)].map((m) => m[1].trim());
    const uniqueIds = Array.from(new Set(idMatches));
    const recommended = serialized.filter((p) => uniqueIds.includes(p.id)).slice(0, 4);

    // Strip the [P:...] markers from the displayed reply for clean text
    const cleanReply = reply.replace(/\[P:[^\]]+\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, recommended });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);

    // Invalid API key — give clear instructions
    if (errMsg === "INVALID_API_KEY") {
      return NextResponse.json({
        reply: "Your AI API key is invalid or expired. Here's how to fix it:\n\n1. Go to https://console.groq.com/keys\n2. Create a NEW API key (your old one may have expired)\n3. Copy the new key (starts with gsk_)\n4. Open your .env file and replace the old key:\n\nOPENAI_API_KEY=gsk_your_new_key_here\nOPENAI_BASE_URL=https://api.groq.com/openai/v1\nAI_MODEL=llama-3.1-8b-instant\n\n5. Save the file and restart your server (bun run dev)\n\nIf on Vercel: also update the OPENAI_API_KEY in Settings > Environment Variables, then redeploy.",
        recommended: [],
      }, { status: 200 });
    }

    // No LLM configured
    if (errMsg === "NO_LLM_CONFIGURED" || errMsg.includes("Configuration file not found")) {
      return NextResponse.json({
        reply: "Hi! I'm Rafi, your AI assistant.\n\nTo enable me, add a FREE Groq API key to your .env file:\n\n1. Go to https://console.groq.com/keys\n2. Create a free key\n3. Add these 3 lines to your .env:\n\nOPENAI_API_KEY=gsk_your_key_here\nOPENAI_BASE_URL=https://api.groq.com/openai/v1\nAI_MODEL=llama-3.1-8b-instant\n\n4. Restart your server and try again!",
        recommended: [],
      }, { status: 200 });
    }

    console.error("AI chat error:", errMsg);
    return NextResponse.json({
      reply: `I'm having trouble connecting right now. Error: ${errMsg.slice(0, 150)}`,
      recommended: [],
    }, { status: 200 });
  }
}
