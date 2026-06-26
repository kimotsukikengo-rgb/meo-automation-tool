import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  GenerateRequest,
  GenerateRequestSchema,
  GenerateResponse,
  PatternQuality,
  POST_PATTERNS,
  POST_PATTERN_LABELS,
  PostPattern,
  PostPatternKey,
  QualityReport,
} from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt, buildImagePromptSection } from "@/lib/prompt";
import { generateMockPatterns } from "@/lib/mock-generator";
import {
  LOCAL_MODEL,
  extractJson,
  generateWithClaude,
  isLocalClaudeEnabled,
} from "@/lib/claude-cli";
import { checkQuality, QualityContext } from "@/lib/quality-check";
import { judgeQuality, JudgeVerdict } from "@/lib/quality-judge";

/** MIMEタイプ → 一時ファイルの拡張子 */
const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** 添付画像の data URL を一時ファイルに書き出してパスを返す。形式不正なら null。 */
async function writeImageToTemp(dataUrl: string): Promise<string | null> {
  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) return null;
  const [, mime, b64] = match;
  const ext = IMAGE_EXT[mime] ?? "png";
  const path = join(tmpdir(), `meo-upload-${randomUUID()}.${ext}`);
  await writeFile(path, Buffer.from(b64, "base64"));
  return path;
}

/** Claudeに構造化出力で返してもらうスキーマ（パターン×6項目） */
const AiOutputSchema = z.object({
  patterns: z
    .array(
      z.object({
        patternKey: z.enum(POST_PATTERNS),
        title: z.string(),
        body: z.string(),
        cta: z.string(),
        searchIntent: z.string(),
        meoKeywords: z.array(z.string()),
        notes: z.string(),
      }),
    )
    .min(1),
});
type AiPattern = z.infer<typeof AiOutputSchema>["patterns"][number];

/** JSONのみで返すよう指示する出力フォーマット指定 */
const JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"patterns":[{"patternKey":"visit|problem|announce","title":"投稿タイトル案","body":"投稿本文","cta":"CTA文","searchIntent":"狙っている検索意図","meoKeywords":["MEOキーワード"],"notes":"改善案・注意点"}]}`;

/** 生のAI出力を整形して PostPattern に変換する（#除去・trim・文字数計算） */
function toPattern(p: AiPattern): PostPattern {
  const body = p.body.trim();
  return {
    patternKey: p.patternKey,
    patternLabel: POST_PATTERN_LABELS[p.patternKey],
    title: p.title.trim(),
    body,
    cta: p.cta.trim(),
    searchIntent: p.searchIntent.trim(),
    meoKeywords: p.meoKeywords.map((k) => k.trim().replace(/^[#＃]/, "")).filter(Boolean),
    notes: p.notes.trim(),
    charCount: [...body].length,
  };
}

function buildContext(req: GenerateRequest): QualityContext {
  return {
    length: req.length,
    emojiPolicy: req.emojiPolicy,
    area: req.area,
    category: req.category,
    mainServices: req.mainServices,
  };
}

/** 決定論チェック＋ジャッジを合成して品質レポートを作る */
function buildReport(
  patterns: PostPattern[],
  ctx: QualityContext,
  judge: Map<PostPatternKey, JudgeVerdict> | null,
  repairedKeys: Set<PostPatternKey>,
): { report: QualityReport; needRepair: PostPatternKey[] } {
  const needRepair: PostPatternKey[] = [];
  const reportPatterns: PatternQuality[] = patterns.map((p) => {
    const det = checkQuality(p, ctx);
    const v = judge?.get(p.patternKey);
    const items = v ? [...det.items, ...v.items] : det.items;
    const hardFail = det.hardFail || Boolean(v?.hasFail);
    if (hardFail && !repairedKeys.has(p.patternKey)) needRepair.push(p.patternKey);
    return { patternKey: p.patternKey, items, hardFail, repaired: repairedKeys.has(p.patternKey) };
  });
  return { report: { patterns: reportPatterns }, needRepair };
}

/** 未達パターンの修正指示プロンプトを作る */
function buildRepairPrompt(
  req: GenerateRequest,
  patterns: PostPattern[],
  report: QualityReport,
  targets: PostPatternKey[],
): string {
  const blocks = targets
    .map((key) => {
      const p = patterns.find((x) => x.patternKey === key)!;
      const q = report.patterns.find((x) => x.patternKey === key)!;
      const issues = q.items
        .filter((it) => it.status !== "pass")
        .map((it) => `- ${it.label}: ${it.detail}`)
        .join("\n");
      return `## ${key}（${p.patternLabel}）\n現在の本文:\n${p.body}\nCTA: ${p.cta}\n指摘:\n${issues}`;
    })
    .join("\n\n");
  return `${buildUserPrompt(req)}

# 修正指示（重要）
以下のパターンは品質基準を満たしていません。指摘をすべて解消し、該当パターンのみ作り直してください。
${blocks}

# 出力形式
修正したパターンのみを、同じJSON形式で出力してください。`;
}

export async function POST(request: NextRequest) {
  let parsed: GenerateRequest;
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

  // ローカルClaude（Opus 4.8）で生成。失敗時はモックにフォールバック。
  if (isLocalClaudeEnabled()) {
    let imagePath: string | null = null;
    try {
      let userPrompt = buildUserPrompt(parsed);
      if (parsed.imageDataUrl) {
        imagePath = await writeImageToTemp(parsed.imageDataUrl);
        if (imagePath) userPrompt += buildImagePromptSection(imagePath);
      }

      const raw = await generateWithClaude(
        SYSTEM_PROMPT,
        userPrompt + JSON_INSTRUCTION,
        imagePath ? { allowedTools: ["Read"] } : {},
      );
      const object = AiOutputSchema.parse(extractJson(raw));
      let patterns = object.patterns.map(toPattern);

      // 品質チェック（決定論＋Haikuジャッジ）→ ハードfailは1回だけ自動修正
      const ctx = buildContext(parsed);
      const repairedKeys = new Set<PostPatternKey>();
      let judge = await judgeQuality(patterns);
      let { report, needRepair } = buildReport(patterns, ctx, judge, repairedKeys);

      if (needRepair.length > 0) {
        try {
          const repairRaw = await generateWithClaude(
            SYSTEM_PROMPT,
            buildRepairPrompt(parsed, patterns, report, needRepair) + JSON_INSTRUCTION,
          );
          const repaired = AiOutputSchema.parse(extractJson(repairRaw)).patterns.map(toPattern);
          // 修正されたパターンだけ差し替え
          patterns = patterns.map((p) => {
            const fix = repaired.find((r) => r.patternKey === p.patternKey);
            if (fix && needRepair.includes(p.patternKey)) {
              repairedKeys.add(p.patternKey);
              return fix;
            }
            return p;
          });
          judge = await judgeQuality(patterns);
          ({ report } = buildReport(patterns, ctx, judge, repairedKeys));
        } catch (err) {
          console.error("[generate] 自動修正に失敗（初回生成を返す）:", err);
        }
      }

      const response: GenerateResponse = {
        patterns,
        source: "ai",
        model: LOCAL_MODEL,
        qualityReport: report,
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error(
        "[generate] ローカルClaude生成に失敗、モックにフォールバック:",
        err,
      );
    } finally {
      if (imagePath) await unlink(imagePath).catch(() => {});
    }
  }

  // フォールバック（ローカルClaude無効 or 生成失敗時）。mockであることを明示。
  const response: GenerateResponse = {
    patterns: generateMockPatterns(parsed),
    source: "mock",
  };
  return NextResponse.json(response);
}
