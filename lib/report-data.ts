import { MetricPair, ReportMetrics, ReportRequest } from "./report-types";

/**
 * 手入力されたフォーム値から、表示・講評生成に使う ReportMetrics を組み立てる。
 * 合計表示回数（検索＋マップ）は入力値から導出する。
 * 比較期間が未指定の場合は対象月の前月を補完する。
 */

/** YYYY-MM の前月を返す */
export function prevMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function sumPair(a: MetricPair, b: MetricPair): MetricPair {
  return { current: a.current + b.current, previous: a.previous + b.previous };
}

export function buildMetrics(req: ReportRequest): ReportMetrics {
  const comparePeriod =
    req.comparePeriod && req.comparePeriod.length > 0
      ? req.comparePeriod
      : prevMonth(req.period);

  return {
    period: req.period,
    comparePeriod,
    impressionsSearch: req.impressionsSearch,
    impressionsMaps: req.impressionsMaps,
    impressionsTotal: sumPair(req.impressionsSearch, req.impressionsMaps),
    websiteClicks: req.websiteClicks,
    directionRequests: req.directionRequests,
    calls: req.calls,
    bookings: req.bookings,
    posts: req.posts,
    photos: req.photos,
    newReviews: req.newReviews,
    repliedReviews: req.repliedReviews,
    avgRating: req.avgRating,
  };
}
