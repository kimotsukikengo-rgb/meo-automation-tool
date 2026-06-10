"use client";

import { useState } from "react";
import "./ui.css";
import "./review-reply.css";
import AppBar from "./AppBar";
import {
  ReplyResponse,
  ReplyTone,
  REPLY_TONES,
  REPLY_TONE_LABELS,
  SENTIMENT_LABELS,
} from "@/lib/review-types";

interface FormState {
  storeName: string;
  category: string;
  reviewText: string;
  rating: number;
  reviewerName: string;
  replyTone: ReplyTone;
  count: number;
}

const INITIAL: FormState = {
  storeName: "",
  category: "",
  reviewText: "",
  rating: 5,
  reviewerName: "",
  replyTone: "sincere",
  count: 3,
};

const SENTIMENT_ICON: Record<string, string> = {
  positive: "😊",
  neutral: "😐",
  negative: "⚠️",
};

export default function ReviewReplyGenerator() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplyResponse | null>(null);
  const [bodies, setBodies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const canSubmit =
    form.storeName.trim() && form.category.trim() && form.reviewText.trim();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      setBodies(data.replies.map((r) => r.body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(index: number) {
    try {
      await navigator.clipboard.writeText(bodies[index] ?? "");
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1800);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  return (
    <div className="shell">
      <AppBar active="review" />

      <main className="main">
        <section className="intro">
          <span className="eyebrow">口コミ管理</span>
          <h1>口コミ返信生成</h1>
          <p>
            口コミ本文と星評価を入力すると、返信文をAIが複数案作成します。
            ネガティブな口コミは自動で判定し、担当者へのエスカレーションを促します。
          </p>
        </section>

        <div className="grid">
          {/* ---- 入力フォーム ---- */}
          <section className="formcard" aria-label="口コミ情報の入力">
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
              <label>星評価</label>
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
                placeholder="例：施術はよかったのですが、予約時間より20分待たされました。受付の対応も少し残念でした。"
                value={form.reviewText}
                onChange={(e) => update("reviewText", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="reviewerName">
                投稿者名 <span className="hint">任意</span>
              </label>
              <input
                id="reviewerName"
                type="text"
                placeholder="例：田中"
                value={form.reviewerName}
                onChange={(e) => update("reviewerName", e.target.value)}
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

            <div className="field">
              <label htmlFor="count">生成する案の数</label>
              <select
                id="count"
                value={form.count}
                onChange={(e) => update("count", Number(e.target.value))}
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}案
                  </option>
                ))}
              </select>
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
                {result.replies.map((r, i) => {
                  const count = [...(bodies[i] ?? "")].length;
                  return (
                    <article
                      className="postcard"
                      key={i}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="postcard-head">
                        <span className="postcard-index">
                          <span className="num">{i + 1}</span>
                          返信案 {i + 1}
                        </span>
                        <span className="charcount">{count} 字</span>
                      </div>
                      <div className="postcard-body">
                        <textarea
                          className="post-text"
                          value={bodies[i] ?? ""}
                          onChange={(e) =>
                            setBodies((prev) => {
                              const next = [...prev];
                              next[i] = e.target.value;
                              return next;
                            })
                          }
                          aria-label={`返信案 ${i + 1} 本文`}
                        />
                      </div>
                      <div className="postcard-foot">
                        <button
                          type="button"
                          className="btn btn-primary"
                          data-copied={copiedIndex === i}
                          onClick={() => handleCopy(i)}
                        >
                          {copiedIndex === i ? "✓ コピーしました" : "返信文をコピー"}
                        </button>
                      </div>
                    </article>
                  );
                })}
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
