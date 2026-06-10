import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ReplyRequestSchema, ReplyResponse } from "@/lib/review-types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/review-prompt";
import { generateMockReply } from "@/lib/review-mock";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

/** Claudeに構造化出力で返してもらうスキーマ */
const AiOutputSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  needsEscalation: z.boolean(),
  escalationReason: z.string().optional(),
  replies: z.array(z.object({ body: z.string() })).min(1),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const json = await request.json();
    parsed = ReplyRequestSchema.parse(json);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力値が不正です", details: err.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 },
    );
  }

  const hasKey = Boolean(process.env.AI_GATEWAY_API_KEY);

  // APIキーが無ければモック生成で即応答
  if (!hasKey) {
    return NextResponse.json(generateMockReply(parsed));
  }

  const model = process.env.MEO_GENERATION_MODEL || DEFAULT_MODEL;

  try {
    const { generateObject } = await import("ai");
    const { object } = await generateObject({
      model,
      schema: AiOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(parsed),
      temperature: 0.6,
    });

    const response: ReplyResponse = {
      sentiment: object.sentiment,
      needsEscalation: object.needsEscalation,
      escalationReason: object.escalationReason,
      replies: object.replies.slice(0, parsed.count).map((r) => ({
        body: r.body.trim(),
        charCount: [...r.body.trim()].length,
      })),
      source: "ai",
      model,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[reply] AI生成に失敗、モックにフォールバック:", err);
    return NextResponse.json(generateMockReply(parsed));
  }
}
