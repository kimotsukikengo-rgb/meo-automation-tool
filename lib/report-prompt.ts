import { MetricPair, ReportMetrics, ReportRequest } from "./report-types";

/**
 * MEO月次レポートの講評を生成するシステムプロンプト。
 * 表示回数・クリック・ルート検索・電話・予約・口コミ・写真・投稿・検索キーワードの
 * 変化から総合的に判断し、次の行動につながるレポートを作成する。
 */
export const SYSTEM_PROMPT = `あなたはMEO・Googleビジネスプロフィール運用の分析担当者です。
クライアント店舗の月次データをもとに、クライアント向けのMEO月次レポートを作成します。

# 分析ルール
- 数値の増減だけでなく、なぜ変化した可能性があるかを仮説として整理する。
- 因果関係を断定せず、「可能性」「傾向」「仮説」として表現する。
- 良かった点・課題点・次に改善すべき点を明確に分ける。
- 店舗オーナーが理解しやすい言葉で説明する。専門用語を使う場合は簡単に補足する。
- 口コミ・投稿・写真・検索キーワード・ユーザー行動を総合的に見る。
- 「報告」だけでなく「次の行動」につながる内容にする。改善案は抽象論でなく実行可能な施策にする。
- 成果を「順位」だけで判断せず、表示回数・クリック・ルート検索・電話・予約・口コミ・写真・投稿・検索キーワードの変化から総合的に判断する。
- 比較データ（前月）が0または無い指標は「比較データなし」として、断定を避ける。

# 出力する11セクション
1. summary: 今月の総括（2〜4文）
2. kpiChanges: 主要KPIの変化（配列。各KPIの増減と簡単な解釈）
3. highlights: 良かった点（配列）
4. issues: 課題点（配列）
5. keywordAnalysis: 検索キーワードの分析（文章）
6. reviewAnalysis: 口コミ状況の分析（文章）
7. contentAnalysis: 投稿・写真運用の分析（文章）
8. competitorAnalysis: 競合比較の所感（文章。情報がなければその旨を述べる）
9. nextActions: 来月の改善アクション（配列。実行可能な施策）
10. priorityTasks: 優先度付きタスク一覧（配列。各要素に priority(high/mid/low), name, purpose, action, expected, caution）
11. clientComment: クライアント向けコメント（文章。前向きで具体的に）`;

/** 前月比のパーセンテージ文字列 */
function pct(p: MetricPair): string {
  if (p.previous === 0) return "比較データなし";
  const d = ((p.current - p.previous) / p.previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

function line(label: string, p: MetricPair): string {
  return `- ${label}: ${p.current.toLocaleString()} / ${p.previous.toLocaleString()} / ${pct(p)}`;
}

function opt(value: string, fallback = "（情報なし）"): string {
  return value && value.trim() ? value.trim() : fallback;
}

export function buildUserPrompt(req: ReportRequest, m: ReportMetrics): string {
  return `以下の店舗の月次データから、クライアント向けのMEO月次レポートの講評を作成してください。

# 店舗
- 店舗名: ${req.storeName}
- 業種: ${req.category}
- エリア: ${opt(req.area, "（指定なし）")}
- 対象期間: ${m.period}（比較期間: ${m.comparePeriod}）

# 指標（当月 / 比較期間 / 前期比）
${line("表示回数（合計）", m.impressionsTotal)}
${line("検索経由の表示数", m.impressionsSearch)}
${line("マップ経由の表示数", m.impressionsMaps)}
${line("ウェブサイトクリック数", m.websiteClicks)}
${line("ルート検索数", m.directionRequests)}
${line("電話クリック数", m.calls)}
${line("予約数", m.bookings)}
${line("投稿数", m.posts)}
${line("写真追加数", m.photos)}
${line("口コミ件数（当月）", m.newReviews)}
${line("返信済み口コミ数", m.repliedReviews)}
- 平均評価: ${m.avgRating.current} / ${m.avgRating.previous}

# 定性情報
- 上位検索キーワード: ${opt(req.topKeywords)}
- 競合店舗の傾向: ${opt(req.competitorTrend)}
- 今月実施した施策: ${opt(req.actionsTaken)}
- 特記事項: ${opt(req.notes)}
- クライアントに伝えたいこと: ${opt(req.clientMessage)}

# 出力要件
- 上記11セクション（summary / kpiChanges / highlights / issues / keywordAnalysis / reviewAnalysis / contentAnalysis / competitorAnalysis / nextActions / priorityTasks / clientComment）をすべて出力すること。
- priorityTasks は優先度（high/mid/low）順に3〜6件。各タスクに name / purpose / action / expected / caution を含めること。`;
}
