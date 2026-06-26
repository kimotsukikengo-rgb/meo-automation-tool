import {
  GenerateRequest,
  POST_PATTERNS,
  POST_PATTERN_LABELS,
  PostPattern,
  PostPatternKey,
} from "./types";

/**
 * APIキー未設定時のサンプル生成。
 * Claudeを呼ばずに、入力値を織り込んだ「それらしい」3パターンの投稿案を即時に返す。
 * 試作のUI・体験を、鍵なしでも確認できるようにするのが目的。
 */

const TONE_OPENER: Record<string, string> = {
  friendly: "こんにちは！",
  polite: "いつもありがとうございます。",
  energetic: "お待たせしました！",
  premium: "上質なひとときを。",
};

/** 共通の素材 */
function ingredients(req: GenerateRequest) {
  const where = req.area ? `${req.area}の` : "";
  const services = req.mainServices || req.category;
  const point = req.strengths || req.message || `${req.theme}の魅力`;
  const cta = req.desiredCta || "ご予約・ご来店をお待ちしております。";
  return { where, services, point, cta };
}

function keywords(req: GenerateRequest): string[] {
  const base = [req.area, req.category, req.mainServices]
    .filter((s): s is string => Boolean(s))
    .flatMap((s) => s.split(/[、,／/・\s]+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const theme = req.theme.slice(0, 12);
  return Array.from(new Set([...base, theme])).slice(0, 6);
}

function buildPattern(
  req: GenerateRequest,
  key: PostPatternKey,
): Omit<PostPattern, "charCount"> {
  const opener = TONE_OPENER[req.tone] ?? "";
  const { where, services, point, cta } = ingredients(req);

  if (key === "visit") {
    const body = `${opener}${where}${req.storeName}です。「${req.theme}」をご案内します。${point}をご用意してお待ちしています。${req.category}をご検討中の方は、お気軽にどうぞ。`;
    return {
      patternKey: key,
      patternLabel: POST_PATTERN_LABELS[key],
      title: `${where}${req.category}なら｜${req.theme}`,
      body,
      cta,
      searchIntent: `「${req.area || "エリア"} ${req.category}」で来店先を比較検討しているユーザー`,
      meoKeywords: keywords(req),
      notes:
        "本文冒頭に地域名＋業種が来るよう調整済み。予約URLはボタンに設定し、本文には直書きしないでください。",
    };
  }

  if (key === "problem") {
    const target = req.targetCustomer || "こんなお悩みをお持ちの方";
    const body = `${opener}「${req.theme}」でお困りではありませんか？${where}${req.storeName}では、${target}に向けて${services}をご提供しています。${point}で、はじめての方にも安心してご利用いただけます。`;
    return {
      patternKey: key,
      patternLabel: POST_PATTERN_LABELS[key],
      title: `その悩み、${where}${req.category}にご相談ください`,
      body,
      cta: req.desiredCta || "まずはお気軽に詳細をご確認ください。",
      searchIntent: "悩み・症状・目的から解決手段を探している潜在顧客",
      meoKeywords: keywords(req),
      notes:
        "悩み訴求は誇大・効果効能の断定にならないよう注意。具体的な利用シーンを1つ足すとさらに刺さります。",
    };
  }

  // announce
  const campaign = req.campaign || req.theme;
  const body = `${opener}${where}${req.storeName}より、${campaign}のお知らせです。${point}をこの機会にぜひご体験ください。${services}をご検討中の方は、詳細をご覧のうえお早めにどうぞ。`;
  return {
    patternKey: key,
    patternLabel: POST_PATTERN_LABELS[key],
    title: `【お知らせ】${campaign}`,
    body,
    cta: req.desiredCta || "詳細の確認・ご予約はこちらから。",
    searchIntent: "店舗名・キャンペーン名で最新情報を確認しにきたユーザー",
    meoKeywords: keywords(req),
    notes: "お知らせ型は期間・条件の明記が有効。終了後は投稿の更新・削除を忘れずに。",
  };
}

export function generateMockPatterns(req: GenerateRequest): PostPattern[] {
  return POST_PATTERNS.map((key) => {
    const p = buildPattern(req, key);
    return { ...p, charCount: [...p.body].length };
  });
}
