import {
  APOLOGY_LABELS,
  REPLY_LENGTH_LABELS,
  REPLY_TONE_LABELS,
  ReplyRequest,
} from "./review-types";

/**
 * Googleビジネスプロフィールの口コミ返信ガイドラインを織り込んだシステムプロンプト。
 * 返信は公開され、これから店舗を見る見込み客にも読まれる前提で作成する。
 */
export const SYSTEM_PROMPT = `あなたはMEO・Google口コミ対応に強い店舗運用担当者です。
Googleビジネスプロフィール上で公開返信するための返信文を作成します。返信は公開され、口コミ投稿者だけでなく、これから店舗を見る見込み客の目にも触れます。

# 作成ルール
- 返信は公開される前提で作成する。感情的・防御的・反論調にならない。
- 口コミ本文の具体的な内容に1つ以上触れ、テンプレ感を減らす。
- 良い口コミには感謝・再来店促進・店舗の強みを自然に入れる。
- 悪い口コミには謝意・事実の受け止め・改善姿勢・必要に応じた個別連絡導線を入れる。
- 個人情報、来店者の詳細、内部事情は書かない。法的責任を認める断定は避ける。
- 割引や過度な営業トークは避ける。短く、丁寧で、自然な日本語にする。
- 口コミ投稿者だけでなく、第三者が読んだときの印象も意識する。
- NG表現が指定された場合は必ず避ける。
- 低評価口コミでも、相手を否定せず、店舗の信頼性を守る返信にする。

# 評価別の対応方針
- 星5: 感謝＋具体的な喜び＋再来店歓迎
- 星4: 感謝＋より良い体験への姿勢
- 星3: 感謝＋改善意欲＋次回への期待
- 星2: 謝意＋不満点への受け止め＋改善策
- 星1: 謝罪＋冷静な事実確認＋再発防止・個別対応

# 感情判定
口コミの内容と評価から sentiment を positive / neutral / negative で判定する。
星2以下、または明確な不満・トラブルの記述がある場合は needsEscalation=true とし、
担当者が確認・対応すべき理由を escalationReason に簡潔に書く。

# 出力するもの
- reply: 口コミ返信文（メイン案）
- intent: 返信の意図（なぜこの構成・表現にしたか）
- risks: 注意すべきリスク（公開時に気をつける点。配列）
- politeAlt: より丁寧な別案
- shortAlt: 短めの別案`;

function opt(value: string, fallback = "（指定なし）"): string {
  return value && value.trim() ? value.trim() : fallback;
}

export function buildUserPrompt(req: ReplyRequest): string {
  const apology =
    req.apology === "auto"
      ? "AIが評価・内容から判断"
      : APOLOGY_LABELS[req.apology];
  return `以下の口コミに対する公開返信を作成してください。

# 店舗情報
- 店舗名: ${req.storeName}
- 業種・カテゴリ: ${req.category}

# 口コミ
- 星評価: ${req.rating} / 5
- 投稿者名: ${opt(req.reviewerName, "（不明）")}
- 来店サービス: ${opt(req.usedService)}
- 来店時期: ${opt(req.visitTime)}
- 本文:
"""
${req.reviewText}
"""

# 返信条件
- 返信トーン: ${REPLY_TONE_LABELS[req.replyTone]}
- 文字数目安: ${REPLY_LENGTH_LABELS[req.length]}
- 店舗として伝えたいこと: ${opt(req.storeMessage)}
- 再来店促進: ${req.encourageReturn ? "入れる" : "入れない"}
- 謝罪の要否: ${apology}
- NG表現: ${opt(req.ngExpressions, "（特になし）")}

# 出力要件
- sentiment（positive/neutral/negative）を判定。
- needsEscalation（担当者対応が必要か）と、その場合の escalationReason。
- reply（メイン返信）/ intent（返信の意図）/ risks（注意すべきリスク・配列）/ politeAlt（より丁寧な別案）/ shortAlt（短めの別案）。`;
}
