import {
  MetricPair,
  PriorityTask,
  ReportCommentary,
  ReportMetrics,
  ReportRequest,
} from "./report-types";

/**
 * APIキー未設定時のサンプル講評生成。
 * 手入力された指標の前期比から、11セクションの講評をテンプレートベースで組み立てる。
 */

function deltaPct(p: MetricPair): number {
  if (p.previous === 0) return 0;
  return ((p.current - p.previous) / p.previous) * 100;
}

function fmt(d: number): string {
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

function changeLine(label: string, p: MetricPair): string {
  if (p.previous === 0) {
    return `${label}: ${p.current.toLocaleString()}（比較データなし）`;
  }
  const d = deltaPct(p);
  const trend = d > 0.5 ? "増加" : d < -0.5 ? "減少" : "横ばい";
  return `${label}: ${p.current.toLocaleString()}（前期比${fmt(d)}・${trend}）`;
}

export function generateMockCommentary(
  req: ReportRequest,
  m: ReportMetrics,
): ReportCommentary {
  const impD = deltaPct(m.impressionsTotal);
  const clicksD = deltaPct(m.websiteClicks);
  const callsD = deltaPct(m.calls);
  const dirD = deltaPct(m.directionRequests);
  const bookingsD = deltaPct(m.bookings);

  const summary = `${m.period}の合計表示回数は${m.impressionsTotal.current.toLocaleString()}回（前期比${fmt(impD)}）でした。予約数は${m.bookings.current.toLocaleString()}件、平均評価は${m.avgRating.current}です。${impD >= 0 ? "露出は堅調に推移している可能性があります。" : "露出が前期を下回ったため、投稿・写真でのテコ入れが有効と考えられます。"}`;

  const kpiChanges = [
    changeLine("表示回数（合計）", m.impressionsTotal),
    changeLine("ウェブサイトクリック", m.websiteClicks),
    changeLine("ルート検索", m.directionRequests),
    changeLine("電話クリック", m.calls),
    changeLine("予約数", m.bookings),
    changeLine("口コミ件数（当月）", m.newReviews),
  ];

  const highlights: string[] = [];
  if (impD >= 0)
    highlights.push(`合計表示回数が前期比${fmt(impD)}と増加しました。`);
  if (callsD >= 0 && m.calls.previous > 0)
    highlights.push(
      `電話クリックが${fmt(callsD)}と伸び、来店前の問い合わせにつながっている可能性があります。`,
    );
  if (bookingsD >= 0 && m.bookings.previous > 0)
    highlights.push(`予約数が${fmt(bookingsD)}と改善しました。`);
  if (m.newReviews.current > 0)
    highlights.push(`当月の口コミを${m.newReviews.current}件獲得しました。`);
  if (highlights.length === 0)
    highlights.push("各指標はおおむね前期並みを維持しています。");

  const issues: string[] = [];
  if (clicksD < 0)
    issues.push(`ウェブサイトクリックが${fmt(clicksD)}と減少しています。`);
  if (dirD < 0)
    issues.push(
      `ルート検索が${fmt(dirD)}と減少し、来店意向の取りこぼしが懸念されます。`,
    );
  if (m.avgRating.current > 0 && m.avgRating.current < 4.0)
    issues.push(`平均評価が${m.avgRating.current}と4.0を下回っています。`);
  if (
    m.newReviews.current > 0 &&
    m.repliedReviews.current < m.newReviews.current
  )
    issues.push("当月の口コミに対し、返信が追いついていない可能性があります。");
  if (issues.length === 0)
    issues.push("大きな課題は見られませんが、伸びの鈍化に注意が必要です。");

  const keywordAnalysis = req.topKeywords
    ? `上位検索キーワードは「${req.topKeywords}」です。指名（店舗名）系と一般（業種・エリア）系のバランスを見ながら、一般系の流入を増やす投稿・カテゴリ最適化が有効と考えられます。`
    : "上位検索キーワードの情報が未入力です。インサイトのキーワードデータを入力すると、指名系／一般系の構成から具体的な打ち手を分析できます。";

  const reviewAnalysis = `当月の口コミは${m.newReviews.current}件、うち返信済みは${m.repliedReviews.current}件です。平均評価は${m.avgRating.current}。口コミは件数だけでなく返信率も評価対象になり得るため、全件への丁寧な返信を継続することをおすすめします。`;

  const contentAnalysis = `当月の投稿数は${m.posts.current}件、写真追加は${m.photos.current}枚でした。投稿・写真の更新頻度は表示回数の維持に寄与する傾向があるため、週1回以上の投稿と月数枚の写真追加を目安に継続するとよいでしょう。`;

  const competitorAnalysis = req.competitorTrend
    ? `競合の傾向として「${req.competitorTrend}」が挙げられています。自店の強みを投稿・写真・口コミ返信で可視化し、差別化要素を継続的に発信することが有効です。`
    : "競合情報が未入力です。近隣同業の投稿頻度・写真点数・口コミ数を入力すると、相対的な立ち位置を踏まえた所感を出せます。";

  const nextActions = [
    "週1回以上の投稿（最新情報・特典・お知らせ）を継続し、露出機会を増やす。",
    "店内・商品・スタッフ写真を月3枚以上追加し、プロフィールの鮮度を保つ。",
    "当月の口コミ全件へ、テンプレに頼らず具体的に返信する。",
  ];
  if (clicksD < 0 || dirD < 0)
    nextActions.push(
      "ビジネス情報（営業時間・サービス・予約リンク）を見直し、来店導線を強化する。",
    );

  const priorityTasks: PriorityTask[] = [
    {
      priority: "high",
      name: "投稿頻度の引き上げ",
      purpose: "表示回数とユーザー行動の底上げ",
      action:
        "最新情報・特典・お知らせを週1回以上投稿。来店促進型／悩み解決型を交互に。",
      expected: "表示回数・クリックの維持〜微増",
      caution: "情報（日時・価格）の正確性を必ず確認。終了したキャンペーン投稿は更新。",
    },
    {
      priority: "high",
      name: "口コミ返信の徹底",
      purpose: "信頼性の維持と評価の底上げ",
      action:
        "当月の口コミ全件へ48時間以内に返信。低評価は担当者確認のうえ個別対応導線を提示。",
      expected: "返信率の向上、見込み客への好印象",
      caution: "個人情報・内部事情は書かない。公開の場で反論しない。",
    },
    {
      priority: "mid",
      name: "写真の追加",
      purpose: "プロフィールの鮮度・魅力の向上",
      action: "店内・商品・スタッフ写真を月3枚以上追加。",
      expected: "閲覧時間・来店意向の向上",
      caution: "解像度・明るさに注意。古い写真は差し替える。",
    },
    {
      priority: "low",
      name: "検索キーワードのモニタリング",
      purpose: "流入構造の把握と最適化",
      action:
        "インサイトの検索キーワードを毎月記録し、一般系キーワードの推移を確認。",
      expected: "投稿・カテゴリ最適化の精度向上",
      caution: "短期の変動に一喜一憂せず、傾向で判断する。",
    },
  ];

  const clientComment = req.clientMessage
    ? `${req.clientMessage} 今月の運用状況を踏まえ、来月は上記の優先タスクから着手することをおすすめします。引き続き伴走してまいります。`
    : "今月もお取り組みいただきありがとうございました。数値の変化を踏まえ、来月は優先度の高い施策から一緒に進めてまいりましょう。";

  return {
    summary,
    kpiChanges,
    highlights,
    issues,
    keywordAnalysis,
    reviewAnalysis,
    contentAnalysis,
    competitorAnalysis,
    nextActions,
    priorityTasks,
    clientComment,
  };
}
