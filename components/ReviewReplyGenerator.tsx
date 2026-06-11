"use client";

import { useState } from "react";
import "./ui.css";
import "./review-reply.css";
import AppBar from "./AppBar";
import {
  ApologyMode,
  APOLOGY_LABELS,
  APOLOGY_MODES,
  ReplyLength,
  REPLY_LENGTHS,
  REPLY_LENGTH_LABELS,
  ReplyResponse,
  ReplyTone,
  REPLY_TONES,
  REPLY_TONE_LABELS,
  SENTIMENT_LABELS,
} from "@/lib/review-types";
import { usePersistentState } from "@/lib/usePersistentState";
import { useGbpStores } from "@/lib/useGbpStores";

interface FormState {
  storeName: string;
  category: string;
  rating: number;
  reviewText: string;
  reviewerName: string;
  usedService: string;
  visitTime: string;
  replyTone: ReplyTone;
  storeMessage: string;
  encourageReturn: boolean;
  apology: ApologyMode;
  ngExpressions: string;
  length: ReplyLength;
}

const INITIAL: FormState = {
  storeName: "",
  category: "",
  rating: 5,
  reviewText: "",
  reviewerName: "",
  usedService: "",
  visitTime: "",
  replyTone: "sincere",
  storeMessage: "",
  encourageReturn: true,
  apology: "auto",
  ngExpressions: "",
  length: "standard",
};

/** デモ用サンプル（押すたびに切り替わる：ネガ／ポジ／中立） */
const SAMPLES: FormState[] = [
  {
    storeName: "リラクゼーションサロン 月読 渋谷店",
    category: "リラクゼーション",
    rating: 2,
    reviewText:
      "施術はよかったのですが、予約時間より20分待たされました。受付の対応も少し残念でした。",
    reviewerName: "田中",
    usedService: "全身もみほぐし60分",
    visitTime: "先週末",
    replyTone: "sincere",
    storeMessage: "受付体制を見直し、待ち時間の短縮に取り組んでいます",
    encourageReturn: true,
    apology: "yes",
    ngExpressions: "言い訳・反論に聞こえる表現",
    length: "standard",
  },
  {
    storeName: "トラットリア・ソルレオーネ 横浜店",
    category: "イタリアン",
    rating: 5,
    reviewText:
      "記念日に利用しました。料理も雰囲気も最高で、スタッフの方の心遣いに感動しました。また絶対来ます！",
    reviewerName: "佐藤",
    usedService: "ディナーコース",
    visitTime: "記念日のディナー",
    replyTone: "warm",
    storeMessage: "記念日プランもご用意しています",
    encourageReturn: true,
    apology: "auto",
    ngExpressions: "",
    length: "standard",
  },
  {
    storeName: "hair atelier LUCE 表参道",
    category: "美容室",
    rating: 3,
    reviewText: "仕上がりは満足です。ただ、少し待ち時間が気になりました。",
    reviewerName: "",
    usedService: "カット＋カラー",
    visitTime: "平日午後",
    replyTone: "formal",
    storeMessage: "予約枠の調整で待ち時間の改善を進めています",
    encourageReturn: true,
    apology: "auto",
    ngExpressions: "",
    length: "short",
  },
];

const SENTIMENT_ICON: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "⚠️",
};

type CopyKey = "reply" | "polite" | "short";

/** GBP から取得した口コミ（UI 用の軽量型） */
interface GbpReviewLite {
  reviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string;
  hasReply: boolean;
}

