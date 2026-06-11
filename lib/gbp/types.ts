import { z } from "zod";

/**
 * GBP ドメイン型と、各 API ルートの入力スキーマ。
 * 星評価などは Google の表現（ONE..FIVE 等）を UI 用に正規化して保持する。
 */

/** GBP アカウント（accounts/{id}） */
export interface GbpAccount {
  /** accounts/{id} 形式のリソース名 */
  name: string;
  accountName: string;
}

/** GBP ロケーション（店舗） */
export interface GbpLocation {
  /** locations/{id} 形式のリソース名 */
  name: string;
  title: string;
  storeCode?: string;
  primaryCategory?: string;
  address?: string;
}

/** 口コミ1件（UI 用に正規化） */
export interface GbpReview {
  reviewId: string;
  reviewerName: string;
  starRating: number; // 1..5
  comment: string;
  createTime: string; // ISO8601
  /** 既存の店舗返信（あれば） */
  reply?: { comment: string; updateTime: string };
}

/** ローカル投稿の種別 */
export const GBP_POST_TOPICS = ["STANDARD", "EVENT", "OFFER"] as const;
export type GbpPostTopic = (typeof GBP_POST_TOPICS)[number];

/** ローカル投稿の CTA 種別 */
export const GBP_CTA_TYPES = [
  "LEARN_MORE",
  "BOOK",
  "ORDER",
  "SHOP",
  "SIGN_UP",
  "CALL",
] as const;
export type GbpCtaType = (typeof GBP_CTA_TYPES)[number];

/** ローカル投稿の公開結果 */
export interface GbpLocalPostResult {
  /** localPosts/{id} 形式のリソース名 */
  name: string;
  searchUrl?: string;
  state: string; // LIVE / PROCESSING / REJECTED 等
}

/** Performance 指標の当月/比較ペア */
export interface GbpMetricValue {
  current: number;
  previous: number;
}

/**
 * Performance 取得結果。
 * metrics のキーは ReportRequest の数値フィールド名と一致させる
 * （impressionsSearch / impressionsMaps / websiteClicks / directionRequests /
 *   calls / bookings / posts / photos / newReviews / repliedReviews / avgRating）。
 */
export interface GbpMetricsResult {
  period: string; // YYYY-MM
  comparePeriod: string; // YYYY-MM
  metrics: Record<string, GbpMetricValue>;
}

// ---- API ルート入力スキーマ ----

export const CreatePostInputSchema = z.object({
  storeId: z.string().min(1),
  summary: z.string().min(1).max(1500),
  topicType: z.enum(GBP_POST_TOPICS).default("STANDARD"),
  ctaType: z.enum(GBP_CTA_TYPES).optional(),
  ctaUrl: z.string().url().optional(),
  mediaUrl: z.string().url().optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

export const ReplyReviewInputSchema = z.object({
  storeId: z.string().min(1),
  reviewId: z.string().min(1),
  comment: z.string().min(1).max(4096),
});
export type ReplyReviewInput = z.infer<typeof ReplyReviewInputSchema>;

export const MetricsQuerySchema = z.object({
  storeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  comparePeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;

/** 連携店舗の新規登録入力（OAuth コールバック or mock 追加で使用） */
export const ConnectStoreInputSchema = z.object({
  storeLabel: z.string().min(1).max(80),
  locationName: z.string().min(1),
  locationTitle: z.string().min(1).max(120),
});
export type ConnectStoreInput = z.infer<typeof ConnectStoreInputSchema>;
