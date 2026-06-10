import {
  GenerateRequest,
  PostVariation,
  POST_TYPE_LABELS,
  TONE_LABELS,
} from "./types";

/**
 * APIキー未設定時のサンプル生成。
 * Claudeを呼ばずに、入力値を織り込んだ「それらしい」投稿案を即時に返す。
 * 試作のUI・体験を、鍵なしでも確認できるようにするのが目的。
 */

const ANGLES = [
  { tag: "価値訴求", lead: "今いちばんおすすめしたいのは" },
  { tag: "お悩み起点", lead: "こんなお悩みはありませんか？" },
  { tag: "限定感", lead: "この時期だけの特別なご案内です。" },
  { tag: "実績・安心", lead: "多くのお客様にご利用いただいています。" },
  { tag: "ストーリー", lead: "スタッフの想いを込めてご用意しました。" },
];

const TONE_OPENER: Record<string, string> = {
  friendly: "こんにちは！",
  polite: "いつもありがとうございます。",
  energetic: "お待たせしました！",
  premium: "上質なひとときを。",
};

function buildBody(req: GenerateRequest, index: number): string {
  const angle = ANGLES[index % ANGLES.length];
  const opener = TONE_OPENER[req.tone] ?? "";
  const points = req.keyPoints
    ? req.keyPoints
    : `${req.theme}にまつわる魅力`;

  const lines = [
    `${opener}${req.storeName}です。`,
    `${angle.lead}「${req.theme}」。`,
    `${points}を、${TONE_LABELS[req.tone]}雰囲気でお届けします。`,
    `${req.category}をお探しの方は、ぜひこの機会にお立ち寄りください。`,
  ];
  return lines.join("");
}

function buildHashtags(req: GenerateRequest, index: number): string[] {
  const base = [req.category.replace(/\s+/g, ""), req.storeName.replace(/\s+/g, "")];
  const themeTag = req.theme.slice(0, 10).replace(/\s+/g, "");
  const extra = ["MEO", "地域密着", "新着情報"];
  return [...base, themeTag, extra[index % extra.length]]
    .filter(Boolean)
    .slice(0, 4)
    .map((t) => `#${t}`);
}

function buildCta(req: GenerateRequest, index: number): string {
  const ctas = [
    "詳しくはプロフィールのリンク、またはお電話でお問い合わせください。",
    "ご予約・ご来店をスタッフ一同お待ちしております。",
    `${POST_TYPE_LABELS[req.postType]}の詳細はお気軽にお尋ねください。`,
  ];
  return ctas[index % ctas.length];
}

export function generateMockVariations(req: GenerateRequest): PostVariation[] {
  return Array.from({ length: req.count }, (_, i) => {
    const body = buildBody(req, i);
    return {
      body,
      hashtags: buildHashtags(req, i),
      cta: buildCta(req, i),
      charCount: [...body].length,
    };
  });
}
