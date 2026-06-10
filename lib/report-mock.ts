import { MetricPair, ReportCommentary, ReportMetrics } from "./report-types";

/**
 * APIキー未設定時のサンプル講評生成。
 * 指標の前月比から、テンプレートベースの講評を組み立てる。
 */

function deltaPct(p: MetricPair): number {
  if (p.previous === 0) return 0;
  return ((p.current - p.previous) / p.previous) * 100;
}

function fmt(d: number): string {
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

export function generateMockCommentary(m: ReportMetrics): ReportCommentary {
  const impTotalCur = m.impressionsSearch.current + m.impressionsMaps.current;
  const impTotalPrev = m.impressionsSearch.previous + m.impressionsMaps.previous;
  const impDelta =
    impTotalPrev === 0 ? 0 : ((impTotalCur - impTotalPrev) / impTotalPrev) * 100;

  const callsD = deltaPct(m.calls);
  const dirD = deltaPct(m.directionRequests);
  const clicksD = deltaPct(m.websiteClicks);

  const summary = `${m.period}の合計表示回数は${impTotalCur.toLocaleString()}回（前月比${fmt(impDelta)}）でした。新規口コミは${m.newReviews.current}件、平均評価は${m.avgRating.current}（累計${m.totalReviews}件）です。${impDelta >= 0 ? "露出は堅調に推移しています。" : "露出が前月を下回ったため、投稿や写真の更新でのテコ入れが有効です。"}`;

  const highlights: string[] = [];
  if (impDelta >= 0)
    highlights.push(`合計表示回数が前月比${fmt(impDelta)}と増加しました。`);
  if (callsD >= 0)
    highlights.push(`通話数が${fmt(callsD)}と伸び、来店前の問い合わせにつながっています。`);
  if (m.newReviews.current > 0)
    highlights.push(`新規口コミを${m.newReviews.current}件獲得しました。`);
  if (highlights.length === 0)
    highlights.push("各指標は前月並みを維持しています。");

  const issues: string[] = [];
  if (clicksD < 0)
    issues.push(`ウェブサイトクリックが${fmt(clicksD)}と減少しています。`);
  if (dirD < 0)
    issues.push(`ルート検索が${fmt(dirD)}と減少し、来店意向の取りこぼしが懸念されます。`);
  if (m.avgRating.current < 4.0)
    issues.push(`平均評価が${m.avgRating.current}と4.0を下回っています。`);
  if (issues.length === 0)
    issues.push("大きな課題は見られませんが、伸びの鈍化に注意が必要です。");

  const suggestions: string[] = [
    "週1回以上の投稿（最新情報・特典）を継続し、露出機会を増やす。",
    "新しい店内・商品写真を月3枚以上追加し、プロフィールの鮮度を保つ。",
  ];
  if (m.newReviews.current < 5)
    suggestions.push("来店客への口コミ依頼（QR・声かけ）を強化し、口コミ獲得ペースを上げる。");
  if (m.avgRating.current < 4.2)
    suggestions.push("低評価口コミへの丁寧な返信と、指摘点の改善を実施する。");

  return { summary, highlights, issues, suggestions };
}
