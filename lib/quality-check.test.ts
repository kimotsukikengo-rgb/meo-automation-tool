import { describe, expect, it } from "vitest";
import {
  checkQuality,
  containsToneLabel,
  countChars,
  countEmoji,
  hasHashtag,
  maxPhraseRepetition,
  QualityContext,
} from "./quality-check";

const ctx = (over: Partial<QualityContext> = {}): QualityContext => ({
  length: "standard",
  emojiPolicy: "standard",
  area: "渋谷",
  category: "リラクゼーション",
  mainServices: "もみほぐし",
  ...over,
});

/** standard帯（350〜500字）を満たす本文を作る */
function bodyOf(len: number): string {
  // 冒頭段落 + 空行 + 本文、で構成比を成立させる
  const opener = "肩こりにお悩みではありませんか？渋谷のもみほぐし専門店です。\n\n";
  const filler = "あ".repeat(Math.max(0, len - countChars(opener)));
  return opener + filler;
}

describe("countChars", () => {
  it("コードポイント単位で数える（絵文字含む）", () => {
    expect(countChars("あいう")).toBe(3);
    expect(countChars("a🎍b")).toBe(3);
  });
});

describe("countEmoji", () => {
  it("絵文字の数を数える", () => {
    expect(countEmoji("こんにちは")).toBe(0);
    expect(countEmoji("🎍✨🌅")).toBe(3);
  });
  it("ZWJ連結は1つとして数える", () => {
    expect(countEmoji("👨‍👩‍👧‍👦")).toBe(1);
  });
});

describe("hasHashtag", () => {
  it("半角#・全角＃を検出する", () => {
    expect(hasHashtag("テキスト #タグ")).toBe(true);
    expect(hasHashtag("テキスト ＃タグ")).toBe(true);
    expect(hasHashtag("ハッシュタグなし")).toBe(false);
  });
});

describe("maxPhraseRepetition", () => {
  it("定型句の最大出現数を返す", () => {
    const t = "することができます。することができます。することができます。";
    expect(maxPhraseRepetition(t)).toBe(3);
    expect(maxPhraseRepetition("普通の文章です")).toBe(0);
  });
});

describe("containsToneLabel", () => {
  it("文体名の直書きを検出する", () => {
    expect(containsToneLabel("上質・高級感雰囲気でお届けします")).toBe(true);
    expect(containsToneLabel("丁寧・落ち着いた雰囲気で")).toBe(true);
    expect(containsToneLabel("落ち着いた空間でお過ごしください")).toBe(false);
  });
});

describe("checkQuality", () => {
  it("基準を満たす本文は文字数・HT・トーンがpass", () => {
    const { items, hardFail } = checkQuality(
      { body: bodyOf(400) + "🎍✨🌅", cta: "ご予約はオンラインからどうぞ。", meoKeywords: [] },
      ctx(),
    );
    const byKey = Object.fromEntries(items.map((i) => [i.key, i.status]));
    expect(byKey.length).toBe("pass");
    expect(byKey.hashtag).toBe("pass");
    expect(byKey.toneLeak).toBe("pass");
    expect(hardFail).toBe(false);
  });

  it("下限割れの文字数はfail（ハードfail）", () => {
    const { items, hardFail } = checkQuality(
      { body: "短い本文です🎍✨", cta: "ご予約はこちら。", meoKeywords: [] },
      ctx(),
    );
    expect(items.find((i) => i.key === "length")?.status).toBe("fail");
    expect(hardFail).toBe(true);
  });

  it("ハッシュタグ混入はfail", () => {
    const { items, hardFail } = checkQuality(
      { body: bodyOf(400) + "🎍✨🌅 #渋谷 #もみほぐし", cta: "ご予約はこちら。", meoKeywords: [] },
      ctx(),
    );
    expect(items.find((i) => i.key === "hashtag")?.status).toBe("fail");
    expect(hardFail).toBe(true);
  });

  it("noneポリシーで絵文字ありはfail", () => {
    const { items } = checkQuality(
      { body: bodyOf(400) + "🎍", cta: "ご予約はこちら。", meoKeywords: [] },
      ctx({ emojiPolicy: "none" }),
    );
    expect(items.find((i) => i.key === "emoji")?.status).toBe("fail");
  });

  it("standardポリシーで絵文字ゼロはfail", () => {
    const { items } = checkQuality(
      { body: bodyOf(400), cta: "ご予約はこちら。", meoKeywords: [] },
      ctx({ emojiPolicy: "standard" }),
    );
    expect(items.find((i) => i.key === "emoji")?.status).toBe("fail");
  });

  it("トーンラベル直書きはfail", () => {
    const { items, hardFail } = checkQuality(
      {
        body: bodyOf(380) + "🎍✨を、上質・高級感雰囲気でお届けします。",
        cta: "ご予約はこちら。",
        meoKeywords: [],
      },
      ctx(),
    );
    expect(items.find((i) => i.key === "toneLeak")?.status).toBe("fail");
    expect(hardFail).toBe(true);
  });

  it("CTAが空なら構成比fail", () => {
    const { items } = checkQuality(
      { body: bodyOf(400) + "🎍✨🌅", cta: "", meoKeywords: [] },
      ctx(),
    );
    expect(items.find((i) => i.key === "structure")?.status).toBe("fail");
  });
});
