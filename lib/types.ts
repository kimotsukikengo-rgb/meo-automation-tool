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
  short: "短文型 200〜300字（BtoB・機能訴求）",
  standard: "中文型 350〜500字（信頼訴求）",
  long: "長文型 500〜700字（体験・BtoC）",
};

/**
 * 業種帯ごとの文字数レンジ（合格基準より）。
 * 「上限の目安」ではなく「下限を下回らない」レンジとして扱う。
 */
export const LENGTH_TARGET: Record<Length, { min: number; max: number }> = {
  short: { min: 200, max: 300 },
  standard: { min: 350, max: 500 },
  long: { min: 500, max: 700 },
};

/** 絵文字の方針（店舗単位で上書き可。初期値は業種から推定） */
export const EMOJI_POLICIES = ["none", "light", "standard"] as const;
export type EmojiPolicy = (typeof EMOJI_POLICIES)[number];

export const EMOJI_POLICY_LABELS: Record<EmojiPolicy, string> = {
  none: "なし",
  light: "控えめ（1〜3個）",
  standard: "標準（2〜8個）",
};

/** 方針別の絵文字数の許容レンジ（1投稿あたり） */
export const EMOJI_POLICY_RANGE: Record<EmojiPolicy, { min: number; max: number }> = {
  none: { min: 0, max: 0 },
  light: { min: 1, max: 3 },
  standard: { min: 2, max: 8 },
};

/** 業種文字列から絵文字方針の初期値を推定（BtoB系は控えめ、それ以外は標準） */
const BTOB_HINTS = [
  "製造",
  "会計",
  "税理",
  "司法",
  "行政書士",
  "土地家屋",
  "測量",
  "OEM",
  "卸",
  "BtoB",
  "法人",
  "建設",
  "工業",
  "産業",
];
export function inferEmojiPolicy(category: string): EmojiPolicy {
  const c = category.trim();
  if (!c) return "standard";
  return BTOB_HINTS.some((h) => c.includes(h)) ? "light" : "standard";
}

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
  emojiPolicy: z.enum(EMOJI_POLICIES).default("standard"),
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

/** 品質チェック1項目の判定 */
export type QualityStatus = "pass" | "warn" | "fail";

export interface QualityItem {
  /** 項目キー（length / hashtag / emoji / structure / repetition / keyword / toneLeak / hook / naturalness 等） */
  key: string;
  /** 表示名 */
  label: string;
  status: QualityStatus;
  /** 理由・実測値 */
  detail: string;
}

/** 1パターン分の品質判定 */
export interface PatternQuality {
  patternKey: PostPatternKey;
  items: QualityItem[];
  /** ハードfail（文字数・HT・絵文字・構成比・トーンラベル混入）が1件以上 */
  hardFail: boolean;
  /** 1回の自動修正パスを通したか */
  repaired: boolean;
}

export interface QualityReport {
  patterns: PatternQuality[];
}

/** API レスポンス */
export interface GenerateResponse {
  patterns: PostPattern[];
  /** "ai" = Claude生成 / "mock" = ローカルClaude無効・生成失敗時のサンプル生成 */
  source: "ai" | "mock";
  model?: string;
  /** 合格基準に対する自動チェック結果（mock時は付かない） */
  qualityReport?: QualityReport;
}
