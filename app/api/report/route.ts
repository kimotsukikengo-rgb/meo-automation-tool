import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  PRIORITIES,
  ReportRequestSchema,
  ReportResponse,
} from "@/lib/report-types";
import { buildMetrics } from "@/lib/report-data";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/report-prompt";
import { generateMockCommentary } from "@/lib/report-mock";
import {
  LOCAL_MODEL,
  extractJson,
  generateWithClaude,
  isLocalClaudeEnabled,
} from "@/lib/claude-cli";

/** Claudeに構造化出力で返してもらう講評スキーマ（11セクション） */
const AiOutputSchema = z.object({
  summary: z.string(),
  kpiChanges: z.array(z.string()),
  highlights: z.array(z.string()),
  issues: z.array(z.string()),
  keywordAnalysis: z.string(),
  reviewAnalysis: z.string(),
  contentAnalysis: z.string(),
  competitorAnalysis: z.string(),
  nextActions: z.array(z.string()),
  priorityTasks: z.array(
    z.object({
      priority: z.enum(PRIORITIES),
      name: z.string(),
      purpose: z.string(),
      action: z.string(),
      expected: z.string(),
      caution: z.string(),
    }),
  ),
  clientComment: z.string(),
});

/** JSONのみで返すよう指示する出力フォーマット指定 */
const JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"summary":"今月の総括","kpiChanges":["主要KPIの変化"],"highlights":["良かった点"],"issues":["課題点"],"keywordAnalysis":"検索キーワードの分析","reviewAnalysis":"口コミ状況の分析","contentAnalysis":"投稿・写真運用の分析","competitorAnalysis":"競合比較の所感","nextActions":["来月の改善アクション"],"priorityTasks":[{"priority":"high|mid|low","name":"施策名","purpose":"目的","action":"実施内容","expected":"期待効果","caution":"注意点"}],"clientComment":"クライアント向けコメント"}`;

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const json = await request.json();
    parsed = ReportRequestSchema.parse(json);
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

  // 手入力された数値から指標を組み立てる
  const metrics = buildMetrics(parsed);

  // ローカルClaude（Opus 4.8）で講評生成。失敗時はモックにフォールバック。
  if (isLocalClaudeEnabled()) {
    try {
      const raw = await generateWithClaude(
        SYSTEM_PROMPT,
        buildUserPrompt(parsed, metrics) + JSON_INSTRUCTION,
      );
      const object = AiOutputSchema.parse(extractJson(raw));

      const response: ReportResponse = {
        metrics,
        commentary: object,
        source: "ai",
        model: LOCAL_MODEL,
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error("[report] ローカルClaude講評に失敗、モックにフォールバック:", err);
    }
  }

  // フォールバック（ローカルClaude無効 or 生成失敗時）
  const response: ReportResponse = {
    metrics,
    commentary: generateMockCommentary(parsed, metrics),
    source: "mock",
  };
  return NextResponse.json(response);
}
