import {
  EMOJI_POLICY_LABELS,
  EMOJI_POLICY_RANGE,
  GenerateRequest,
  LENGTH_LABELS,
  LENGTH_TARGET,
  TONE_LABELS,
} from "./types";

/**
 * MEO投稿文生成のシステムプロンプト。
 * Google検索・Googleマップで店舗を見たユーザーの来店・予約・問い合わせを促す
 * ローカルSEO担当者として、3パターンの投稿文を作成する。
 */
export const SYSTEM_PROMPT = `あなたはMEO・Googleビジネスプロフィール（GBP）運用に強いローカルSEO担当者です。
Google検索・Googleマップで店舗を見たユーザーに対して、来店・予約・問い合わせ・サービス理解を促す投稿文を作成します。

# 文章の方針（最重要）
- 読者の視線を止める「強い冒頭フック」を1〜2文で置く。型は投稿ごとに変える（疑問・共感・具体シーン・意外な数値・ベネフィット等）。毎回同じ「〜でお困りではないですか？」だけにしない。
- タイトルは「何が分かる投稿か」が伝わる見出しにする。可能なら数値や具体性を入れる（例「相続放棄が増えている4つの理由｜過去最高の約28万件に」）。
- 本文は 見出し→要点（箇条書き）→まとめ の構造で読みやすくする。
- 専門用語は初出にふりがな・一言定義を添える（例「遺留分（いりゅうぶん）とは〜」）。
- 1段落3〜5行を目安に改行・空行を入れ、モバイルで読みやすくする。

# MEO・GBPのルール
- 地域名・業種名・サービス名を自然に含める（不自然なキーワード詰め込みはしない）。対策キーワードは1〜2個を自然な文脈で。
- ハッシュタグは絶対に使わない（GBP投稿にHTは効果ゼロ）。本文・CTAに「#」を入れない。
- 電話番号は本文に入れない。CTAは予約・詳細確認・来店促進に寄せ、1文で完結。CTAの定型句を投稿間で使い回さない。
- 誇大表現・断定表現・根拠のないNo.1表現は避ける。NG表現が指定された場合は必ず避ける。
- セールス色を強くしすぎず、店舗からのお知らせとして自然に見せる。

# 絶対にやってはいけないこと
- 文体（トーン）の指定は「書き方」にのみ反映する。「丁寧・落ち着いた」「上質・高級感」などの文体名そのものを本文に書かない。
- 入力フィールドの生の値をそのまま貼り付けない。例：業種「司法書士／土地家屋調査士」のスラッシュをそのまま出さず、自然な日本語に整える。
- 「〜することができます」「〜となっております」等の定型句を3回以上繰り返さない。

# 文字数・構成
- 指定の文字数レンジを守る（下限を下回らない／上限を大きく超えない）。
- 構成比の目安: 冒頭フック15〜25% / 本文（メリット・具体情報）60〜75% / 締めCTA 5〜15%。

# 絵文字
- 指定の絵文字方針に従う。「なし」の場合は絵文字を一切使わない。使う場合は見出し・要点に意味を持たせて配置し、装飾過多にしない。

# 投稿パターン（必ず3パターンすべて作成・冒頭の型を変える）
- visit（来店促進型）: 来店・予約の後押しを主目的に。
- problem（悩み解決型）: ターゲットの悩み・課題を起点にベネフィットへつなげる。
- announce（キャンペーン・お知らせ型）: キャンペーン／イベント／新情報のお知らせとして自然に。

# 各パターンで出すもの
- title: 投稿タイトル案（何が分かる投稿かが伝わる見出し）
- body: 投稿本文（指定レンジの文字数・構成比・絵文字方針を守る）
- cta: CTA文（1文。予約・詳細確認・来店促進。電話番号・ハッシュタグは書かない）
- searchIntent: 狙っている検索意図
- meoKeywords: 含めたMEOキーワード（地域名・業種・サービス中心に3〜6語。「#」は付けない）
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
  const range = LENGTH_TARGET[req.length];
  const emoji = EMOJI_POLICY_RANGE[req.emojiPolicy];
  const emojiInstruction =
    req.emojiPolicy === "none"
      ? "絵文字は一切使わない"
      : `絵文字は1投稿あたり${emoji.min}〜${emoji.max}個（${EMOJI_POLICY_LABELS[req.emojiPolicy]}）。見出し・要点に意味づけして配置`;
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
- 文体: ${TONE_LABELS[req.tone]}（書き方に反映するだけ。この文体名を本文に書かない）
- 文字数: ${LENGTH_LABELS[req.length]} → 本文は${range.min}〜${range.max}字（${range.min}字を下回らない）
- 絵文字方針: ${emojiInstruction}

# 出力要件
- visit / problem / announce の3パターンを作成し、冒頭フックの型を3つで変えること。
- 各パターンに title / body / cta / searchIntent / meoKeywords / notes を含めること。
- ハッシュタグ・「#」・文体名の直書き・入力値のスラッシュ直貼りをしないこと。`;
}
