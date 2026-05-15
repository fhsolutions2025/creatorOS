import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPrompt(type: string, context: unknown): string {
  if (type === "block_fill") {
    const blockType = context as string;
    const prompts: Record<string, string> = {
      hero: `Generate compelling hero section copy for a modern SaaS product. Return ONLY valid JSON with these exact keys: {"headline": "...", "subheadline": "...", "cta": "..."}. No other text.`,
      features: `Generate a features section for a modern SaaS product. Return ONLY valid JSON with these exact keys: {"title": "Features", "feature1": "...", "feature2": "...", "feature3": "..."}. Each feature should be 3-5 words. No other text.`,
      pricing: `Generate pricing tiers for a SaaS product. Return ONLY valid JSON with these exact keys: {"title": "Simple Pricing", "plan1": "Starter — $9/mo", "plan2": "Pro — $29/mo", "plan3": "Enterprise — Custom"}. Make the plan names creative. No other text.`,
      contact: `Generate contact form copy. Return ONLY valid JSON with these exact keys: {"title": "...", "placeholder": "...", "button": "..."}. No other text.`,
      text: `Generate an about/mission section for a tech company. Return ONLY valid JSON with these exact keys: {"heading": "...", "body": "..."}. Body should be 2-3 sentences. No other text.`,
      image: `Return ONLY valid JSON with these exact keys: {"src": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80", "alt": "Team collaboration"}. No other text.`,
    };
    return prompts[blockType] ?? `Generate content for a ${blockType} section. Return a JSON object with appropriate fields.`;
  }

  if (type === "workflow_describe") {
    const ctx = context as { trigger: string; actions: string[] };
    const trigger = ctx?.trigger ?? "no trigger";
    const actions: string[] = ctx?.actions ?? [];
    return `Describe this workflow in plain English, in 2-3 sentences. Be conversational and clear.

Trigger: ${trigger}
Actions (in order): ${actions.length > 0 ? actions.join(" → ") : "none"}

Explain what this workflow does, when it runs, and what it accomplishes for the user.`;
  }

  return `Generate helpful content for context: ${JSON.stringify(context)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, context } = body as { type: string; context: unknown };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(type, context);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const result = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI route error:", error);
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: error.status ?? 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
