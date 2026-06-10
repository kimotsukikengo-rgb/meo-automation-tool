import {
  ReplyRequest,
  ReplyResponse,
  ReplyVariation,
  Sentiment,
} from "./review-types";

/**
 * APIキー未設定時のサンプル生成。
 * Claudeを呼ばずに、星評価と簡易キーワードから感情・エスカレーションを推定し、
 * トーンに沿った返信案を組み立てて返す。
 */

const NEGATIVE_HINTS = [
  "最悪",
  "二度と",
  "ひどい",
  "遅い",
  "汚い",
  "不快",
  "態度",
  "がっかり",
  "残念",
  "クレーム",
  "返金",
  "謝罪",
];

function detectSentiment(req: ReplyRequest): Sentiment {
  const hasNegativeWord = NEGATIVE_HINTS.some((w) =>
    req.reviewText.includes(w),
  );
  if (req.rating <= 2 || hasNegativeWord) return "negative";
  if (req.rating >= 4) return "positive";
  return "neutral";
}

function buildPositiveReplies(req: ReplyRequest): string[] {
  const name = req.reviewerName ? `${req.reviewerName}様、` : "";
  return [
    `${name}この度は${req.storeName}へ温かいクチコミをいただき、誠にありがとうございます。スタッフ一同、大変励みになりました。またのご来店を心よりお待ちしております。`,
    `${name}うれしいお言葉をありがとうございます。お気に召していただけたようで何よりです。次回はさらにご満足いただけるよう努めてまいりますので、ぜひまたお立ち寄りください。`,
    `${name}貴重なお時間に評価をいただきありがとうございます。${req.category}として、これからも丁寧な対応を心がけてまいります。またお会いできる日を楽しみにしております。`,
  ];
}

function buildNeutralReplies(req: ReplyRequest): string[] {
  const name = req.reviewerName ? `${req.reviewerName}様、` : "";
  return [
    `${name}この度はご来店およびクチコミをいただきありがとうございます。いただいたご感想を今後のサービス向上に活かしてまいります。またのお越しをお待ちしております。`,
    `${name}ご意見をお寄せいただきありがとうございます。よりご満足いただけるよう改善に努めてまいりますので、引き続きよろしくお願いいたします。`,
  ];
}

function buildNegativeReplies(req: ReplyRequest): string[] {
  const name = req.reviewerName ? `${req.reviewerName}様、` : "";
  return [
    `${name}この度はご不便とご不快な思いをおかけし、誠に申し訳ございません。いただいたご指摘を真摯に受け止め、改善に努めてまいります。差し支えなければ、状況を詳しく伺いたく存じますので、お手数ですが店舗までご連絡いただけますと幸いです。`,
    `${name}貴重なご意見をいただきありがとうございます。ご期待に沿えなかったこと、心よりお詫び申し上げます。今後同様のことがないよう、スタッフ間で共有し対応を見直してまいります。詳細について直接お話を伺えればと思いますので、ご連絡をお待ちしております。`,
    `${name}ご来店の際に不十分な点があり、大変申し訳ございませんでした。お寄せいただいた内容は重く受け止めております。改めてお詫びとご説明をさせていただきたく、よろしければ店舗までお問い合わせください。`,
  ];
}

export function generateMockReply(req: ReplyRequest): ReplyResponse {
  const sentiment = detectSentiment(req);

  const pool =
    sentiment === "negative"
      ? buildNegativeReplies(req)
      : sentiment === "positive"
        ? buildPositiveReplies(req)
        : buildNeutralReplies(req);

  const replies: ReplyVariation[] = pool
    .slice(0, req.count)
    .map((body) => ({ body, charCount: [...body].length }));

  const needsEscalation = sentiment === "negative";

  return {
    sentiment,
    needsEscalation,
    escalationReason: needsEscalation
      ? `星${req.rating}・否定的な内容のため、返信前に担当者が状況を確認することを推奨します。`
      : undefined,
    replies,
    source: "mock",
  };
}
