import { GBP_API } from "./config";
import type {
  CreatePostInput,
  GbpAccount,
  GbpLocalPostResult,
  GbpLocation,
  GbpMetricsResult,
  GbpReview,
} from "./types";

/**
 * Google ビジネスプロフィール REST API のラッパ（実 API 呼び出し専用）。
 * アカウント/Location/Performance は v1 系、口コミ/ローカル投稿は v4 を使う。
 */

/** Authorization 付きで叩いて JSON を返す。!ok は例外 */
async function gbpFetch<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GBP API エラー (${res.status}): ${await res.text()}`);
  }
  return (res.status === 204 ? {} : await res.json()) as T;
}

// ---- アカウント / Location（連携時の店舗発見に使用） ----

export async function listAccounts(accessToken: string): Promise<GbpAccount[]> {
  const data = await gbpFetch<{
    accounts?: { name: string; accountName?: string }[];
  }>(accessToken, `${GBP_API.accountManagement}/accounts`);
  return (data.accounts ?? []).map((a) => ({
    name: a.name,
    accountName: a.accountName ?? a.name,
  }));
}

interface RawLocation {
  name: string;
  title?: string;
  storeCode?: string;
  categories?: { primaryCategory?: { displayName?: string } };
  storefrontAddress?: { addressLines?: string[]; locality?: string };
}

const LOCATION_READ_MASK = "name,title,storeCode,categories,storefrontAddress";

export async function listLocations(
  accessToken: string,
  accountName: string,
): Promise<GbpLocation[]> {
  const url =
    `${GBP_API.businessInformation}/${accountName}/locations` +
    `?readMask=${encodeURIComponent(LOCATION_READ_MASK)}&pageSize=100`;
  const data = await gbpFetch<{ locations?: RawLocation[] }>(accessToken, url);
  return (data.locations ?? []).map((l) => ({
    name: l.name,
    title: l.title ?? l.name,
    storeCode: l.storeCode,
    primaryCategory: l.categories?.primaryCategory?.displayName,
    address: [
      ...(l.storefrontAddress?.addressLines ?? []),
      l.storefrontAddress?.locality ?? "",
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

// ---- 口コミ（v4） ----

const STAR_TO_NUMBER: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

interface RawReview {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

export async function listReviews(
  accessToken: string,
  accountName: string,
  locationName: string,
): Promise<GbpReview[]> {
  // v4 パス: accounts/{aid}/locations/{lid}/reviews
  const url = `${GBP_API.v4}/${accountName}/${locationName}/reviews?pageSize=50`;
  const data = await gbpFetch<{ reviews?: RawReview[] }>(accessToken, url);
  return (data.reviews ?? []).map((r) => ({
    reviewId: r.reviewId,
    reviewerName: r.reviewer?.displayName ?? "匿名",
    starRating: STAR_TO_NUMBER[r.starRating ?? ""] ?? 0,
    comment: r.comment ?? "",
    createTime: r.createTime ?? "",
    reply: r.reviewReply?.comment
      ? {
          comment: r.reviewReply.comment,
          updateTime: r.reviewReply.updateTime ?? "",
        }
      : undefined,
  }));
}

export async function replyToReview(
  accessToken: string,
  accountName: string,
  locationName: string,
  reviewId: string,
  comment: string,
): Promise<void> {
  const url = `${GBP_API.v4}/${accountName}/${locationName}/reviews/${reviewId}/reply`;
  await gbpFetch(accessToken, url, {
    method: "PUT",
    body: JSON.stringify({ comment }),
  });
}

// ---- ローカル投稿（v4） ----

export async function createLocalPost(
  accessToken: string,
  accountName: string,
  locationName: string,
  input: CreatePostInput,
): Promise<GbpLocalPostResult> {
  const url = `${GBP_API.v4}/${accountName}/${locationName}/localPosts`;
  const body: Record<string, unknown> = {
    languageCode: "ja",
    summary: input.summary,
    topicType: input.topicType,
  };
  if (input.ctaType) {
    body.callToAction = { actionType: input.ctaType, url: input.ctaUrl };
  }
  if (input.mediaUrl) {
    body.media = [{ mediaFormat: "PHOTO", sourceUrl: input.mediaUrl }];
  }
  const data = await gbpFetch<{
    name: string;
    searchUrl?: string;
    state?: string;
  }>(accessToken, url, { method: "POST", body: JSON.stringify(body) });
  return {
    name: data.name,
    searchUrl: data.searchUrl,
    state: data.state ?? "PROCESSING",
  };
}

// ---- Performance 指標（v1） ----

const PERF_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "CALL_CLICKS",
  "BUSINESS_BOOKINGS",
] as const;

interface MultiDailyResponse {
  multiDailyMetricTimeSeries?: {
    dailyMetricTimeSeries?: {
      dailyMetric?: string;
      timeSeries?: { datedValues?: { value?: string }[] };
    }[];
  }[];
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 指定月の各指標の合計を取得（month は 1-12） */
async function fetchMonthSums(
  accessToken: string,
  locationName: string,
  year: number,
  month: number,
): Promise<Record<string, number>> {
  const params = new URLSearchParams();
  for (const m of PERF_METRICS) params.append("dailyMetrics", m);
  params.set("dailyRange.start_date.year", String(year));
  params.set("dailyRange.start_date.month", String(month));
  params.set("dailyRange.start_date.day", "1");
  params.set("dailyRange.end_date.year", String(year));
  params.set("dailyRange.end_date.month", String(month));
  params.set("dailyRange.end_date.day", String(daysInMonth(year, month)));
  const url = `${GBP_API.performance}/${locationName}:fetchMultiDailyMetricsTimeSeries?${params.toString()}`;
  const data = await gbpFetch<MultiDailyResponse>(accessToken, url);

  const sums: Record<string, number> = {};
  for (const multi of data.multiDailyMetricTimeSeries ?? []) {
    for (const series of multi.dailyMetricTimeSeries ?? []) {
      const key = series.dailyMetric ?? "";
      const total = (series.timeSeries?.datedValues ?? []).reduce(
        (acc, dv) => acc + Number(dv.value ?? 0),
        0,
      );
      sums[key] = (sums[key] ?? 0) + total;
    }
  }
  return sums;
}

function parsePeriod(period: string): { year: number; month: number } {
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m };
}

/**
 * Performance 指標を ReportRequest の数値フィールド形で取得。
 * Performance API が提供しない posts/photos/口コミ系/平均評価は 0 のまま
 * （レポート画面で手入力補完できる）。
 */
export async function fetchMetrics(
  accessToken: string,
  locationName: string,
  period: string,
  comparePeriod: string,
): Promise<GbpMetricsResult> {
  const cur = parsePeriod(period);
  const prev = parsePeriod(comparePeriod);
  const [c, p] = await Promise.all([
    fetchMonthSums(accessToken, locationName, cur.year, cur.month),
    fetchMonthSums(accessToken, locationName, prev.year, prev.month),
  ]);

  const search = (s: Record<string, number>) =>
    (s.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH ?? 0) +
    (s.BUSINESS_IMPRESSIONS_MOBILE_SEARCH ?? 0);
  const maps = (s: Record<string, number>) =>
    (s.BUSINESS_IMPRESSIONS_DESKTOP_MAPS ?? 0) +
    (s.BUSINESS_IMPRESSIONS_MOBILE_MAPS ?? 0);
  const v = (cv: number, pv: number) => ({ current: cv, previous: pv });

  return {
    period,
    comparePeriod,
    metrics: {
      impressionsSearch: v(search(c), search(p)),
      impressionsMaps: v(maps(c), maps(p)),
      websiteClicks: v(c.WEBSITE_CLICKS ?? 0, p.WEBSITE_CLICKS ?? 0),
      directionRequests: v(
        c.BUSINESS_DIRECTION_REQUESTS ?? 0,
        p.BUSINESS_DIRECTION_REQUESTS ?? 0,
      ),
      calls: v(c.CALL_CLICKS ?? 0, p.CALL_CLICKS ?? 0),
      bookings: v(c.BUSINESS_BOOKINGS ?? 0, p.BUSINESS_BOOKINGS ?? 0),
    },
  };
}
