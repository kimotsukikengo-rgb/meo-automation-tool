import { TalkScriptRequest } from "./talk-script-types";

/** 数値ペアの前期比文字列 */
function pct(current: number, previous: number): string {
  if (previous === 0) return "比較データなし";
  const d = ((current - previous) / previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

/**
 * トークスクリプト生成のシステムプロンプト。
 * 役割：作成済みの月次レポートを、クライアントへ口頭で報告するMEO運用担当者。
 */
export const SYSTEM_PROMPT = `あなたはMEO・Googleビジネスプロフィール運用を担当し、クライアント（店舗オーナー）へ月次レポートを口頭で報告するコンサルタントです。
作成済みの月次レポートをもとに、報告ミーティング（対面・オンライン）でそのまま使える「トークスクリプト（話す台本）」を作成します。

# 基本方針
- 話し言葉で書く。読み上げてそのまま自然に話せる文章にする。
- 専門用語はかみ砕いて説明する。略語を使う場合は一言添える。
- 数字は「前期比」とセットで伝え、良し悪しの解釈を必ず付ける。
- 課題は隠さず正直に。ただし必ず「対策・次の打ち手」とセットで前向きに伝える。
- 成果を誇張しない。断定を避け「可能性」「傾向」で表現する。
- クライアントが安心し、次の施策に納得感を持てる流れにする。
- 1回の報告で10分前後を想定し、冗長になりすぎないようにする。

# 出力する項目
1. opening: 挨拶・導入トーク（来てもらったお礼、今日伝えることの予告。2〜4文の話し言葉）
2. agenda: 本日お伝えすること（配列。3〜5項目の短い見出し）
3. sections: 報告本編の流れ（配列。各要素に heading=見出し, talk=実際に話す台本。話し言葉で2〜5文）。
   「今月の成果サマリー」「順調だった点」「課題と受け止め」「来月の改善方針」「ご相談・お願い」など4〜6ブロック。
4. expectedQuestions: 想定問答（配列。各要素に question=クライアントが聞いてきそうな質問, answer=その答え方。3〜5件）
5. closing: 締めのトーク（感謝と次回への意欲。2〜3文の話し言葉）
6. talkingTips: 話し方・進め方のコツ（配列。担当者向けの注意点。3〜5件）`;

export function buildUserPrompt(req: TalkScriptRequest): string {
  const m = req.metrics;
  const c = req.commentary;

  const metricLine = (label: string, cur: number, prev: number) =>
    `- ${label}: ${cur.toLocaleString()}（前期 ${prev.toLocaleString()} / ${pct(cur, prev)}）`;

  return `以下は、ある店舗の作成済みMEO月次レポートです。この内容をもとに、クライアントへ口頭で報告するためのトークスクリプトを作成してください。

# 店舗
- 店舗名: ${req.storeName}
- 業種: ${req.category}
- エリア: ${req.area || "（指定なし）"}
- 対象期間: ${m.period}（比較期間: ${m.comparePeriod}）

# 主要指標（当月 / 前期 / 前期比）
${metricLine("表示回数（合計）", m.impressionsTotal.current, m.impressionsTotal.previous)}
${metricLine("ウェブサイトクリック", m.websiteClicks.current, m.websiteClicks.previous)}
${metricLine("ルート検索", m.directionRequests.current, m.directionRequests.previous)}
${metricLine("電話クリック", m.calls.current, m.calls.previous)}
${metricLine("予約数", m.bookings.current, m.bookings.previous)}
${metricLine("口コミ件数（当月）", m.newReviews.current, m.newReviews.previous)}
- 平均評価: ${m.avgRating.current}（前期 ${m.avgRating.previous}）

# レポート講評
- 総括: ${c.summary}
- 良かった点: ${c.highlights.join(" / ") || "（なし）"}
- 課題点: ${c.issues.join(" / ") || "（なし）"}
- 来月の改善アクション: ${c.nextActions.join(" / ") || "（なし）"}
- 優先タスク: ${c.priorityTasks.map((t) => t.name).join(" / ") || "（なし）"}
- クライアント向けコメント: ${c.clientComment}
${req.clientMessage ? `- クライアントに伝えたいこと: ${req.clientMessage}` : ""}

# 出力要件
- opening / agenda / sections / expectedQuestions / closing / talkingTips をすべて出力すること。
- sections は上記レポートの内容（成果・課題・来月の方針）を反映した話の流れにすること。
- 口頭での報告に使える、自然な話し言葉にすること。`;
}
