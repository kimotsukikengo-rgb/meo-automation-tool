import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ReplyRequestSchema, ReplyResponse } from "@/lib/review-types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/review-prompt";
import { generateMockReply } from "@/lib/review-mock";
import {
  LOCAL_MODEL,
  extractJson,
  generateWithClaude,
  isLocalClaudeEnabled,
} from "@/lib/claude-cli";

/** Claudeに構造化出力で返してもらうスキーマ */
const AiOutputSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  needsEscalation: z.boolean(),
  escalationReason: z.string().optional(),
  reply: z.string(),
  intent: z.string(),
  risks: z.array(z.string()),
  politeAlt: z.string(),
  shortAlt: z.string(),
});

/** JSONのみで返すよう指示する出力フォーマット指定 */
const JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"sentiment":"positive|neutral|negative","needsEscalation":false,"escalationReason":"エスカレーションが必要な場合の理由","reply":"口コミ返信文","intent":"返信の意図","risks":["注意すべきリスク"],"politeAlt":"より丁寧な別案","shortAlt":"短めの別案"}`;

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

  // ローカルClaude（Opus 4.8）で生成。失敗時はモックにフォールバック。
  if (isLocalClaudeEnabled()) {
    try {
      const raw = await generateWithClaude(
        SYSTEM_PROMPT,
        buildUserPrompt(parsed) + JSON_INSTRUCTION,
      );
      const object = AiOutputSchema.parse(extractJson(raw));

      const response: ReplyResponse = {
        sentiment: object.sentiment,
        needsEscalation: object.needsEscalation,
        escalationReason: object.escalationReason,
        reply: object.reply.trim(),
        intent: object.intent.trim(),
        risks: object.risks.map((r) => r.trim()).filter(Boolean),
        politeAlt: object.politeAlt.trim(),
        shortAlt: object.shortAlt.trim(),
        source: "ai",
        model: LOCAL_MODEL,
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error("[reply] ローカルClaude生成に失敗、モックにフォールバック:", err);
    }
  }

  // フォールバック（ローカルClaude無効 or 生成失敗時）
  return NextResponse.json(generateMockReply(parsed));
}
