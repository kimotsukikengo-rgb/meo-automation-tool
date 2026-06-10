import {
  GenerateRequest,
  LENGTH_LABELS,
  LENGTH_TARGET,
  POST_TYPE_LABELS,
  TONE_LABELS,
} from "./types";

/**
 * Googleビジネスプロフィール投稿のガイドラインを織り込んだシステムプロンプト。
 * GBPのローカル投稿は最大1500字だが、実務上は冒頭で要点が伝わる短文が有効。
 */
export const SYSTEM_PROMPT = `あなたは日本のMEO（Googleビジネスプロフィール最適化）運用の専門コピーライターです。
店舗のローカル投稿（Google ビジネスプロフィールの「最新情報・特典・イベント」投稿）に使う日本語の本文を作成します。

# 守るべきルール
- 投稿の冒頭1〜2文で最も伝えたい価値が伝わるようにする（一覧では先頭しか表示されないため）。
- 誇大表現・根拠のない最上級（「日本一」「絶対」等）や、医療・効果効能の断定は避ける。
- 電話番号やURLを本文に直書きしない（GBPはボタンで設定するため）。
- 絵文字は最大2個まで。多用しない。トーンに合う場合のみ使う。
- 同じ投稿でも案ごとに切り口（訴求軸）を変え、テンプレ感が出ないようにする。
- ハッシュタグは検索されうる地域名・サービス名を中心に2〜4個。
- CTA（行動喚起）は1文で、来店・予約・問い合わせなど投稿目的に沿うもの。`;

export function buildUserPrompt(req: GenerateRequest): string {
  const targetChars = LENGTH_TARGET[req.length];
  return `以下の店舗・条件で、Googleビジネスプロフィールのローカル投稿の本文案を${req.count}案、作成してください。

# 店舗情報
- 店舗名: ${req.storeName}
- 業種・カテゴリ: ${req.category}

# 投稿条件
- 投稿タイプ: ${POST_TYPE_LABELS[req.postType]}
- 投稿テーマ: ${req.theme}
- 強調したい訴求ポイント: ${req.keyPoints || "（指定なし。テーマから適切に補完してください）"}
- トーン: ${TONE_LABELS[req.tone]}
- 文字数の目安: ${LENGTH_LABELS[req.length]}（本文は${targetChars}字前後を上限の目安に）

# 出力要件
- ${req.count}案それぞれ、訴求の切り口を変えること。
- 各案について「本文」「ハッシュタグ（2〜4個）」「CTA（1文）」を出すこと。`;
}
