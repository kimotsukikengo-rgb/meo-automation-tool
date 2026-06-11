import { ReplyRequest, ReplyResponse, Sentiment } from "./review-types";

/**
 * APIキー未設定時のサンプル生成。
 * Claudeを呼ばずに、星評価と簡易キーワードから感情・エスカレーションを推定し、
 * トーンに沿った返信文・意図・リスク・別案を組み立てて返す。
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
  const hasNegativeWord = NEGATIVE_HINTS.some((w) => req.reviewText.includes(w));
  if (req.rating <= 2 || hasNegativeWord) return "negative";
  if (req.rating >= 4) return "positive";
  return "neutral";
}

function namePrefix(req: ReplyRequest): string {
  return req.reviewerName ? `${req.reviewerName}様、` : "";
}

function serviceClause(req: ReplyRequest): string {
  return req.usedService ? `${req.usedService}のご利用、` : "";
}

function returnClause(req: ReplyRequest): string {
  return req.encourageReturn
    ? "またのご来店を心よりお待ちしております。"
    : "今後ともよろしくお願いいたします。";
}

function buildPositive(req: ReplyRequest): {
  reply: string;
  politeAlt: string;
  shortAlt: string;
} {
  const name = namePrefix(req);
  const svc = serviceClause(req);
  const ret = returnClause(req);
  const msg = req.storeMessage ? `${req.storeMessage} ` : "";
  return {
    reply: `${name}この度は${svc}${req.storeName}へ温かいクチコミをいただき、誠にありがとうございます。スタッフ一同、大変励みになりました。${msg}${ret}`,
    politeAlt: `${name}このたびは${req.storeName}に身に余るお言葉を頂戴し、心より御礼申し上げます。${svc}お気に召していただけたご様子を拝見し、スタッフ一同大変うれしく存じます。${msg}今後もご期待に沿えるよう努めてまいります。${ret}`,
    shortAlt: `${name}うれしいお言葉をありがとうございます！${ret}`,
  };
}

function buildNeutral(req: ReplyRequest): {
  reply: string;
  politeAlt: string;
  shortAlt: string;
} {
  const name = namePrefix(req);
  const svc = serviceClause(req);
  const ret = returnClause(req);
  const msg = req.storeMessage ? `${req.storeMessage} ` : "";
  return {
    reply: `${name}この度は${svc}ご来店およびクチコミをいただきありがとうございます。いただいたご感想を今後のサービス向上に活かしてまいります。${msg}${ret}`,
    politeAlt: `${name}このたびはご利用とご感想をお寄せいただき、誠にありがとうございます。頂戴したお声を真摯に受け止め、より良いサービスのために改善を重ねてまいります。${msg}${ret}`,
    shortAlt: `${name}ご感想をありがとうございます。改善に努めてまいります。${ret}`,
  };
}

function buildNegative(req: ReplyRequest): {
  reply: string;
  politeAlt: string;
  shortAlt: string;
} {
  const name = namePrefix(req);
  const svc = serviceClause(req);
  const msg = req.storeMessage ? `${req.storeMessage} ` : "";
  return {
    reply: `${name}この度は${svc}ご不便とご不快な思いをおかけし、誠に申し訳ございません。いただいたご指摘を真摯に受け止め、改善に努めてまいります。${msg}差し支えなければ状況を詳しく伺いたく存じますので、お手数ですが店舗までご連絡いただけますと幸いです。`,
    politeAlt: `${name}このたびはご期待に沿うことができず、心よりお詫び申し上げます。頂戴したご意見はスタッフ間で共有し、再発防止と対応の見直しに努めてまいります。${msg}よろしければ改めてお詫びとご説明をさせていただきたく、店舗までご一報いただけますと幸いです。`,
    shortAlt: `${name}この度はご不快な思いをおかけし申し訳ございません。改善に努めます。差し支えなければ店舗までご連絡ください。`,
  };
}

export function generateMockReply(req: ReplyRequest): ReplyResponse {
  const sentiment = detectSentiment(req);
  const built =
    sentiment === "negative"
      ? buildNegative(req)
      : sentiment === "positive"
        ? buildPositive(req)
        : buildNeutral(req);

  const needsEscalation = sentiment === "negative";

  const risks: string[] =
    sentiment === "negative"
      ? [
          "事実確認ができていない段階での断定・謝罪の範囲に注意。",
          "個人情報や来店詳細を返信に書かない。",
          "公開の場での反論・言い訳は信頼を損なうため避ける。",
        ]
      : [
          "テンプレ的に見えないよう、口コミ内容への具体的な言及を残す。",
          "過度な営業・割引訴求は避ける。",
        ];

  return {
    sentiment,
    needsEscalation,
    escalationReason: needsEscalation
      ? `星${req.rating}・否定的な内容のため、返信前に担当者が状況を確認することを推奨します。`
      : undefined,
    reply: built.reply,
    intent:
      sentiment === "negative"
        ? "まず謝意を示して感情を受け止め、公開の場では論争せず、改善姿勢と個別連絡導線で信頼回復を図る構成にしています。"
        : "感謝を起点に口コミ内容へ具体的に触れ、第三者が読んでも好印象となるよう自然な再来店促進を添えています。",
    risks,
    politeAlt: built.politeAlt,
    shortAlt: built.shortAlt,
    source: "mock",
  };
}