export default function ReviewReplyGenerator() {
  const [form, setForm] = usePersistentState<FormState>("meo:review:form", INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = usePersistentState<ReplyResponse | null>(
    "meo:review:result",
    null,
  );
  const [reply, setReply] = usePersistentState<string>("meo:review:reply", "");
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const { stores: gbpStores } = useGbpStores();
  const [gbpStoreId, setGbpStoreId] = useState("");
  const [gbpReviews, setGbpReviews] = useState<GbpReviewLite[]>([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [replyPosting, setReplyPosting] = useState(false);
  const [replyPosted, setReplyPosted] = useState(false);

  const canSubmit =
    form.storeName.trim() && form.category.trim() && form.reviewText.trim();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function loadSample() {
    setForm(SAMPLES[sampleIdx % SAMPLES.length]);
    setSampleIdx((i) => i + 1);
  }

  function clearAll() {
    setForm(INITIAL);
    setResult(null);
    setReply("");
    setError(null);
  }

  async function handleGenerate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `生成に失敗しました (${res.status})`);
      }
      const data: ReplyResponse = await res.json();
      setResult(data);
      setReply(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(key: CopyKey, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1800);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  async function handleFetchReviews() {
    if (!gbpStoreId) {
      setError("先に取得元の店舗を選択してください");
      return;
    }
    setFetchingReviews(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gbp/reviews?storeId=${encodeURIComponent(gbpStoreId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `取得に失敗しました (${res.status})`);
      }
      type RawReview = {
        reviewId: string;
        reviewerName: string;
        starRating: number;
        comment: string;
        reply?: unknown;
      };
      setGbpReviews(
        (data.reviews ?? []).map((r: RawReview) => ({
          reviewId: r.reviewId,
          reviewerName: r.reviewerName,
          starRating: r.starRating,
          comment: r.comment,
          hasReply: Boolean(r.reply),
        })),
      );
      setSelectedReviewId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "口コミの取得に失敗しました");
    } finally {
      setFetchingReviews(false);
    }
  }

  function selectReview(r: GbpReviewLite) {
    setForm((prev) => ({
      ...prev,
      reviewText: r.comment,
      rating: r.starRating || prev.rating,
      reviewerName: r.reviewerName === "匿名" ? "" : r.reviewerName,
    }));
    setSelectedReviewId(r.reviewId);
    setReplyPosted(false);
  }

  async function handlePostReply() {
    if (!gbpStoreId || !selectedReviewId) {
      setError("GBPから取得した口コミを選択してください");
      return;
    }
    if (!reply.trim()) {
      setError("返信文が空です");
      return;
    }
    setReplyPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/gbp/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: gbpStoreId,
          reviewId: selectedReviewId,
          comment: reply,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `投稿に失敗しました (${res.status})`);
      }
      setReplyPosted(true);
      setTimeout(() => setReplyPosted(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "返信の投稿に失敗しました");
    } finally {
      setReplyPosting(false);
    }
  }

  const replyCount = [...reply].length;

  return (
    <div className="shell">
      <AppBar active="review" />

      <main className="main">
        <section className="intro">
          <span className="eyebrow">口コミ管理</span>
          <h1>口コミ返信生成</h1>
          <p>
            口コミ内容と条件を入力すると、公開返信文に加えて「返信の意図」「注意すべきリスク」
            「より丁寧な別案」「短めの別案」までAIが作成します。低評価は自動判定し担当者へ通知します。
          </p>
        </section>

        <div className="grid">
          {/* ---- 入力フォーム ---- */}
          <section className="formcard" aria-label="口コミ情報の入力">
            <div className="sample-bar">
              <button type="button" className="sample-btn" onClick={loadSample}>
                🎲 サンプルを入力
              </button>
              <button
                type="button"
                className="clear-btn"
                onClick={clearAll}
                disabled={loading}
              >
                🗑 クリア
              </button>
            </div>

            {gbpStores.length > 0 ? (
              <div className="gbp-panel">
                <div className="gbp-bar">
                  <label htmlFor="gbpReviewStore">GBP口コミ取得</label>
                  <select
                    id="gbpReviewStore"
                    value={gbpStoreId}
                    onChange={(e) => setGbpStoreId(e.target.value)}
                  >
                    <option value="">店舗を選択…</option>
                    {gbpStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeLabel}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    disabled={!gbpStoreId || fetchingReviews}
                    onClick={handleFetchReviews}
                  >
                    {fetchingReviews ? "取得中…" : "口コミを取得"}
                  </button>
                </div>
                {gbpReviews.length > 0 && (
                  <ul className="gbp-review-list">
                    {gbpReviews.map((r) => (
                      <li
                        key={r.reviewId}
                        className="gbp-review-item"
                        data-selected={selectedReviewId === r.reviewId}
                      >
                        <div className="gbp-review-top">
                          <span className="gbp-review-stars" aria-hidden>
                            {"★".repeat(r.starRating)}
                            {"☆".repeat(Math.max(0, 5 - r.starRating))}
                          </span>
                          <span className="gbp-review-name">
                            {r.reviewerName}
                          </span>
                          {r.hasReply && (
                            <span className="gbp-review-replied">返信済み</span>
                          )}
                        </div>
                        <p className="gbp-review-comment">{r.comment}</p>
                        <button
                          type="button"
                          className="sample-btn"
                          onClick={() => selectReview(r)}
                        >
                          この口コミで返信を作成
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="gbp-hint">
                GBPの口コミを取得・返信するには、<a href="/settings">設定・連携</a>
                で店舗を連携してください。
              </p>
            )}

            <div className="row2">
              <div className="field">
                <label htmlFor="storeName">
                  店舗名 <span className="hint">必須</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  placeholder="月読 渋谷店"
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="category">
                  業種 <span className="hint">必須</span>
                </label>
                <input
                  id="category"
                  type="text"
                  placeholder="リラクゼーション"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>口コミ評価</label>
              <div className="stars" role="group" aria-label="星評価">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-on={n <= form.rating}
                    aria-label={`${n}つ星`}
                    onClick={() => update("rating", n)}
                  >
                    ★
                  </button>
                ))}
                <span className="stars-value">{form.rating} / 5</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="reviewText">
                口コミ本文 <span className="hint">必須</span>
              </label>
              <textarea
                id="reviewText"
                style={{ minHeight: "120px" }}
                placeholder="例：施術はよかったのですが、予約時間より20分待たされました。"
                value={form.reviewText}
                onChange={(e) => update("reviewText", e.target.value)}
              />
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="reviewerName">
                  投稿者名 <span className="hint">任意</span>
                </label>
                <input
                  id="reviewerName"
                  type="text"
                  placeholder="田中"
                  value={form.reviewerName}
                  onChange={(e) => update("reviewerName", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="visitTime">
                  来店時期 <span className="hint">任意</span>
                </label>
                <input
                  id="visitTime"
                  type="text"
                  placeholder="先週末 / 記念日"
                  value={form.visitTime}
                  onChange={(e) => update("visitTime", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="usedService">
                来店サービス <span className="hint">任意</span>
              </label>
              <input
                id="usedService"
                type="text"
                placeholder="全身もみほぐし60分"
                value={form.usedService}
                onChange={(e) => update("usedService", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="storeMessage">
                店舗として伝えたいこと <span className="hint">任意</span>
              </label>
              <textarea
                id="storeMessage"
                placeholder="受付体制を見直し、待ち時間の短縮に取り組んでいます"
                value={form.storeMessage}
                onChange={(e) => update("storeMessage", e.target.value)}
              />
            </div>

            <div className="field">
              <label>返信トーン</label>
              <div className="segment" role="group" aria-label="返信トーン">
                {REPLY_TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-active={form.replyTone === t}
                    onClick={() => update("replyTone", t)}
                  >
                    {REPLY_TONE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="length">文字数目安</label>
                <select
                  id="length"
                  value={form.length}
                  onChange={(e) =>
                    update("length", e.target.value as ReplyLength)
                  }
                >
                  {REPLY_LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {REPLY_LENGTH_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="apology">謝罪の要否</label>
                <select
                  id="apology"
                  value={form.apology}
                  onChange={(e) =>
                    update("apology", e.target.value as ApologyMode)
                  }
                >
                  {APOLOGY_MODES.map((a) => (
                    <option key={a} value={a}>
                      {APOLOGY_LABELS[a]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="ngExpressions">
                NG表現 <span className="hint">任意</span>
              </label>
              <input
                id="ngExpressions"
                type="text"
                placeholder="言い訳・反論に聞こえる表現 など"
                value={form.ngExpressions}
                onChange={(e) => update("ngExpressions", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.encourageReturn}
                  onChange={(e) => update("encourageReturn", e.target.checked)}
                />
                再来店を促す一文を入れる
              </label>
            </div>

            <button
              type="button"
              className="generate"
              disabled={!canSubmit || loading}
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden />
                  生成中…
                </>
              ) : (
                <>💬 返信文を生成する</>
              )}
            </button>
            <p className="formnote">
              返信は公開されます。個人情報は書かず、内容を確認のうえ投稿してください。
              低評価・ネガティブな口コミは、返信前に担当者の確認を推奨します。
            </p>
          </section>

          {/* ---- 生成結果 ---- */}
          <section className="results" aria-label="生成結果">
            <div className="results-head">
              <h2>返信案</h2>
              {result && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    className="sentiment-badge"
                    data-sentiment={result.sentiment}
                  >
                    {SENTIMENT_ICON[result.sentiment]}{" "}
                    {SENTIMENT_LABELS[result.sentiment]}
                  </span>
                  <span className="source-badge" data-source={result.source}>
                    {result.source === "ai"
                      ? `● AI生成${result.model ? `（${result.model}）` : ""}`
                      : "● サンプル生成"}
                  </span>
                </div>
              )}
            </div>

            {error && <div className="error">⚠️ {error}</div>}

            {result?.needsEscalation && (
              <div className="escalation" role="alert">
                <span className="ic" aria-hidden>
                  🚨
                </span>
                <div>
                  <div className="title">担当者の確認を推奨します</div>
                  <div className="desc">
                    {result.escalationReason ||
                      "ネガティブな内容のため、返信前に状況の確認をおすすめします。"}
                  </div>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="empty">
                <span className="big" aria-hidden>
                  💬
                </span>
                <p>
                  左に口コミ内容を入力して「返信文を生成する」を押すと、
                  <br />
                  ここに返信案が表示されます。
                </p>
              </div>
            )}

            {result && (
              <div className="cards">
                {/* メイン返信文 */}
                <article className="postcard">
                  <div className="postcard-head">
                    <span className="postcard-index">
                      <span className="num">返</span>
                      口コミ返信文（メイン案）
                    </span>
                    <span className="charcount">{replyCount} 字</span>
                  </div>
                  <div className="postcard-body">
                    <textarea
                      className="post-text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      aria-label="口コミ返信文"
                    />
                    <div className="pattern-meta">
                      <div className="meta-item">
                        <span className="meta-label">🎯 返信の意図</span>
                        <span className="meta-value">{result.intent}</span>
                      </div>
                      {result.risks.length > 0 && (
                        <div className="meta-item">
                          <span className="meta-label">⚠️ 注意すべきリスク</span>
                          <ul className="risk-list">
                            {result.risks.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="postcard-foot">
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-copied={copiedKey === "reply"}
                      onClick={() => handleCopy("reply", reply)}
                    >
                      {copiedKey === "reply" ? "✓ コピーしました" : "返信文をコピー"}
                    </button>
                    {selectedReviewId && gbpStoreId && (
                      <button
                        type="button"
                        className="btn"
                        disabled={replyPosting}
                        onClick={handlePostReply}
                      >
                        {replyPosting
                          ? "投稿中…"
                          : replyPosted
                            ? "✓ GBPに返信を投稿しました"
                            : "GBPに返信を投稿"}
                      </button>
                    )}
                  </div>
                </article>

                {/* 別案 */}
                <article className="postcard">
                  <div className="postcard-head">
                    <span className="postcard-index">
                      <span className="num">丁</span>
                      より丁寧な別案
                    </span>
                    <span className="charcount">
                      {[...result.politeAlt].length} 字
                    </span>
                  </div>
                  <div className="postcard-body">
                    <p className="alt-text">{result.politeAlt}</p>
                  </div>
                  <div className="postcard-foot">
                    <button
                      type="button"
                      className="btn"
                      data-copied={copiedKey === "polite"}
                      onClick={() => handleCopy("polite", result.politeAlt)}
                    >
                      {copiedKey === "polite" ? "✓ コピーしました" : "この案をコピー"}
                    </button>
                  </div>
                </article>

                <article className="postcard">
                  <div className="postcard-head">
                    <span className="postcard-index">
                      <span className="num">短</span>
                      短めの別案
                    </span>
                    <span className="charcount">
                      {[...result.shortAlt].length} 字
                    </span>
                  </div>
                  <div className="postcard-body">
                    <p className="alt-text">{result.shortAlt}</p>
                  </div>
                  <div className="postcard-foot">
                    <button
                      type="button"
                      className="btn"
                      data-copied={copiedKey === "short"}
                      onClick={() => handleCopy("short", result.shortAlt)}
                    >
                      {copiedKey === "short" ? "✓ コピーしました" : "この案をコピー"}
                    </button>
                  </div>
                </article>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        MEO Studio（試作）｜口コミ返信生成モジュール — 返信は公開されます。最終的な投稿判断は運用担当者が行ってください。
      </footer>
    </div>
  );
}
