"use client";

import { useState } from "react";
import "./ui.css";
import AppBar from "./AppBar";
import {
  GenerateResponse,
  Length,
  LENGTHS,
  LENGTH_LABELS,
  LENGTH_TARGET,
  PostType,
  POST_TYPES,
  POST_TYPE_LABELS,
  Tone,
  TONES,
  TONE_LABELS,
} from "@/lib/types";

interface FormState {
  storeName: string;
  category: string;
  theme: string;
  keyPoints: string;
  tone: Tone;
  postType: PostType;
  length: Length;
  count: number;
}

const INITIAL: FormState = {
  storeName: "",
  category: "",
  theme: "",
  keyPoints: "",
  tone: "friendly",
  postType: "update",
  length: "standard",
  count: 3,
};

export default function PostGenerator() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [bodies, setBodies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const canSubmit =
    form.storeName.trim() && form.category.trim() && form.theme.trim();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `生成に失敗しました (${res.status})`);
      }
      const data: GenerateResponse = await res.json();
      setResult(data);
      setBodies(data.variations.map((v) => v.body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(index: number) {
    const variation = result?.variations[index];
    if (!variation) return;
    const text = `${bodies[index]}\n\n${variation.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1800);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  const target = LENGTH_TARGET[form.length];

  return (
    <div className="shell">
      <AppBar active="post" />

      <main className="main">
        <section className="intro">
          <span className="eyebrow">投稿作成・投稿管理</span>
          <h1>投稿文生成</h1>
          <p>
            店舗情報と投稿テーマを入力すると、Googleビジネスプロフィールの投稿文を
            複数案、AIが一度に作成します。気に入った案はその場で編集してコピーできます。
          </p>
        </section>

        <div className="grid">
          {/* ---- 入力フォーム ---- */}
          <section className="formcard" aria-label="投稿条件の入力">
            <div className="field">
              <label htmlFor="storeName">
                店舗名 <span className="hint">必須</span>
              </label>
              <input
                id="storeName"
                type="text"
                placeholder="例：リラクゼーションサロン 月読 渋谷店"
                value={form.storeName}
                onChange={(e) => update("storeName", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="category">
                業種・カテゴリ <span className="hint">必須</span>
              </label>
              <input
                id="category"
                type="text"
                placeholder="例：リラクゼーション・もみほぐし"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="theme">
                投稿テーマ <span className="hint">必須</span>
              </label>
              <input
                id="theme"
                type="text"
                placeholder="例：梅雨の疲れに効く45分コース新登場"
                value={form.theme}
                onChange={(e) => update("theme", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="keyPoints">
                強調したい訴求ポイント <span className="hint">任意</span>
              </label>
              <textarea
                id="keyPoints"
                placeholder="例：初回限定2,980円／指名予約OK／駅徒歩3分"
                value={form.keyPoints}
                onChange={(e) => update("keyPoints", e.target.value)}
              />
            </div>

            <div className="field">
              <label>投稿タイプ</label>
              <div className="segment" role="group" aria-label="投稿タイプ">
                {POST_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-active={form.postType === t}
                    onClick={() => update("postType", t)}
                  >
                    {POST_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>トーン</label>
              <div className="segment" role="group" aria-label="トーン">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-active={form.tone === t}
                    onClick={() => update("tone", t)}
                  >
                    {TONE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="length">文字数の目安</label>
                <select
                  id="length"
                  value={form.length}
                  onChange={(e) => update("length", e.target.value as Length)}
                >
                  {LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {LENGTH_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="count">生成する案の数</label>
                <select
                  id="count"
                  value={form.count}
                  onChange={(e) => update("count", Number(e.target.value))}
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}案
                    </option>
                  ))}
                </select>
              </div>
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
                <>✨ 投稿文を生成する</>
              )}
            </button>
            <p className="formnote">
              生成された文章は必ず内容（日時・価格・在庫など）をご確認のうえ投稿してください。
              GBPの投稿は最大1500字。本文冒頭に要点が来るよう作成しています。
            </p>
          </section>

          {/* ---- 生成結果 ---- */}
          <section className="results" aria-label="生成結果">
            <div className="results-head">
              <h2>生成結果</h2>
              {result && (
                <span className="source-badge" data-source={result.source}>
                  {result.source === "ai"
                    ? `● AI生成${result.model ? `（${result.model}）` : ""}`
                    : "● サンプル生成（APIキー未設定）"}
                </span>
              )}
            </div>

            {error && <div className="error">⚠️ {error}</div>}

            {!result && !error && (
              <div className="empty">
                <span className="big" aria-hidden>
                  📝
                </span>
                <p>
                  左の条件を入力して「投稿文を生成する」を押すと、
                  <br />
                  ここに投稿案が表示されます。
                </p>
              </div>
            )}

            {result && (
              <div className="cards">
                {result.variations.map((v, i) => {
                  const count = [...(bodies[i] ?? "")].length;
                  const over = count > target;
                  return (
                    <article
                      className="postcard"
                      key={i}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="postcard-head">
                        <span className="postcard-index">
                          <span className="num">{i + 1}</span>
                          投稿案 {i + 1}
                        </span>
                        <span className="charcount" data-over={over}>
                          {count} 字 / 目安 {target} 字
                        </span>
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
                          aria-label={`投稿案 ${i + 1} 本文`}
                        />
                        <div className="hashtags">
                          {v.hashtags.map((h, hi) => (
                            <span className="chip" key={hi}>
                              {h}
                            </span>
                          ))}
                        </div>
                        <div className="cta-line">
                          <span className="cta-label">CTA</span>
                          {v.cta}
                        </div>
                      </div>
                      <div className="postcard-foot">
                        <button
                          type="button"
                          className="btn btn-primary"
                          data-copied={copiedIndex === i}
                          onClick={() => handleCopy(i)}
                        >
                          {copiedIndex === i
                            ? "✓ コピーしました"
                            : "本文＋タグをコピー"}
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
        MEO Studio（試作）｜投稿文生成モジュール — このツールは生成支援であり、最終的な投稿判断は運用担当者が行ってください。
      </footer>
    </div>
  );
}
