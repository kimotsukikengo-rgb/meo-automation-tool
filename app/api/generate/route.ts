import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GenerateRequestSchema,
  GenerateResponse,
  PostVariation,
} from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { generateMockVariations } from "@/lib/mock-generator";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

/** Claudeに構造化出力で返してもらうスキーマ */
const AiOutputSchema = z.object({
  variations: z
    .array(
      z.object({
        body: z.string(),
        hashtags: z.array(z.string()),
        cta: z.string(),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const json = await request.json();
    parsed = GenerateRequestSchema.parse(json);
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

  // APIキーが無ければモック生成で即応答（試作の体験確認用）
  if (!hasKey) {
    const response: GenerateResponse = {
      variations: generateMockVariations(parsed),
      source: "mock",
    };
    return NextResponse.json(response);
  }

  const model = process.env.MEO_GENERATION_MODEL || DEFAULT_MODEL;

  try {
    // 動的importで、キー未設定環境でのバンドル/起動を軽くする
    const { generateObject } = await import("ai");
    const { object } = await generateObject({
      model,
      schema: AiOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(parsed),
      temperature: 0.8,
    });

    const variations: PostVariation[] = object.variations
      .slice(0, parsed.count)
      .map((v) => ({
        body: v.body.trim(),
        hashtags: v.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
        cta: v.cta.trim(),
        charCount: [...v.body.trim()].length,
      }));

    const response: GenerateResponse = {
      variations,
      source: "ai",
      model,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[generate] AI生成に失敗、モックにフォールバック:", err);
    // 生成失敗時もUIを止めないようモックで返す
    const response: GenerateResponse = {
      variations: generateMockVariations(parsed),
      source: "mock",
    };
    return NextResponse.json(response);
  }
}
