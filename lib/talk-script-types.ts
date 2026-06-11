import { z } from "zod";
import { PRIORITIES } from "./report-types";

/**
 * 月次レポートをもとに、クライアントへ口頭で報告するための
 * 「トークスクリプト（話す内容の台本）」の型とリクエストスキーマ。
 */

/** 想定問答（クライアントが聞いてきそうな質問と、その答え方） */
export interface TalkScriptQA {
  question: string;
  answer: string;
}

/** 報告の流れの1ブロック（見出し＋実際に話す台本） */
export interface TalkScriptSection {
  heading: string; // 例：今月の成果サマリー
  talk: string; // 実際に話す内容（話し言葉）
}

/** トークスクリプト本体 */
export interface TalkScript {
  opening: string; // 挨拶・導入トーク
  agenda: string[]; // 本日お伝えすること（流れ）
  sections: TalkScriptSection[]; // 報告本編の話す流れ
  expectedQuestions: TalkScriptQA[]; // 想定問答
  closing: string; // 締めのトーク
  talkingTips: string[]; // 話し方・進め方のコツ
}

/** 数値ペア（current=当月, previous=比較期間） */
const metricPair = z.object({
  current: z.number(),
  previous: z.number(),
});

/** トークスクリプト生成に必要な指標（ReportMetrics 相当） */
const metricsSchema = z.object({
  period: z.string(),
  comparePeriod: z.string(),
  impressionsSearch: metricPair,
  impressionsMaps: metricPair,
  impressionsTotal: metricPair,
  websiteClicks: metricPair,
  directionRequests: metricPair,
  calls: metricPair,
  bookings: metricPair,
  posts: metricPair,
  photos: metricPair,
  newReviews: metricPair,
  repliedReviews: metricPair,
  avgRating: metricPair,
});

/** レポート講評（ReportCommentary 相当） */
const commentarySchema = z.object({
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

/** リクエスト本体（レポート生成結果をそのまま渡す） */
export const TalkScriptRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種は必須です").max(60),
  area: z.string().max(80).optional().default(""),
  clientMessage: z.string().max(500).optional().default(""),
  metrics: metricsSchema,
  commentary: commentarySchema,
});

export type TalkScriptRequest = z.infer<typeof TalkScriptRequestSchema>;

/** API レスポンス */
export interface TalkScriptResponse {
  talkScript: TalkScript;
  source: "ai" | "mock";
  model?: string;
}
