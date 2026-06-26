import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  TalkScriptRequestSchema,
  TalkScriptResponse,
} from "@/lib/talk-script-types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/talk-script-prompt";
import { generateMockTalkScript } from "@/lib/talk-script-mock";
import {
  LOCAL_MODEL,
  extractJson,
  generateWithClaude,
  isLocalClaudeEnabled,
} from "@/lib/claude-cli";

/** Claudeに構造化出力で返してもらうトークスクリプトのスキーマ */
const AiOutputSchema = z.object({
  opening: z.string(),
  agenda: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      talk: z.string(),
    }),
  ),
  expectedQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  closing: z.string(),
  talkingTips: z.array(z.string()),
});

/** JSONのみで返すよう指示する出力フォーマット指定 */
const JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"opening":"挨拶・導入トーク","agenda":["本日お伝えすること"],"sections":[{"heading":"見出し","talk":"実際に話す台本"}],"expectedQuestions":[{"question":"想定質問","answer":"答え方"}],"closing":"締めのトーク","talkingTips":["話し方のコツ"]}`;

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const json = await request.json();
    parsed = TalkScriptRequestSchema.parse(json);
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

  // ローカルClaude（Opus 4.8）でトークスクリプト生成。失敗時はモックにフォールバック。
  if (isLocalClaudeEnabled()) {
    try {
      const raw = await generateWithClaude(
        SYSTEM_PROMPT,
        buildUserPrompt(parsed) + JSON_INSTRUCTION,
      );
      const object = AiOutputSchema.parse(extractJson(raw));

      const response: TalkScriptResponse = {
        talkScript: object,
        source: "ai",
        model: LOCAL_MODEL,
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error(
        "[talk-script] ローカルClaude生成に失敗、モックにフォールバック:",
        err,
      );
    }
  }

  // フォールバック（ローカルClaude無効 or 生成失敗時）
  const response: TalkScriptResponse = {
    talkScript: generateMockTalkScript(parsed),
    source: "mock",
  };
  return NextResponse.json(response);
}
