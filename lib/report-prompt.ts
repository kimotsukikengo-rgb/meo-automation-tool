import { MetricPair, ReportMetrics, ReportRequest } from "./report-types";

export const SYSTEM_PROMPT = `あなたは日本のMEO（Googleビジネスプロフィール最適化）運用コンサルタントです。
クライアント店舗の月次パフォーマンスデータをもとに、定例レポートに載せる「講評」を作成します。

# 守るべきこと
- 数値の事実に基づいて述べる。データにない断定はしない。
- 前月比の増減を具体的な数値・割合で示す。
- 良かった点（highlights）、課題（issues）、改善提案（suggestions）を分けて述べる。
- 改善提案は、その店舗が次の1か月で実行できる具体的なアクションにする（例：投稿頻度、写真追加、口コミ依頼、特典投稿など）。
- 専門用語は最小限にし、店舗オーナーが読んで理解できる平易な日本語にする。
- 誇張せず、課題があれば率直に書く。`;

function pct(p: MetricPair): string {
  if (p.previous === 0) return "前月データなし";
  const d = ((p.current - p.previous) / p.previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

export function buildUserPrompt(req: ReportRequest, m: ReportMetrics): string {
  return `以下の店舗の月次データから、定例レポート用の講評を作成してください。

# 店舗
- 店舗名: ${req.storeName}
- 業種: ${req.category}
- 対象月: ${m.period}（前月: ${m.previousPeriod}）

# 指標（当月 / 前月 / 前月比）
- 検索での表示回数: ${m.impressionsSearch.current} / ${m.impressionsSearch.previous} / ${pct(m.impressionsSearch)}
- マップでの表示回数: ${m.impressionsMaps.current} / ${m.impressionsMaps.previous} / ${pct(m.impressionsMaps)}
- ウェブサイトクリック: ${m.websiteClicks.current} / ${m.websiteClicks.previous} / ${pct(m.websiteClicks)}
- 通話数: ${m.calls.current} / ${m.calls.previous} / ${pct(m.calls)}
- ルート検索: ${m.directionRequests.current} / ${m.directionRequests.previous} / ${pct(m.directionRequests)}
- 新規口コミ: ${m.newReviews.current} / ${m.newReviews.previous} / ${pct(m.newReviews)}
- 平均評価: ${m.avgRating.current} / ${m.avgRating.previous}（累計口コミ ${m.totalReviews}件）

# 出力要件
- summary: 全体総括（2〜3文）
- highlights: 良かった点（2〜3項目）
- issues: 課題（1〜3項目）
- suggestions: 次月の改善提案（2〜4項目、具体的なアクション）`;
}
