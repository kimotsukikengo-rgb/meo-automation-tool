import { z } from "zod";

/** 返信のトーン */
export const REPLY_TONES = ["sincere", "warm", "formal"] as const;
export type ReplyTone = (typeof REPLY_TONES)[number];

export const REPLY_TONE_LABELS: Record<ReplyTone, string> = {
  sincere: "誠実・丁寧",
  warm: "あたたかい・親身",
  formal: "フォーマル・端正",
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
  reviewText: z.string().min(1, "口コミ本文は必須です").max(2000),
  rating: z.number().int().min(1).max(5),
  reviewerName: z.string().max(60).optional().default(""),
  replyTone: z.enum(REPLY_TONES),
  count: z.number().int().min(1).max(4).default(3),
});

export type ReplyRequest = z.infer<typeof ReplyRequestSchema>;

/** 返信案1件 */
export interface ReplyVariation {
  body: string;
  charCount: number;
}

/** API レスポンス */
export interface ReplyResponse {
  sentiment: Sentiment;
  /** ネガティブ等で人によるエスカレーション対応が望ましい場合 true */
  needsEscalation: boolean;
  /** エスカレーション理由（needsEscalation=true のとき） */
  escalationReason?: string;
  replies: ReplyVariation[];
  source: "ai" | "mock";
  model?: string;
}
