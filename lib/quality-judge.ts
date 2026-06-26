import { z } from "zod";
import { extractJson, generateWithClaude } from "./claude-cli";
import { POST_PATTERNS, PostPattern, PostPatternKey, QualityItem } from "./types";

/**
 * 主観的な品質（冒頭フックの強さ・自然さ・具体性・テンプレ感）を
 * 軽量モデル（Haiku）で採点する。決定論チェックでは拾えない観点を補う。
 * 失敗時は null を返し、生成フローは決定論チェックのみで継続する。
 */

export const JUDGE_MODEL = process.env.MEO_JUDGE_MODEL || "claude-haiku-4-5";

const JUDGE_SYSTEM = `あなたはMEO・Googleビジネスプロフィール投稿文の品質を採点するレビュアーです。
各投稿について以下の観点を pass / warn / fail で判定し、fail の場合のみ具体的な修正指示を1〜2文で返します。

# 観点
- hook（冒頭フックの強さ）: 冒頭1〜2文で読者の視線を止められるか。汎用挨拶（「いつもありがとうございます」「上質なひとときを」等）だけの弱い冒頭は fail。
- naturalness（自然さ）: 機械的・量産テンプレ的な言い回しや、入力値の不自然な貼り付け（業種のスラッシュ直貼り等）がないか。
- specificity（具体性・文脈）: 具体的な情報・数値・利用シーンがあり読者に価値があるか。一般論のみで薄い場合は warn〜fail。
- template（テンプレ感）: 投稿間で同じ構文・CTAの使い回しなど量産感が強くないか。

判定は辛めに。軽微で確信が持てないものは warn。明確に弱い場合のみ fail。`;

const JUDGE_JSON_INSTRUCTION = `\n\n# 出力形式（厳守）\n説明やコードフェンスを付けず、以下のJSONのみを出力してください。\n{"verdicts":[{"patternKey":"visit|problem|announce","items":[{"key":"hook|naturalness|specificity|template","label":"観点名","status":"pass|warn|fail","detail":"理由"}],"fixInstruction":"failがある場合の修正指示。なければ空文字"}]}`;

const JudgeSchema = z.object({
  verdicts: z.array(
    z.object({
      patternKey: z.enum(POST_PATTERNS),
      items: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          status: z.enum(["pass", "warn", "fail"]),
          detail: z.string(),
        }),
      ),
      fixInstruction: z.string().default(""),
    }),
  ),
});

export interface JudgeVerdict {
  items: QualityItem[];
  fixInstruction: string;
  hasFail: boolean;
}

function buildJudgeUserPrompt(
  patterns: Pick<PostPattern, "patternKey" | "patternLabel" | "title" | "body" | "cta">[],
): string {
  const blocks = patterns
    .map(
      (p) =>
        `## ${p.patternKey}（${p.patternLabel}）\nタイトル: ${p.title}\n本文:\n${p.body}\nCTA: ${p.cta}`,
    )
    .join("\n\n");
  return `以下の3投稿を観点ごとに採点してください。\n\n${blocks}`;
}

/**
 * 採点を実行し、パターンキー → 判定 のMapを返す。失敗時は null。
 */
export async function judgeQuality(
  patterns: Pick<PostPattern, "patternKey" | "patternLabel" | "title" | "body" | "cta">[],
): Promise<Map<PostPatternKey, JudgeVerdict> | null> {
  try {
    const raw = await generateWithClaude(
      JUDGE_SYSTEM,
      buildJudgeUserPrompt(patterns) + JUDGE_JSON_INSTRUCTION,
      { model: JUDGE_MODEL },
    );
    const parsed = JudgeSchema.parse(extractJson(raw));
    const map = new Map<PostPatternKey, JudgeVerdict>();
    for (const v of parsed.verdicts) {
      const items: QualityItem[] = v.items.map((it) => ({
        key: it.key,
        label: it.label,
        status: it.status,
        detail: it.detail,
      }));
      map.set(v.patternKey, {
        items,
        fixInstruction: v.fixInstruction,
        hasFail: items.some((it) => it.status === "fail"),
      });
    }
    return map;
  } catch (err) {
    console.error("[quality-judge] 採点に失敗（決定論チェックのみで継続）:", err);
    return null;
  }
}
