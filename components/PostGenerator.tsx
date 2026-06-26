"use client";

import { useRef, useState } from "react";
import "./ui.css";
import AppBar from "./AppBar";
import {
  EMOJI_POLICIES,
  EMOJI_POLICY_LABELS,
  EmojiPolicy,
  GenerateResponse,
  inferEmojiPolicy,
  Length,
  LENGTHS,
  LENGTH_LABELS,
  LENGTH_TARGET,
  QualityStatus,
  Tone,
  TONES,
  TONE_LABELS,
} from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";
import {
  fileToDownscaledImage,
  isAcceptedImageFile,
  UploadedImage,
} from "@/lib/image-upload";
import { useGbpStores } from "@/lib/useGbpStores";

interface FormState {
  storeName: string;
  category: string;
  area: string;
  mainServices: string;
  theme: string;
  targetCustomer: string;
  message: string;
  campaign: string;
  desiredCta: string;
  url: string;
  strengths: string;
  ngExpressions: string;
  tone: Tone;
  length: Length;
  emojiPolicy: EmojiPolicy;
}

const INITIAL: FormState = {
  storeName: "",
  category: "",
  area: "",
  mainServices: "",
  theme: "",
  targetCustomer: "",
  message: "",
  campaign: "",
  desiredCta: "",
  url: "",
  strengths: "",
  ngExpressions: "",
  tone: "friendly",
  length: "standard",
  emojiPolicy: "standard",
};

/** デモ用サンプル（押すたびに切り替わる） */
const SAMPLES: FormState[] = [
  {
    storeName: "リラクゼーションサロン 月読 渋谷店",
    category: "リラクゼーション・もみほぐし",
    area: "渋谷",
    mainServices: "全身もみほぐし／フットケア／ヘッドスパ",
    theme: "梅雨の疲れに効く45分コース新登場",
    targetCustomer: "デスクワークで肩こり・むくみに悩む20〜40代",
    message: "短時間でも深くほぐれる新コースを始めました",
    campaign: "初回限定2,980円（6月末まで）",
    desiredCta: "ネット予約で来店",
    url: "https://example.com/reserve",
    strengths: "渋谷駅徒歩3分／指名予約OK／国家資格者在籍",
    ngExpressions: "「完治」「治る」などの医療的断定表現",
    tone: "friendly",
    length: "standard",
    emojiPolicy: "standard",
  },
  {
    storeName: "トラットリア・ソルレオーネ 横浜店",
    category: "イタリアン・パスタ",
    area: "横浜",
    mainServices: "ランチコース／ディナーコース／テラス席",
    theme: "夏限定 冷製パスタフェア開始",
    targetCustomer: "記念日・デート利用の20〜40代カップル",
    message: "国産トマトを使った数量限定の冷製パスタが登場",
    campaign: "フェア期間中はランチドリンク無料",
    desiredCta: "席を予約する",
    url: "https://example.com/yokohama",
    strengths: "テラス席あり／個室対応可／駅徒歩5分",
    ngExpressions: "",
    tone: "energetic",
    length: "standard",
    emojiPolicy: "standard",
  },
  {
    storeName: "hair atelier LUCE 表参道",
    category: "ヘアサロン・美容室",
    area: "表参道",
    mainServices: "カット／カラー／トリートメント／ヘッドスパ",
    theme: "新規スタイリスト入店キャンペーン",
    targetCustomer: "髪のダメージ・パサつきが気になる女性",
    message: "経験豊富なスタイリストが新たに加わりました",
    campaign: "カット＋トリートメント20%OFF（今月末まで）",
    desiredCta: "オンラインで予約",
    url: "https://example.com/luce",
    strengths: "土日予約可／髪質改善メニュー充実／完全予約制",
    ngExpressions: "「絶対」「No.1」などの根拠のない最上級表現",
    tone: "premium",
    length: "short",
    emojiPolicy: "light",
  },
];

const QUALITY_ICON: Record<QualityStatus, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "❌",
};

