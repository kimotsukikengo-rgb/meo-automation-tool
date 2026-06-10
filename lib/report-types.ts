import { z } from "zod";

/** リクエスト本体 */
export const ReportRequestSchema = z.object({
  storeName: z.string().min(1, "店舗名は必須です").max(80),
  category: z.string().min(1, "業種・カテゴリは必須です").max(60),
  /** 対象月 YYYY-MM */
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "対象月は YYYY-MM 形式で指定してください"),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;

/** 当月値と前月値のペア */
export interface MetricPair {
  current: number;
  previous: number;
}

/** 推移グラフの1点 */
export interface TrendPoint {
  /** 表示用ラベル（例: "1月"） */
  label: string;
  impressions: number;
}

/** レポートの集計指標（試作ではサンプルデータ） */
export interface ReportMetrics {
  period: string; // YYYY-MM
  previousPeriod: string; // YYYY-MM
  impressionsSearch: MetricPair; // Google検索での表示回数
  impressionsMaps: MetricPair; // マップでの表示回数
  websiteClicks: MetricPair; // ウェブサイトクリック
  calls: MetricPair; // 通話
  directionRequests: MetricPair; // ルート検索
  newReviews: MetricPair; // 新規口コミ件数
  avgRating: MetricPair; // 平均評価（1〜5）
  totalReviews: number; // 累計口コミ件数
  trend: TrendPoint[]; // 直近6か月の表示回数推移
}

/** AIが生成する講評 */
export interface ReportCommentary {
  summary: string;
  highlights: string[];
  issues: string[];
  suggestions: string[];
}

/** API レスポンス */
export interface ReportResponse {
  metrics: ReportMetrics;
  commentary: ReportCommentary;
  /** データの出所（試作のサンプルデータか実データか） */
  dataSource: "sample";
  /** 講評の生成元 */
  source: "ai" | "mock";
  model?: string;
}
