import { z } from "zod";

/** 返信のトーン */
export const REPLY_TONES = ["sincere", "warm", "formal"] as const;
export type ReplyTone = (typeof REPLY_TONES)[number];

export const REPLY_TONE_LABELS: Record<ReplyTone, string> = {
  sincere: "誠実・丁寧",
  warm: "あたたかい・親身",
  formal: "フォーマル・端正",
};

/** 謝罪の要否（auto=AI判定） */
export const APOLOGY_MODES = ["auto", "yes", "no"] as const;
export type ApologyMode = (typeof APOLOGY_MODES)[number];

export const APOLOGY_LABELS: Record<ApologyMode, string> = {
  auto: "AIにまかせる",
  yes: "謝罪を入れる",
  no: "謝罪は不要",
};

/** 返信文の長さ目安 */
export const REPLY_LENGTHS = ["short", "standard", "long"] as const;
export type ReplyLength = (typeof REPLY_LENGTHS)[number];

export const REPLY_LENGTH_LABELS: Record<ReplyLength, string> = {
  short: "短め（〜80字）",
  standard: "標準（〜150字）",
  long: "しっかり（〜250字）",
};

/** 感情判定 */
export type Sentiment = "positive" | "neutral" | "negative";

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "ポジティブ",
  neutral: "中立",
  negative: "ネガティブ",
};

/** リクエスト本体 */
export const ReplyRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種・カテゴリは必須です").max(60),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1, "口コミ本文は必須です").max(2000),
  reviewerName: z.string().max(60).optional().default(""),
  usedService: z.string().max(120).optional().default(""),
  visitTime: z.string().max(60).optional().default(""),
  replyTone: z.enum(REPLY_TONES),
  storeMessage: z.string().max(300).optional().default(""),
  encourageReturn: z.boolean().default(true),
  apology: z.enum(APOLOGY_MODES).default("auto"),
  ngExpressions: z.string().max(300).optional().default(""),
  length: z.enum(REPLY_LENGTHS).default("standard"),
});

export type ReplyRequest = z.infer<typeof ReplyRequestSchema>;

/** API レスポンス */
export interface ReplyResponse {
  sentiment: Sentiment;
  /** ネガティブ等で人によるエスカレーション対応が望ましい場合 true */
  needsEscalation: boolean;
  /** エスカレーション理由（needsEscalation=true のとき） */
  escalationReason?: string;
  /** 口コミ返信文（メイン案） */
  reply: string;
  /** 返信の意図 */
  intent: string;
  /** 注意すべきリスク */
  risks: string[];
  /** より丁寧な別案 */
  politeAlt: string;
  /** 短めの別案 */
  shortAlt: string;
  source: "ai" | "mock";
  model?: string;
}
