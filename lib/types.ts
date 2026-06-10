import { z } from "zod";

/** 投稿タイプ（GBPのローカル投稿種別に対応） */
export const POST_TYPES = ["update", "offer", "event"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  update: "最新情報",
  offer: "特典・キャンペーン",
  event: "イベント",
};

/** トーン */
export const TONES = ["friendly", "polite", "energetic", "premium"] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  friendly: "親しみやすい",
  polite: "丁寧・落ち着いた",
  energetic: "活気・元気",
  premium: "上質・高級感",
};

/** 文字数の目安 */
export const LENGTHS = ["short", "standard", "long"] as const;
export type Length = (typeof LENGTHS)[number];

export const LENGTH_LABELS: Record<Length, string> = {
  short: "短め（〜120字）",
  standard: "標準（〜250字）",
  long: "長め（〜400字）",
};

export const LENGTH_TARGET: Record<Length, number> = {
  short: 120,
  standard: 250,
  long: 400,
};

/** フォーム入力（リクエスト本体） */
export const GenerateRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種・カテゴリは必須です").max(60),
  theme: z.string().min(1, "投稿テーマは必須です").max(120),
  keyPoints: z.string().max(400).optional().default(""),
  tone: z.enum(TONES),
  postType: z.enum(POST_TYPES),
  length: z.enum(LENGTHS),
  count: z.number().int().min(1).max(5).default(3),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** 生成された投稿案1件 */
export interface PostVariation {
  body: string;
  hashtags: string[];
  cta: string;
  charCount: number;
}

/** API レスポンス */
export interface GenerateResponse {
  variations: PostVariation[];
  /** "ai" = Claude生成 / "mock" = APIキー未設定時のサンプル生成 */
  source: "ai" | "mock";
  model?: string;
}