export default function PostGenerator() {
  const [form, setForm] = usePersistentState<FormState>("meo:post:form", INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = usePersistentState<GenerateResponse | null>(
    "meo:post:result",
    null,
  );
  const [bodies, setBodies] = usePersistentState<string[]>("meo:post:bodies", []);
  const [titles, setTitles] = usePersistentState<string[]>("meo:post:titles", []);
  const [image, setImage] = usePersistentState<UploadedImage | null>(
    "meo:post:image",
    null,
  );
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const { stores: gbpStores } = useGbpStores();
  const [gbpStoreId, setGbpStoreId] = useState("");
  const [publishingIdx, setPublishingIdx] = useState<number | null>(null);
  const [publishedIdx, setPublishedIdx] = useState<number | null>(null);

  const canSubmit =
    form.storeName.trim() && form.category.trim() && form.theme.trim();

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
    setBodies([]);
    setTitles([]);
    setImage(null);
    setImgErr(null);
    setError(null);
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAcceptedImageFile(file)) {
      setImgErr("画像ファイルを選択してください（PNG / JPEG / WebP など）");
      return;
    }
    setImgErr(null);
    try {
      setImage(await fileToDownscaledImage(file));
    } catch {
      setImgErr("画像の読み込みに失敗しました。別の画像をお試しください");
    }
  }

  async function handleGenerate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageDataUrl: image?.dataUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `生成に失敗しました (${res.status})`);
      }
      const data: GenerateResponse = await res.json();
      setResult(data);
      setBodies(data.patterns.map((p) => p.body));
      setTitles(data.patterns.map((p) => p.title));
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(index: number) {
    const pattern = result?.patterns[index];
    if (!pattern) return;
    // GBP投稿にハッシュタグは入れない。タイトル＋本文＋CTAのみコピーする。
    const text = [titles[index], "", bodies[index], "", pattern.cta].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1800);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  async function handlePublish(index: number) {
    if (!gbpStoreId) {
      setError("先に投稿先の店舗を選択してください（設定・連携で追加できます）");
      return;
    }
    if (publishingIdx !== null) return;
    setPublishingIdx(index);
    setError(null);
    try {
      const res = await fetch("/api/gbp/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: gbpStoreId, summary: bodies[index] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `投稿に失敗しました (${res.status})`);
      }
      setPublishedIdx(index);
      setTimeout(() => setPublishedIdx((c) => (c === index ? null : c)), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "投稿に失敗しました");
    } finally {
      setPublishingIdx(null);
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
            店舗情報と投稿テーマを入力すると、来店促進型・悩み解決型・お知らせ型の
            3パターンの投稿文を、検索意図やMEOキーワードつきでAIが一度に作成します。
          </p>
        </section>

        <div className="grid">
          {/* ---- 入力フォーム ---- */}
          <section className="formcard" aria-label="投稿条件の入力">
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
                <label htmlFor="area">
                  エリア <span className="hint">任意</span>
                </label>
                <input
                  id="area"
                  type="text"
                  placeholder="渋谷"
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="category">
                業種・カテゴリ <span className="hint">必須</span>
              </label>
              <input
                id="category"
                type="text"
                placeholder="リラクゼーション・もみほぐし"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="mainServices">
                主なサービス <span className="hint">任意</span>
              </label>
              <input
                id="mainServices"
                type="text"
                placeholder="全身もみほぐし／フットケア／ヘッドスパ"
                value={form.mainServices}
                onChange={(e) => update("mainServices", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="theme">
                投稿テーマ <span className="hint">必須</span>
              </label>
              <input
                id="theme"
                type="text"
                placeholder="梅雨の疲れに効く45分コース新登場"
                value={form.theme}
                onChange={(e) => update("theme", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="targetCustomer">
                ターゲット顧客 <span className="hint">任意</span>
              </label>
              <input
                id="targetCustomer"
                type="text"
                placeholder="肩こり・むくみに悩む20〜40代"
                value={form.targetCustomer}
                onChange={(e) => update("targetCustomer", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="message">
                今回伝えたい内容 <span className="hint">任意</span>
              </label>
              <textarea
                id="message"
                placeholder="短時間でも深くほぐれる新コースを始めました"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="campaign">
                キャンペーン・イベント <span className="hint">任意</span>
              </label>
              <input
                id="campaign"
                type="text"
                placeholder="初回限定2,980円（6月末まで）"
                value={form.campaign}
                onChange={(e) => update("campaign", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="strengths">
                店舗の強み <span className="hint">任意</span>
              </label>
              <textarea
                id="strengths"
                placeholder="駅徒歩3分／指名予約OK／国家資格者在籍"
                value={form.strengths}
                onChange={(e) => update("strengths", e.target.value)}
              />
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="desiredCta">
                  希望CTA <span className="hint">任意</span>
                </label>
                <input
                  id="desiredCta"
                  type="text"
                  placeholder="ネット予約で来店"
                  value={form.desiredCta}
                  onChange={(e) => update("desiredCta", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="url">
                  予約／詳細URL <span className="hint">任意</span>
                </label>
                <input
                  id="url"
                  type="text"
                  placeholder="https://example.com/reserve"
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="ngExpressions">
                NG表現 <span className="hint">任意</span>
              </label>
              <input
                id="ngExpressions"
                type="text"
                placeholder="「完治」「絶対」などの断定表現"
                value={form.ngExpressions}
                onChange={(e) => update("ngExpressions", e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                投稿に使う画像{" "}
                <span className="hint">任意・AIが内容を読み取って反映します</span>
              </label>
              {image ? (
                <div className="image-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.dataUrl} alt="アップロードした画像のプレビュー" />
                  <div className="image-preview-info">
                    <span className="image-name">{image.name}</span>
                    <button
                      type="button"
                      className="image-remove"
                      onClick={() => {
                        setImage(null);
                        setImgErr(null);
                      }}
                    >
                      画像を削除
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="dropzone"
                  data-dragover={dragOver}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void handleFiles(e.dataTransfer.files);
                  }}
                >
                  <span className="dropzone-icon" aria-hidden>
                    🖼
                  </span>
                  <span className="dropzone-text">
                    クリックして画像を選択 / ここにドラッグ＆ドロップ
                  </span>
                  <span className="dropzone-sub">PNG・JPEG・WebP（PCから）</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only-file"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {imgErr && <p className="image-error">⚠️ {imgErr}</p>}
            </div>

            <div className="field">
              <label>文体（トーン）</label>
              <div className="segment" role="group" aria-label="文体">
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

            <div className="field">
              <label>
                絵文字{" "}
                <span className="hint">
                  業種から推奨: {EMOJI_POLICY_LABELS[inferEmojiPolicy(form.category)]}
                </span>
              </label>
              <div className="segment" role="group" aria-label="絵文字方針">
                {EMOJI_POLICIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-active={form.emojiPolicy === p}
                    onClick={() => update("emojiPolicy", p)}
                  >
                    {EMOJI_POLICY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="length">文字数の目安（業種帯）</label>
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
                <>✨ 3パターンを生成する</>
              )}
            </button>
            <p className="formnote">
              来店促進型・悩み解決型・お知らせ型の3パターンを生成します。
              内容（日時・価格・在庫など）は必ずご確認のうえ投稿してください。
            </p>
          </section>

          {/* ---- 生成結果 ---- */}
          <section className="results" aria-label="生成結果">
            <div className="results-head">
              <h2>生成結果（3パターン）</h2>
              {result && (
                <span className="source-badge" data-source={result.source}>
                  {result.source === "ai"
                    ? `● AI生成${result.model ? `（${result.model}）` : ""}`
                    : "● サンプル生成（実AI未使用）"}
                </span>
              )}
            </div>

            {result?.source === "mock" && (
              <div className="mock-warn">
                ⚠️ これはサンプル（テンプレート）生成です。実際のAI生成ではなく、合格チェックも適用されていません。実生成を有効にしてください。
              </div>
            )}

            {result && gbpStores.length > 0 && (
              <div className="gbp-bar">
                <label htmlFor="gbpPostStore">GBP投稿先</label>
                <select
                  id="gbpPostStore"
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
              </div>
            )}
            {result && gbpStores.length === 0 && (
              <p className="gbp-hint">
                GBPへ直接投稿するには、<a href="/settings">設定・連携</a>
                で店舗を連携してください。
              </p>
            )}

            {image && (
              <div className="attached-image">
                <span className="attached-image-label">
                  📎 この投稿に使う画像
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.dataUrl} alt="投稿に使う画像" />
              </div>
            )}

            {error && <div className="error">⚠️ {error}</div>}

            {!result && !error && (
              <div className="empty">
                <span className="big" aria-hidden>
                  📝
                </span>
                <p>
                  左の条件を入力して「3パターンを生成する」を押すと、
                  <br />
                  ここに投稿案が表示されます。
                </p>
              </div>
            )}

            {result && (
              <div className="cards">
                {result.patterns.map((p, i) => {
                  const count = [...(bodies[i] ?? "")].length;
                  const outOfRange = count < target.min || count > target.max;
                  const quality = result.qualityReport?.patterns.find(
                    (q) => q.patternKey === p.patternKey,
                  );
                  return (
                    <article
                      className="postcard"
                      key={p.patternKey}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="postcard-head">
                        <span className="postcard-index">
                          <span className="num">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {p.patternLabel}
                        </span>
                        <span className="charcount" data-over={outOfRange}>
                          {count} 字 / 目安 {target.min}〜{target.max} 字
                        </span>
                      </div>
                      <div className="postcard-body">
                        <label className="mini-label">投稿タイトル案</label>
                        <input
                          className="post-title"
                          value={titles[i] ?? ""}
                          onChange={(e) =>
                            setTitles((prev) => {
                              const next = [...prev];
                              next[i] = e.target.value;
                              return next;
                            })
                          }
                          aria-label={`${p.patternLabel} タイトル`}
                        />

                        <label className="mini-label">投稿本文</label>
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
                          aria-label={`${p.patternLabel} 本文`}
                        />

                        <label className="mini-label">
                          MEOキーワード（参考・本文に「#」は入れません）
                        </label>
                        <div className="hashtags">
                          {p.meoKeywords.map((k, ki) => (
                            <span className="chip" key={ki}>
                              {k}
                            </span>
                          ))}
                        </div>

                        <div className="cta-line">
                          <span className="cta-label">CTA</span>
                          {p.cta}
                        </div>

                        <div className="pattern-meta">
                          <div className="meta-item">
                            <span className="meta-label">🔍 狙う検索意図</span>
                            <span className="meta-value">{p.searchIntent}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">💡 改善案・注意点</span>
                            <span className="meta-value">{p.notes}</span>
                          </div>
                        </div>

                        {quality && (
                          <div className="quality">
                            <span className="mini-label">
                              合格チェック
                              {quality.repaired && (
                                <em className="quality-repaired">（自動修正済み）</em>
                              )}
                            </span>
                            <ul className="quality-list">
                              {quality.items.map((it, qi) => (
                                <li key={qi} data-status={it.status}>
                                  <span className="q-icon" aria-hidden>
                                    {QUALITY_ICON[it.status]}
                                  </span>
                                  <span className="q-label">{it.label}</span>
                                  <span className="q-detail">{it.detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                            : "タイトル＋本文＋タグをコピー"}
                        </button>
                        {gbpStores.length > 0 && (
                          <button
                            type="button"
                            className="btn"
                            disabled={publishingIdx !== null}
                            onClick={() => handlePublish(i)}
                          >
                            {publishingIdx === i
                              ? "投稿中…"
                              : publishedIdx === i
                                ? "✓ GBPに投稿しました"
                                : "GBPに投稿"}
                          </button>
                        )}
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
