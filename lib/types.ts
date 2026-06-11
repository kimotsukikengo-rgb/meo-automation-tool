import { z } from "zod";

/** 文体（トーン） */
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

/** 投稿パターン（プロンプトの A/B/C） */
export const POST_PATTERNS = ["visit", "problem", "announce"] as const;
export type PostPatternKey = (typeof POST_PATTERNS)[number];

export const POST_PATTERN_LABELS: Record<PostPatternKey, string> = {
  visit: "来店促進型",
  problem: "悩み解決型",
  announce: "キャンペーン・お知らせ型",
};

/** フォーム入力（リクエスト本体） */
export const GenerateRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種・カテゴリは必須です").max(60),
  area: z.string().max(80).optional().default(""),
  mainServices: z.string().max(300).optional().default(""),
  theme: z.string().min(1, "投稿テーマは必須です").max(120),
  targetCustomer: z.string().max(200).optional().default(""),
  message: z.string().max(500).optional().default(""),
  campaign: z.string().max(300).optional().default(""),
  desiredCta: z.string().max(120).optional().default(""),
  url: z.string().max(300).optional().default(""),
  strengths: z.string().max(400).optional().default(""),
  ngExpressions: z.string().max(300).optional().default(""),
  tone: z.enum(TONES),
  length: z.enum(LENGTHS),
  /** 投稿に使う画像（PCからアップロード、縮小済みJPEGのdata URL）。任意。 */
  imageDataUrl: z
    .string()
    .regex(/^data:image\/[\w.+-]+;base64,/, "画像データの形式が不正です")
    .max(8_000_000, "画像が大きすぎます")
    .optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** 生成された投稿案1件（パターン別、6項目出力） */
export interface PostPattern {
  patternKey: PostPatternKey;
  patternLabel: string;
  /** 投稿タイトル案 */
  title: string;
  /** 投稿本文 */
  body: string;
  /** CTA文 */
  cta: string;
  /** 狙っている検索意図 */
  searchIntent: string;
  /** 含めたMEOキーワード */
  meoKeywords: string[];
  /** 改善案・注意点 */
  notes: string;
  charCount: number;
}

/** API レスポンス */
export interface GenerateResponse {
  patterns: PostPattern[];
  /** "ai" = Claude生成 / "mock" = APIキー未設定時のサンプル生成 */
  source: "ai" | "mock";
  model?: string;
}
