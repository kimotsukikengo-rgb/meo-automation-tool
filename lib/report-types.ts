import { z } from "zod";

/** 優先度 */
export const PRIORITIES = ["high", "mid", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高",
  mid: "中",
  low: "低",
};

/** 当月値と比較期間値のペア（previous=0 は「比較データなし」扱い） */
const metricPair = z.object({
  current: z.coerce.number().min(0).default(0),
  previous: z.coerce.number().min(0).default(0),
});

const ratingPair = z.object({
  current: z.coerce.number().min(0).max(5).default(0),
  previous: z.coerce.number().min(0).max(5).default(0),
});

/** リクエスト本体（担当者が実数値・定性情報を手入力） */
export const ReportRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種・カテゴリは必須です").max(60),
  area: z.string().max(80).optional().default(""),
  /** 対象月 YYYY-MM */
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "対象期間は YYYY-MM 形式で指定してください"),
  /** 比較期間 YYYY-MM（任意。未指定なら前月） */
  comparePeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
    .or(z.literal("")),

  // 数値指標（当月 / 比較期間）
  impressionsSearch: metricPair,
  impressionsMaps: metricPair,
  websiteClicks: metricPair,
  directionRequests: metricPair,
  calls: metricPair,
  bookings: metricPair,
  posts: metricPair,
  photos: metricPair,
  newReviews: metricPair,
  repliedReviews: metricPair,
  avgRating: ratingPair,

  // 定性情報
  topKeywords: z.string().max(500).optional().default(""),
  competitorTrend: z.string().max(500).optional().default(""),
  actionsTaken: z.string().max(500).optional().default(""),
  notes: z.string().max(500).optional().default(""),
  clientMessage: z.string().max(500).optional().default(""),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;

/** 当月値と比較期間値のペア */
export interface MetricPair {
  current: number;
  previous: number;
}

/** レポートの集計指標（入力値から組み立て） */
export interface ReportMetrics {
  period: string; // YYYY-MM
  comparePeriod: string; // YYYY-MM
  impressionsSearch: MetricPair; // 検索経由の表示数
  impressionsMaps: MetricPair; // マップ経由の表示数
  impressionsTotal: MetricPair; // 表示回数（検索＋マップ）
  websiteClicks: MetricPair; // ウェブサイトクリック数
  directionRequests: MetricPair; // ルート検索数
  calls: MetricPair; // 電話クリック数
  bookings: MetricPair; // 予約数
  posts: MetricPair; // 投稿数
  photos: MetricPair; // 写真追加数
  newReviews: MetricPair; // 口コミ件数（当月）
  repliedReviews: MetricPair; // 返信済み口コミ数
  avgRating: MetricPair; // 平均評価（1〜5）
}

/** 優先度付きタスク1件 */
export interface PriorityTask {
  priority: Priority;
  name: string; // 施策名
  purpose: string; // 目的
  action: string; // 実施内容
  expected: string; // 期待効果
  caution: string; // 注意点
}

/** AIが生成する講評（11セクション構成） */
export interface ReportCommentary {
  summary: string; // 1. 今月の総括
  kpiChanges: string[]; // 2. 主要KPIの変化
  highlights: string[]; // 3. 良かった点
  issues: string[]; // 4. 課題点
  keywordAnalysis: string; // 5. 検索キーワードの分析
  reviewAnalysis: string; // 6. 口コミ状況の分析
  contentAnalysis: string; // 7. 投稿・写真運用の分析
  competitorAnalysis: string; // 8. 競合比較の所感
  nextActions: string[]; // 9. 来月の改善アクション
  priorityTasks: PriorityTask[]; // 10. 優先度付きタスク一覧
  clientComment: string; // 11. クライアント向けコメント
}

/** API レスポンス */
export interface ReportResponse {
  metrics: ReportMetrics;
  commentary: ReportCommentary;
  /** 講評の生成元 */
  source: "ai" | "mock";
  model?: string;
}
