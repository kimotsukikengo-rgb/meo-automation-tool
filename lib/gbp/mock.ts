import type {
  GbpLocation,
  GbpLocalPostResult,
  GbpMetricsResult,
  GbpReview,
} from "./types";

/**
 * GBP_LIVE=off のときに GBP クライアントが返す合成データ。
 * Google 承認や OAuth 設定なしで、連携〜取得〜投稿の全フローを画面で確認するため。
 */

/** mock: 連携アカウントに紐づく店舗（Location）一覧 */
export const MOCK_LOCATIONS: GbpLocation[] = [
  {
    name: "locations/1111111111",
    title: "サンプル美容室 渋谷店",
    storeCode: "shibuya-01",
    primaryCategory: "美容室",
    address: "東京都渋谷区道玄坂1-2-3",
  },
  {
    name: "locations/2222222222",
    title: "サンプル整体院 新宿店",
    storeCode: "shinjuku-01",
    primaryCategory: "整体院",
    address: "東京都新宿区西新宿4-5-6",
  },
];

/** mock: 指定店舗の口コミ一覧 */
export function mockReviews(storeLabel: string): GbpReview[] {
  return [
    {
      reviewId: "mock-review-001",
      reviewerName: "田中 さやか",
      starRating: 5,
      comment: `${storeLabel}に伺いました。スタッフの対応が丁寧で、仕上がりも大満足です。また利用します！`,
      createTime: "2026-06-08T09:30:00Z",
    },
    {
      reviewId: "mock-review-002",
      reviewerName: "佐藤 健",
      starRating: 4,
      comment: "予約がスムーズで良かったです。次回はもう少し待ち時間が短いと嬉しいです。",
      createTime: "2026-06-05T12:10:00Z",
      reply: {
        comment: "ご来店ありがとうございました。待ち時間の改善に取り組んでまいります。",
        updateTime: "2026-06-06T01:00:00Z",
      },
    },
    {
      reviewId: "mock-review-003",
      reviewerName: "匿名",
      starRating: 2,
      comment: "案内が分かりづらく、少し迷ってしまいました。場所の説明があると助かります。",
      createTime: "2026-06-02T18:45:00Z",
    },
  ];
}

/** mock: ローカル投稿の公開結果 */
export const MOCK_POST_RESULT: GbpLocalPostResult = {
  name: "locations/1111111111/localPosts/mock-post-001",
  searchUrl: "https://www.google.com/maps",
  state: "LIVE",
};

/** mock: Performance 指標（ReportRequest の数値フィールド名で返す） */
export function mockMetrics(
  period: string,
  comparePeriod: string,
): GbpMetricsResult {
  const pair = (current: number, previous: number) => ({ current, previous });
  return {
    period,
    comparePeriod,
    metrics: {
      impressionsSearch: pair(12840, 11920),
      impressionsMaps: pair(7360, 6980),
      websiteClicks: pair(412, 388),
      directionRequests: pair(286, 251),
      calls: pair(143, 138),
      bookings: pair(64, 52),
      posts: pair(8, 6),
      photos: pair(15, 9),
      newReviews: pair(11, 8),
      repliedReviews: pair(11, 5),
      avgRating: pair(4.4, 4.2),
    },
  };
}
