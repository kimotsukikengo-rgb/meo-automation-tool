import {
  TalkScript,
  TalkScriptQA,
  TalkScriptRequest,
  TalkScriptSection,
} from "./talk-script-types";

/**
 * ローカルClaude無効・生成失敗時のフォールバック。
 * レポートの講評・指標から、口頭報告用トークスクリプトをテンプレートで組み立てる。
 */

function pct(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0) return { text: "比較データなし", up: true };
  const d = ((current - previous) / previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return { text: `${sign}${d.toFixed(1)}%`, up: d >= 0 };
}

export function generateMockTalkScript(req: TalkScriptRequest): TalkScript {
  const m = req.metrics;
  const c = req.commentary;
  const imp = pct(m.impressionsTotal.current, m.impressionsTotal.previous);
  const bookings = pct(m.bookings.current, m.bookings.previous);

  const opening = `${req.storeName}のご担当者さま、本日はお時間をいただきありがとうございます。${m.period}のGoogleビジネスプロフィールの運用状況についてご報告いたします。まず全体の結果をお伝えし、そのあと良かった点と課題、そして来月の進め方をご相談させてください。`;

  const agenda = [
    "今月の成果サマリー",
    "順調だった点",
    "課題と受け止め",
    "来月の改善方針",
  ];

  const sections: TalkScriptSection[] = [
    {
      heading: "今月の成果サマリー",
      talk: `${m.period}は、お店が検索やマップに表示された回数が合計で${m.impressionsTotal.current.toLocaleString()}回、前の期と比べて${imp.text}でした。ご予約は${m.bookings.current.toLocaleString()}件（前期比${bookings.text}）、口コミの平均評価は${m.avgRating.current}です。${c.summary}`,
    },
    {
      heading: "順調だった点",
      talk:
        c.highlights.length > 0
          ? `今月うまくいった点をお伝えします。${c.highlights.join("。また、")}。この流れは来月も継続していきたいと考えています。`
          : "今月は大きな伸びはありませんでしたが、各指標はおおむね前期並みを維持できています。",
    },
    {
      heading: "課題と受け止め",
      talk:
        c.issues.length > 0
          ? `一方で、改善が必要な点もございます。${c.issues.join("。そして、")}。こちらは来月の施策でしっかり手を打っていきます。`
          : "現時点で大きな課題は見られませんが、伸びが鈍化しないよう引き続き注視してまいります。",
    },
    {
      heading: "来月の改善方針",
      talk:
        c.nextActions.length > 0
          ? `来月は次の施策に取り組みます。${c.nextActions.join("。次に、")}。特に優先度が高いのは「${c.priorityTasks[0]?.name ?? "投稿頻度の改善"}」です。`
          : "来月は投稿・写真・口コミ返信の継続を軸に、露出と来店導線の強化を進めます。",
    },
    {
      heading: "ご相談・お願い",
      talk: `${c.clientComment}${req.clientMessage ? ` あわせて、${req.clientMessage}という点についても一緒に進めてまいります。` : ""} 当店側でご用意いただきたい素材や情報があれば、この場でお伝えできればと思います。`,
    },
  ];

  const expectedQuestions: TalkScriptQA[] = [
    {
      question: "結局、今月は良かったのですか？",
      answer: `露出（表示回数）は${imp.up ? "前期を上回り堅調でした" : "前期をやや下回りました"}。来店につながる予約は${m.bookings.current.toLocaleString()}件です。数字の良し悪しは1か月だけで判断せず、傾向で見ていくのがおすすめです、とお伝えします。`,
    },
    {
      question: "口コミの評価が下がっていませんか？",
      answer: `平均評価は${m.avgRating.current}です。${m.avgRating.current >= 4 ? "高い水準を維持できています" : "改善の余地があるため、丁寧な返信と来店体験の見直しで底上げを図ります"}。当月の口コミ${m.newReviews.current}件には引き続き全件返信していきます、と回答します。`,
    },
    {
      question: "来月は何をすればいいですか？",
      answer: `こちらで投稿・写真・口コミ返信を進めます。${c.priorityTasks[0]?.name ?? "投稿頻度の改善"}を最優先で取り組むことをご提案します。店舗側でご協力いただける点があればお願いする、という形で着地させます。`,
    },
    {
      question: "費用に見合った効果は出ていますか？",
      answer: "単月の順位や数字だけでなく、表示回数・クリック・予約・口コミといった複数の指標の積み上げで効果を見ていることを説明し、来店につながる導線が改善している点を具体的にお伝えします。",
    },
  ];

  const closing = `本日は以上になります。引き続き${req.storeName}の集客が伸びるよう、来月もしっかり伴走してまいります。ご不明な点やご要望があれば、いつでもお気軽にお申し付けください。本日はありがとうございました。`;

  const talkingTips = [
    "数字は必ず「前期比」とセットで伝え、良し悪しの解釈を一言添える。",
    "課題を話すときは、必ず「対策」とセットで前向きに伝える。",
    "専門用語（インプレッション等）は『表示された回数』など平易に言い換える。",
    "断定せず「〜の傾向」「〜の可能性」と表現し、過度な期待を持たせない。",
    "最後は来月の優先施策を1つに絞って合意を取ると、次の動きがスムーズになる。",
  ];

  return {
    opening,
    agenda,
    sections,
    expectedQuestions,
    closing,
    talkingTips,
  };
}
