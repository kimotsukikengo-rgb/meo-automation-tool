import {
  EMOJI_POLICY_RANGE,
  EmojiPolicy,
  Length,
  LENGTH_TARGET,
  PostPattern,
  QualityItem,
  TONE_LABELS,
} from "./types";

/**
 * 生成テキストの「決定論チェック」。LLMを使わずコードで合格基準を判定する。
 * ハードfail（文字数・HT・絵文字・構成比・トーンラベル混入）は自動再生成のトリガー。
 * 重複・KWは warn（参考表示）。
 */

/** 文字数（絵文字・日本語をコードポイント単位で数える） */
export function countChars(text: string): number {
  return [...text].length;
}

/** 絵文字の数（ZWJ連結は1つとして数える） */
export function countEmoji(text: string): number {
  const re = /\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*/gu;
  const m = text.match(re);
  return m ? m.length : 0;
}

/** ハッシュタグ（半角#・全角＃）を含むか */
export function hasHashtag(text: string): boolean {
  return /[#＃]/.test(text);
}

/** 避けたい定型句の最大連続出現数 */
export const REPEAT_PHRASES = [
  "することができます",
  "となっております",
  "ぜひこの機会に",
  "お立ち寄りください",
  "お探しの方",
];

export function maxPhraseRepetition(text: string, phrases = REPEAT_PHRASES): number {
  let max = 0;
  for (const p of phrases) {
    const count = text.split(p).length - 1;
    if (count > max) max = count;
  }
  return max;
}

/** 本文に文体名（トーンラベル）が直書きされていないか */
export function containsToneLabel(text: string): boolean {
  return Object.values(TONE_LABELS).some((label) => text.includes(label));
}

export interface QualityContext {
  length: Length;
  emojiPolicy: EmojiPolicy;
  area: string;
  category: string;
  mainServices: string;
}

function status(ok: boolean, warnOnly = false): "pass" | "warn" | "fail" {
  if (ok) return "pass";
  return warnOnly ? "warn" : "fail";
}

/** 1パターンを合格基準で判定する */
export function checkQuality(
  pattern: Pick<PostPattern, "body" | "cta" | "meoKeywords">,
  ctx: QualityContext,
): { items: QualityItem[]; hardFail: boolean } {
  const body = pattern.body;
  const cta = pattern.cta;
  const bodyLen = countChars(body);
  const ctaLen = countChars(cta);
  const total = bodyLen + ctaLen;

  const items: QualityItem[] = [];

  // 文字数: 下限割れ=fail / 上限超え=warn
  const range = LENGTH_TARGET[ctx.length];
  let lenStatus: "pass" | "warn" | "fail" = "pass";
  let lenDetail = `${bodyLen}字（目安 ${range.min}〜${range.max}字）`;
  if (bodyLen < range.min) {
    lenStatus = "fail";
    lenDetail = `${bodyLen}字（下限 ${range.min}字を下回る）`;
  } else if (bodyLen > range.max) {
    lenStatus = "warn";
    lenDetail = `${bodyLen}字（上限 ${range.max}字を超過）`;
  }
  items.push({ key: "length", label: "文字数", status: lenStatus, detail: lenDetail });

  // ハッシュタグ: 混入=fail（GBPは0個）
  const ht = hasHashtag(body) || hasHashtag(cta);
  items.push({
    key: "hashtag",
    label: "ハッシュタグ",
    status: status(!ht),
    detail: ht ? "本文/CTAに「#」が含まれる（GBPはHT不可）" : "なし（OK）",
  });

  // 絵文字: 方針レンジ外=fail
  const emojiCount = countEmoji(body);
  const er = EMOJI_POLICY_RANGE[ctx.emojiPolicy];
  const emojiOk = emojiCount >= er.min && emojiCount <= er.max;
  items.push({
    key: "emoji",
    label: "絵文字",
    status: status(emojiOk),
    detail: `${emojiCount}個（方針 ${er.min}〜${er.max}個）`,
  });

  // トーンラベル混入: あり=fail
  const toneLeak = containsToneLabel(body);
  items.push({
    key: "toneLeak",
    label: "文体名の直書き",
    status: status(!toneLeak),
    detail: toneLeak ? "文体名（例「丁寧・落ち着いた」）が本文に出現" : "なし（OK）",
  });

  // 構成比: CTAが空 or CTA比率が大きすぎ=fail、その他は warn/pass
  const openingLen = countChars(body.split(/\n\s*\n/)[0] ?? "");
  const ctaRatio = total > 0 ? ctaLen / total : 0;
  const openingRatio = total > 0 ? openingLen / total : 0;
  const mainRatio = total > 0 ? (bodyLen - openingLen) / total : 0;
  let structStatus: "pass" | "warn" | "fail" = "pass";
  if (ctaLen === 0) {
    structStatus = "fail";
  } else if (ctaRatio > 0.25) {
    structStatus = "fail";
  } else {
    const within =
      openingRatio >= 0.15 &&
      openingRatio <= 0.25 &&
      mainRatio >= 0.6 &&
      mainRatio <= 0.75 &&
      ctaRatio >= 0.05 &&
      ctaRatio <= 0.15;
    structStatus = within ? "pass" : "warn";
  }
  items.push({
    key: "structure",
    label: "構成比",
    status: structStatus,
    detail: `冒頭${Math.round(openingRatio * 100)}% / 本文${Math.round(
      mainRatio * 100,
    )}% / CTA${Math.round(ctaRatio * 100)}%`,
  });

  // 定型句の重複: 3回以上=warn
  const rep = maxPhraseRepetition(`${body}\n${cta}`);
  items.push({
    key: "repetition",
    label: "定型句の重複",
    status: status(rep < 3, true),
    detail: rep >= 3 ? `定型句が${rep}回出現` : "OK",
  });

  // KW含有: 地名 or サービス/業種が本文に含まれるか=warn
  const kwTokens = [ctx.area, ctx.category, ctx.mainServices]
    .filter(Boolean)
    .flatMap((s) => s.split(/[、,／/・\s]+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const kwHit = kwTokens.filter((t) => body.includes(t)).length;
  items.push({
    key: "keyword",
    label: "MEOキーワード含有",
    status: status(kwHit >= 1, true),
    detail: kwHit >= 1 ? `本文に${kwHit}語含む` : "地名/サービス名が本文に見当たらない",
  });

  const hardFail = items.some((it) => it.status === "fail");
  return { items, hardFail };
}
