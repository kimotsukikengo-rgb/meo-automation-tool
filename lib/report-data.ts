import { MetricPair, ReportMetrics, ReportRequest, TrendPoint } from "./report-types";

/**
 * 試作用のサンプルGBPデータ生成。
 * 実運用ではここを GBP Performance API / Reviews API の取得結果に差し替える。
 * 店舗名＋対象月をシードに「決定的」に生成するため、同じ入力なら毎回同じ数値になる。
 */

/** 文字列 → 32bit ハッシュ */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 疑似乱数（seedから決定的に [0,1) を返す） */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** YYYY-MM の前月を返す */
function prevMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  return d;
}

/** 直近6か月のラベル（古い→新しい） */
function trendLabels(period: string): { key: string; label: string }[] {
  const [y, m] = period.split("-").map(Number);
  const out: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let yy = y;
    let mm = m - i;
    while (mm <= 0) {
      mm += 12;
      yy -= 1;
    }
    out.push({ key: `${yy}-${String(mm).padStart(2, "0")}`, label: `${mm}月` });
  }
  return out;
}

function pair(rand: () => number, base: number, growthBias: number): MetricPair {
  // previous を基準に、当月は -15%〜+25% 程度で変動（growthBiasで上振れ調整）
  const previous = Math.round(base * (0.85 + rand() * 0.3));
  const delta = -0.15 + rand() * 0.4 + growthBias;
  const current = Math.max(0, Math.round(previous * (1 + delta)));
  return { current, previous };
}

export function generateSampleMetrics(req: ReportRequest): ReportMetrics {
  const rand = mulberry32(hashSeed(`${req.storeName}|${req.period}`));

  // 業種ごとに規模感を少し変える（飲食は表示多め等のニュアンス）
  const scale = 0.7 + rand() * 0.8;

  const impressionsSearch = pair(rand, 4200 * scale, 0.02);
  const impressionsMaps = pair(rand, 6800 * scale, 0.03);
  const websiteClicks = pair(rand, 380 * scale, 0.01);
  const calls = pair(rand, 95 * scale, 0);
  const directionRequests = pair(rand, 240 * scale, 0.01);
  const newReviews = pair(rand, 12 * scale, 0);

  const ratingBase = 3.8 + rand() * 1.0; // 3.8〜4.8
  const avgRating: MetricPair = {
    previous: Math.round(ratingBase * 10) / 10,
    current: Math.min(5, Math.round((ratingBase + (rand() - 0.4) * 0.3) * 10) / 10),
  };

  const totalReviews = Math.round(120 * scale + rand() * 80);

  // 推移は当月の検索+マップ表示回数を最新点に合わせる
  const latest = impressionsSearch.current + impressionsMaps.current;
  const trend: TrendPoint[] = trendLabels(req.period).map((t, i, arr) => {
    if (i === arr.length - 1) return { label: t.label, impressions: latest };
    const factor = 0.7 + rand() * 0.45;
    return { label: t.label, impressions: Math.round(latest * factor) };
  });

  return {
    period: req.period,
    previousPeriod: prevMonth(req.period),
    impressionsSearch,
    impressionsMaps,
    websiteClicks,
    calls,
    directionRequests,
    newReviews,
    avgRating,
    totalReviews,
    trend,
  };
}
