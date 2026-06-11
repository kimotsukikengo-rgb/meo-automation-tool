import { GenerateRequest, LENGTH_LABELS, LENGTH_TARGET, TONE_LABELS } from "./types";

/**
 * MEO投稿文生成のシステムプロンプト。
 * Google検索・Googleマップで店舗を見たユーザーの来店・予約・問い合わせを促す
 * ローカルSEO担当者として、3パターンの投稿文を作成する。
 */
export const SYSTEM_PROMPT = `あなたはMEO・Googleビジネスプロフィール運用に強いローカルSEO担当者です。
Google検索・Googleマップで店舗を見たユーザーに対して、来店・予約・問い合わせ・サービス理解を促す投稿文を作成します。

# 作成ルール
- MEO対策を意識し、地域名・業種名・サービス名を自然に含める（不自然なキーワード詰め込みはしない）。
- ユーザーが「行ってみたい」「予約したい」と思える具体性を入れる。
- 誇大表現・断定表現・根拠のないNo.1表現は避ける。
- 電話番号は本文に入れない。CTAは予約・詳細確認・来店促進に寄せる。
- 季節性・悩み・利用シーン・ベネフィットをできるだけ入れる。
- Googleビジネスプロフィールに掲載しても違和感のない、自然な文章にする。
- セールス色を強くしすぎず、店舗からのお知らせとして自然に見えるようにする。
- 本文の冒頭1〜2文で最も伝えたい価値が伝わるようにする（一覧では先頭しか表示されないため）。
- NG表現が指定された場合は必ず避ける。

# 投稿パターン（必ず3パターンすべて作成）
- visit（来店促進型）: 来店・予約の後押しを主目的に。
- problem（悩み解決型）: ターゲットの悩み・課題を起点にベネフィットへつなげる。
- announce（キャンペーン・お知らせ型）: キャンペーン／イベント／新情報のお知らせとして自然に。

# 各パターンで出すもの
- title: 投稿タイトル案
- body: 投稿本文（指定の文字数目安を上限の目安に）
- cta: CTA文（1文。予約・詳細確認・来店促進。電話番号は書かない）
- searchIntent: 狙っている検索意図
- meoKeywords: 含めたMEOキーワード（地域名・業種・サービス中心に3〜6語）
- notes: 改善案・注意点`;

/** 任意項目の表示（未入力時はフォールバック文言） */
function opt(value: string, fallback = "（指定なし）"): string {
  return value && value.trim() ? value.trim() : fallback;
}

/**
 * 投稿に使う画像が添付された場合に、ユーザープロンプトへ付け足す指示。
 * Claude に Read ツールで画像を読み込ませ、内容を踏まえた投稿文にさせる。
 */
export function buildImagePromptSection(imagePath: string): string {
  return `

# 添付画像（重要）
この投稿に使用する画像が添付されています。まず Read ツールで次の画像ファイルを読み込み、写っている被写体・雰囲気・色味・シーンを把握してください。
画像パス: ${imagePath}
把握した内容を投稿文に自然に反映し、画像と矛盾する表現（写っていないメニュー・季節感・人数など）は避けてください。`;
}

export function buildUserPrompt(req: GenerateRequest): string {
  const target = LENGTH_TARGET[req.length];
  return `以下の店舗情報をもとに、Googleビジネスプロフィール投稿用の投稿文を3パターン（visit / problem / announce）作成してください。

# 入力情報
- 店舗名: ${req.storeName}
- 業種: ${req.category}
- エリア: ${opt(req.area)}
- 主なサービス: ${opt(req.mainServices)}
- 投稿テーマ: ${req.theme}
- ターゲット顧客: ${opt(req.targetCustomer)}
- 今回伝えたい内容: ${opt(req.message)}
- キャンペーン・イベント: ${opt(req.campaign, "なし")}
- 希望CTA: ${opt(req.desiredCta, "（指定なし。投稿目的に沿って適切に設定）")}
- 予約URL / 詳細URL: ${opt(req.url, "（未指定。本文にURLは直書きしない）")}
- 店舗の強み: ${opt(req.strengths)}
- NG表現: ${opt(req.ngExpressions, "（特になし）")}
- 文体: ${TONE_LABELS[req.tone]}
- 文字数目安: ${LENGTH_LABELS[req.length]}（本文は${target}字前後を上限の目安に）

# 出力要件
- visit / problem / announce の3パターンを作成すること。
- 各パターンに title / body / cta / searchIntent / meoKeywords / notes を含めること。`;
}
