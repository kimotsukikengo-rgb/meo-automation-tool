import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  GenerateRequestSchema,
  GenerateResponse,
  POST_PATTERNS,
  POST_PATTERN_LABELS,
  PostPattern,
} from "@/lib/types";
import { SYSTEM_PROMPT, buildUserPrompt, buildImagePromptSection } from "@/lib/prompt";
import { generateMockPatterns } from "@/lib/mock-generator";
import {
  LOCAL_MODEL,
  extractJson,
  generateWithClaude,
  isLocalClaudeEnabled,
} from "@/lib/claude-cli";

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

/** Claudeに構造化出力で返してもらうスキーマ（3パターン×6項目） */
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

/** JSONのみで返すよう指示する出力フォーマット指定 */
const JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"patterns":[{"patternKey":"visit|problem|announce","title":"投稿タイトル案","body":"投稿本文","cta":"CTA文","searchIntent":"狙っている検索意図","meoKeywords":["MEOキーワード"],"notes":"改善案・注意点"}]}`;

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

  // ローカルClaude（Opus 4.8）で生成。失敗時はモックにフォールバック。
  if (isLocalClaudeEnabled()) {
    // 添付画像があれば一時ファイル化し、Claude に Read で読み込ませる
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

      const patterns: PostPattern[] = object.patterns.map((p) => {
        const body = p.body.trim();
        return {
          patternKey: p.patternKey,
          patternLabel: POST_PATTERN_LABELS[p.patternKey],
          title: p.title.trim(),
          body,
          cta: p.cta.trim(),
          searchIntent: p.searchIntent.trim(),
          meoKeywords: p.meoKeywords
            .map((k) => k.trim().replace(/^#/, ""))
            .filter(Boolean),
          notes: p.notes.trim(),
          charCount: [...body].length,
        };
      });

      const response: GenerateResponse = {
        patterns,
        source: "ai",
        model: LOCAL_MODEL,
      };
      return NextResponse.json(response);
    } catch (err) {
      console.error(
        "[generate] ローカルClaude生成に失敗、モックにフォールバック:",
        err,
      );
    } finally {
      // 一時画像ファイルは必ず後始末する
      if (imagePath) await unlink(imagePath).catch(() => {});
    }
  }

  // フォールバック（ローカルClaude無効 or 生成失敗時）
  const response: GenerateResponse = {
    patterns: generateMockPatterns(parsed),
    source: "mock",
  };
  return NextResponse.json(response);
}
