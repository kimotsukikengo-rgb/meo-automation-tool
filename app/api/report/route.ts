import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ReportRequestSchema, ReportResponse } from "@/lib/report-types";
import { generateSampleMetrics } from "@/lib/report-data";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/report-prompt";
import { generateMockCommentary } from "@/lib/report-mock";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

/** Claudeに構造化出力で返してもらう講評スキーマ */
const AiOutputSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

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

  // データはサンプル生成（実運用ではGBP APIに差し替え）
  const metrics = generateSampleMetrics(parsed);
  const hasKey = Boolean(process.env.AI_GATEWAY_API_KEY);

  if (!hasKey) {
    const response: ReportResponse = {
      metrics,
      commentary: generateMockCommentary(metrics),
      dataSource: "sample",
      source: "mock",
    };
    return NextResponse.json(response);
  }

  const model = process.env.MEO_GENERATION_MODEL || DEFAULT_MODEL;

  try {
    const { generateObject } = await import("ai");
    const { object } = await generateObject({
      model,
      schema: AiOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(parsed, metrics),
      temperature: 0.5,
    });

    const response: ReportResponse = {
      metrics,
      commentary: object,
      dataSource: "sample",
      source: "ai",
      model,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[report] AI講評に失敗、モックにフォールバック:", err);
    const response: ReportResponse = {
      metrics,
      commentary: generateMockCommentary(metrics),
      dataSource: "sample",
      source: "mock",
    };
    return NextResponse.json(response);
  }
}
