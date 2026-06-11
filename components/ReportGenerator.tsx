"use client";

import { useState } from "react";
import "./ui.css";
import "./report.css";
import AppBar from "./AppBar";
import {
  MetricPair,
  PRIORITY_LABELS,
  ReportResponse,
} from "@/lib/report-types";
import { TalkScriptResponse } from "@/lib/talk-script-types";
import {
  exportReportPdf,
  exportReportDocx,
  exportTalkScriptPdf,
  exportTalkScriptDocx,
} from "@/lib/report-export";
import { usePersistentState } from "@/lib/usePersistentState";
import { useGbpStores } from "@/lib/useGbpStores";

interface Pair {
  current: number;
  previous: number;
}

interface FormState {
  storeName: string;
  category: string;
  area: string;
  period: string; // YYYY-MM
  comparePeriod: string; // YYYY-MM
  impressionsSearch: Pair;
  impressionsMaps: Pair;
  websiteClicks: Pair;
  directionRequests: Pair;
  calls: Pair;
  bookings: Pair;
  posts: Pair;
  photos: Pair;
  newReviews: Pair;
  repliedReviews: Pair;
  avgRating: Pair;
  topKeywords: string;
  competitorTrend: string;
  actionsTaken: string;
  notes: string;
  clientMessage: string;
}

/** 入力する数値指標（avgRating は別扱い） */
const METRIC_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "impressionsSearch", label: "検索経由の表示数" },
  { key: "impressionsMaps", label: "マップ経由の表示数" },
  { key: "websiteClicks", label: "ウェブサイトクリック数" },
  { key: "directionRequests", label: "ルート検索数" },
  { key: "calls", label: "電話クリック数" },
  { key: "bookings", label: "予約数" },
  { key: "posts", label: "投稿数" },
  { key: "photos", label: "写真追加数" },
  { key: "newReviews", label: "口コミ件数（当月）" },
  { key: "repliedReviews", label: "返信済み口コミ数" },
];

const ZERO: Pair = { current: 0, previous: 0 };

const INITIAL: FormState = {
  storeName: "",
  category: "",
  area: "",
  period: "2026-05",
  comparePeriod: "",
  impressionsSearch: ZERO,
  impressionsMaps: ZERO,
  websiteClicks: ZERO,
  directionRequests: ZERO,
  calls: ZERO,
  bookings: ZERO,
  posts: ZERO,
  photos: ZERO,
  newReviews: ZERO,
  repliedReviews: ZERO,
  avgRating: ZERO,
  topKeywords: "",
  competitorTrend: "",
  actionsTaken: "",
  notes: "",
  clientMessage: "",
};

/** デモ用サンプル（押すたびに切り替わる） */
const SAMPLES: FormState[] = [
  {
    storeName: "リラクゼーションサロン 月読 渋谷店",
    category: "リラクゼーション",
    area: "渋谷",
    period: "2026-05",
    comparePeriod: "2026-04",
    impressionsSearch: { current: 4820, previous: 4310 },
    impressionsMaps: { current: 7360, previous: 6980 },
    websiteClicks: { current: 412, previous: 366 },
    directionRequests: { current: 268, previous: 251 },
    calls: { current: 104, previous: 88 },
    bookings: { current: 73, previous: 61 },
    posts: { current: 6, previous: 4 },
    photos: { current: 9, previous: 5 },
    newReviews: { current: 11, previous: 8 },
    repliedReviews: { current: 9, previous: 8 },
    avgRating: { current: 4.4, previous: 4.3 },
    topKeywords: "渋谷 もみほぐし／渋谷 マッサージ／月読 渋谷",
    competitorTrend: "近隣の競合が口コミ返信と写真追加を強化している",
    actionsTaken: "週1投稿、初回限定クーポン投稿、写真9枚追加",
    notes: "梅雨入りで来店が伸びやすい時期",
    clientMessage: "予約数の増加を継続させたい",
  },
  {
    storeName: "トラットリア・ソルレオーネ 横浜店",
    category: "イタリアン",
    area: "横浜",
    period: "2026-04",
    comparePeriod: "2026-03",
    impressionsSearch: { current: 6120, previous: 6480 },
    impressionsMaps: { current: 9240, previous: 9010 },
    websiteClicks: { current: 538, previous: 590 },
    directionRequests: { current: 421, previous: 405 },
    calls: { current: 156, previous: 170 },
    bookings: { current: 132, previous: 145 },
    posts: { current: 3, previous: 5 },
    photos: { current: 2, previous: 6 },
    newReviews: { current: 14, previous: 18 },
    repliedReviews: { current: 10, previous: 18 },
    avgRating: { current: 4.1, previous: 4.2 },
    topKeywords: "横浜 イタリアン／横浜 記念日 ディナー／パスタ 横浜",
    competitorTrend: "競合が期間限定フェアの投稿を増やしている",
    actionsTaken: "ディナー予約導線を整理。投稿は月3件にとどまった",
    notes: "繁忙期明けで予約がやや落ち着いた",
    clientMessage: "クリック・予約の減少要因を整理してほしい",
  },
  {
    storeName: "hair atelier LUCE 表参道",
    category: "ヘアサロン・美容室",
    area: "表参道",
    period: "2026-05",
    comparePeriod: "2026-04",
    impressionsSearch: { current: 3980, previous: 3620 },
    impressionsMaps: { current: 5210, previous: 4880 },
    websiteClicks: { current: 356, previous: 312 },
    directionRequests: { current: 188, previous: 176 },
    calls: { current: 62, previous: 58 },
    bookings: { current: 94, previous: 82 },
    posts: { current: 8, previous: 6 },
    photos: { current: 12, previous: 7 },
    newReviews: { current: 7, previous: 6 },
    repliedReviews: { current: 7, previous: 6 },
    avgRating: { current: 4.7, previous: 4.6 },
    topKeywords: "表参道 美容室／表参道 髪質改善／LUCE 表参道",
    competitorTrend: "高価格帯サロンが増加。差別化が必要",
    actionsTaken: "スタイル写真を12枚追加、新人スタイリスト紹介投稿",
    notes: "新規スタイリスト入店月",
    clientMessage: "髪質改善メニューの訴求を強めたい",
  },
];

function deltaInfo(p: MetricPair): {
  text: string;
  dir: "up" | "down" | "flat";
} {
  if (p.previous === 0) return { text: "比較なし", dir: "flat" };
  const d = ((p.current - p.previous) / p.previous) * 100;
  const dir = d > 0.5 ? "up" : d < -0.5 ? "down" : "flat";
  const sign = d >= 0 ? "+" : "";
  return { text: `${sign}${d.toFixed(1)}%`, dir };
}

const ARROW: Record<string, string> = { up: "▲", down: "▼", flat: "→" };

function Kpi({
  label,
  pair,
  decimals = 0,
}: {
  label: string;
  pair: MetricPair;
  decimals?: number;
}) {
  const d = deltaInfo(pair);
  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{fmt(pair.current)}</div>
      <span className="kpi-delta" data-dir={d.dir}>
        {ARROW[d.dir]} {d.text}
      </span>
      <span className="kpi-prev">前期 {fmt(pair.previous)}</span>
    </div>
  );
}

function buildReportText(req: FormState, data: ReportResponse): string {
  const m = data.metrics;
  const c = data.commentary;
  const line = (label: string, p: MetricPair) =>
    `- ${label}: ${p.current.toLocaleString()}（前期 ${p.previous.toLocaleString()} / ${deltaInfo(p).text}）`;
  return [
    `【MEO月次レポート】${req.storeName}`,
    `対象: ${m.period}(比較: ${m.comparePeriod})`,
    "",
    "■ 1. 今月の総括",
    c.summary,
    "",
    "■ 2. 主要KPIの変化",
    ...c.kpiChanges.map((k) => `・${k}`),
    "",
    "■ 主要指標",
    line("表示回数（合計）", m.impressionsTotal),
    line("検索経由の表示数", m.impressionsSearch),
    line("マップ経由の表示数", m.impressionsMaps),
    line("ウェブサイトクリック", m.websiteClicks),
    line("ルート検索", m.directionRequests),
    line("電話クリック", m.calls),
    line("予約数", m.bookings),
    line("投稿数", m.posts),
    line("写真追加数", m.photos),
    line("口コミ件数（当月）", m.newReviews),
    line("返信済み口コミ数", m.repliedReviews),
    `- 平均評価: ${m.avgRating.current}（前期 ${m.avgRating.previous}）`,
    "",
    "■ 3. 良かった点",
    ...c.highlights.map((h) => `・${h}`),
    "",
    "■ 4. 課題点",
    ...c.issues.map((i) => `・${i}`),
    "",
    "■ 5. 検索キーワードの分析",
    c.keywordAnalysis,
    "",
    "■ 6. 口コミ状況の分析",
    c.reviewAnalysis,
    "",
    "■ 7. 投稿・写真運用の分析",
    c.contentAnalysis,
    "",
    "■ 8. 競合比較の所感",
    c.competitorAnalysis,
    "",
    "■ 9. 来月の改善アクション",
    ...c.nextActions.map((a) => `・${a}`),
    "",
    "■ 10. 優先度付きタスク一覧",
    ...c.priorityTasks.map(
      (t) =>
        `［${PRIORITY_LABELS[t.priority]}］${t.name}\n  目的: ${t.purpose}\n  実施内容: ${t.action}\n  期待効果: ${t.expected}\n  注意点: ${t.caution}`,
    ),
    "",
    "■ 11. クライアント向けコメント",
    c.clientComment,
  ].join("\n");
}

function buildTalkScriptText(storeName: string, t: TalkScriptResponse): string {
  const s = t.talkScript;
  return [
    `【クライアント報告トークスクリプト】${storeName}`,
    "",
    "■ 挨拶・導入",
    s.opening,
    "",
    "■ 本日お伝えすること",
    ...s.agenda.map((a) => `・${a}`),
    "",
    "■ 報告の流れ",
    ...s.sections.flatMap((sec) => [`◆ ${sec.heading}`, sec.talk, ""]),
    "■ 想定問答",
    ...s.expectedQuestions.flatMap((qa) => [`Q. ${qa.question}`, `A. ${qa.answer}`, ""]),
    "■ 締めのトーク",
    s.closing,
    "",
    "■ 話し方・進め方のコツ",
    ...s.talkingTips.map((tip) => `・${tip}`),
  ].join("\n");
}

export default function ReportGenerator() {
  const [form, setForm] = usePersistentState<FormState>("meo:report:form", INITIAL);
  const [loading, setLoading] = useState(false);
  const [data, setData] = usePersistentState<ReportResponse | null>(
    "meo:report:data",
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [exporting, setExporting] = useState<null | "pdf" | "docx">(null);
  const { stores: gbpStores } = useGbpStores();
  const [gbpStoreId, setGbpStoreId] = useState("");
  const [fetchingMetrics, setFetchingMetrics] = useState(false);
  const [metricsFetched, setMetricsFetched] = useState(false);

  // トークスクリプト（クライアントへの口頭報告台本）
  const [talk, setTalk] = usePersistentState<TalkScriptResponse | null>(
    "meo:report:talk",
    null,
  );
  const [talkLoading, setTalkLoading] = useState(false);
  const [talkError, setTalkError] = useState<string | null>(null);
  const [talkCopied, setTalkCopied] = useState(false);
  const [talkExporting, setTalkExporting] = useState<null | "pdf" | "docx">(
    null,
  );

  const canSubmit = form.storeName.trim() && form.category.trim() && form.period;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePair(key: keyof FormState, side: keyof Pair, value: number) {
    setForm((prev) => {
      const pair = prev[key] as Pair;
      return { ...prev, [key]: { ...pair, [side]: value } };
    });
  }

  function loadSample() {
    setForm(SAMPLES[sampleIdx % SAMPLES.length]);
    setSampleIdx((i) => i + 1);
  }

  /** GBP の Performance 指標を取得し、数値フィールドに自動充填する */
  async function handleFetchMetrics() {
    if (!gbpStoreId) {
      setError("先に取得元の店舗を選択してください");
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(form.period)) {
      setError("対象期間を YYYY-MM 形式で指定してください");
      return;
    }
    setFetchingMetrics(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        storeId: gbpStoreId,
        period: form.period,
      });
      if (/^\d{4}-\d{2}$/.test(form.comparePeriod)) {
        params.set("comparePeriod", form.comparePeriod);
      }
      const res = await fetch(`/api/gbp/metrics?${params.toString()}`);
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || `取得に失敗しました (${res.status})`);
      }
      const metrics = (d.metrics ?? {}) as Record<string, Partial<Pair>>;
      const pairKeys: (keyof FormState)[] = [
        "impressionsSearch",
        "impressionsMaps",
        "websiteClicks",
        "directionRequests",
        "calls",
        "bookings",
        "posts",
        "photos",
        "newReviews",
        "repliedReviews",
        "avgRating",
      ];
      setForm((prev) => {
        const updates: Record<string, Pair> = {};
        for (const k of pairKeys) {
          const v = metrics[k as string];
          if (v && typeof v.current === "number") {
            updates[k as string] = {
              current: v.current,
              previous: typeof v.previous === "number" ? v.previous : 0,
            };
          }
        }
        const compare =
          d.comparePeriod && !prev.comparePeriod
            ? { comparePeriod: String(d.comparePeriod) }
            : {};
        return { ...prev, ...updates, ...compare };
      });
      setMetricsFetched(true);
      setTimeout(() => setMetricsFetched(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "数値の取得に失敗しました");
    } finally {
      setFetchingMetrics(false);
    }
  }

  async function handleGenerate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    setTalk(null);
    setTalkError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `生成に失敗しました (${res.status})`);
      }
      const reportData: ReportResponse = await res.json();
      setData(reportData);
      // レポートをもとに、クライアント報告用トークスクリプトを自動生成
      void generateTalkScript(reportData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function generateTalkScript(reportData: ReportResponse) {
    setTalkLoading(true);
    setTalkError(null);
    try {
      const res = await fetch("/api/talk-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          category: form.category,
          area: form.area,
          clientMessage: form.clientMessage,
          metrics: reportData.metrics,
          commentary: reportData.commentary,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `トークスクリプトの生成に失敗しました (${res.status})`);
      }
      setTalk(await res.json());
    } catch (e) {
      setTalkError(
        e instanceof Error ? e.message : "トークスクリプトの生成に失敗しました",
      );
    } finally {
      setTalkLoading(false);
    }
  }

  function clearAll() {
    setForm(INITIAL);
    setData(null);
    setTalk(null);
    setError(null);
    setTalkError(null);
  }

  async function handleCopy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(buildReportText(form, data));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  }

  function fileBase() {
    const safeName = form.storeName.trim().replace(/[\\/:*?"<>|]/g, "_");
    return `MEOレポート_${safeName}_${form.period}`;
  }

  async function handleExportPdf() {
    if (!data || exporting) return;
    setExporting("pdf");
    setError(null);
    try {
      await exportReportPdf(
        {
          storeName: form.storeName,
          category: form.category,
          area: form.area,
          period: form.period,
        },
        data,
        fileBase(),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDFの生成に失敗しました");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportDocx() {
    if (!data || exporting) return;
    setExporting("docx");
    setError(null);
    try {
      await exportReportDocx(
        {
          storeName: form.storeName,
          category: form.category,
          area: form.area,
          period: form.period,
        },
        data,
        fileBase(),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wordファイルの生成に失敗しました");
    } finally {
      setExporting(null);
    }
  }

  function talkFileBase() {
    const safeName = form.storeName.trim().replace(/[\\/:*?"<>|]/g, "_");
    return `トークスクリプト_${safeName}_${form.period}`;
  }

  async function handleTalkCopy() {
    if (!talk) return;
    try {
      await navigator.clipboard.writeText(
        buildTalkScriptText(form.storeName, talk),
      );
      setTalkCopied(true);
      setTimeout(() => setTalkCopied(false), 1800);
    } catch {
      setTalkError("クリップボードへのコピーに失敗しました");
    }
  }

  async function handleExportTalkPdf() {
    if (!talk || talkExporting) return;
    setTalkExporting("pdf");
    setTalkError(null);
    try {
      await exportTalkScriptPdf(
        {
          storeName: form.storeName,
          category: form.category,
          area: form.area,
          period: form.period,
        },
        talk.talkScript,
        talkFileBase(),
      );
    } catch (e) {
      setTalkError(e instanceof Error ? e.message : "PDFの生成に失敗しました");
    } finally {
      setTalkExporting(null);
    }
  }

  async function handleExportTalkDocx() {
    if (!talk || talkExporting) return;
    setTalkExporting("docx");
    setTalkError(null);
    try {
      await exportTalkScriptDocx(
        {
          storeName: form.storeName,
          category: form.category,
          area: form.area,
          period: form.period,
        },
        talk.talkScript,
        talkFileBase(),
      );
    } catch (e) {
      setTalkError(
        e instanceof Error ? e.message : "Wordファイルの生成に失敗しました",
      );
    } finally {
      setTalkExporting(null);
    }
  }

  return (
    <div className="shell">
      <AppBar active="report" />

      <main className="main">
        <section className="intro">
          <span className="eyebrow">レポート作成</span>
          <h1>レポート自動生成</h1>
          <p>
            店舗情報とGBPの実数値（表示回数・クリック・ルート検索・電話・予約・口コミ・写真・投稿など）を
            入力すると、AIが11セクション＋優先度付きタスクの月次レポートを作成します。
          </p>
        </section>

        <div className="sample-bar">
          <button type="button" className="sample-btn" onClick={loadSample}>
            🎲 サンプルを入力
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={clearAll}
            disabled={loading || talkLoading}
          >
            🗑 クリア
          </button>
        </div>

        {gbpStores.length > 0 ? (
          <div className="gbp-bar">
            <label htmlFor="gbpMetricStore">GBP数値取得</label>
            <select
              id="gbpMetricStore"
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
              disabled={!gbpStoreId || fetchingMetrics}
              onClick={handleFetchMetrics}
            >
              {fetchingMetrics
                ? "取得中…"
                : metricsFetched
                  ? "✓ 取得しました"
                  : "対象期間の数値を取得"}
            </button>
          </div>
        ) : (
          <p className="gbp-hint">
            GBPから数値を自動取得するには、<a href="/settings">設定・連携</a>
            で店舗を連携してください（連携前は手入力で利用できます）。
          </p>
        )}

        {/* ---- 入力フォーム ---- */}
        <section className="report-form" aria-label="レポート入力">
          <h3 className="form-group-title">店舗・期間</h3>
          <div className="form-grid">
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
            <div className="field">
              <label htmlFor="area">エリア</label>
              <input
                id="area"
                type="text"
                placeholder="渋谷"
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="period">対象期間（YYYY-MM）</label>
              <input
                id="period"
                type="text"
                placeholder="2026-05"
                value={form.period}
                onChange={(e) => update("period", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comparePeriod">比較期間（任意）</label>
              <input
                id="comparePeriod"
                type="text"
                placeholder="2026-04（空欄なら前月）"
                value={form.comparePeriod}
                onChange={(e) => update("comparePeriod", e.target.value)}
              />
            </div>
          </div>

          <h3 className="form-group-title">数値指標（当月 / 比較期間）</h3>
          <div className="metric-inputs">
            {METRIC_FIELDS.map((f) => {
              const pair = form[f.key] as Pair;
              return (
                <div className="metric-row" key={f.key}>
                  <span className="metric-name">{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    aria-label={`${f.label} 当月`}
                    value={pair.current}
                    onChange={(e) =>
                      updatePair(f.key, "current", Number(e.target.value) || 0)
                    }
                  />
                  <span className="metric-sep">/</span>
                  <input
                    type="number"
                    min={0}
                    aria-label={`${f.label} 比較期間`}
                    value={pair.previous}
                    onChange={(e) =>
                      updatePair(f.key, "previous", Number(e.target.value) || 0)
                    }
                  />
                </div>
              );
            })}
            <div className="metric-row">
              <span className="metric-name">平均評価（0〜5）</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                aria-label="平均評価 当月"
                value={form.avgRating.current}
                onChange={(e) =>
                  updatePair("avgRating", "current", Number(e.target.value) || 0)
                }
              />
              <span className="metric-sep">/</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                aria-label="平均評価 比較期間"
                value={form.avgRating.previous}
                onChange={(e) =>
                  updatePair(
                    "avgRating",
                    "previous",
                    Number(e.target.value) || 0,
                  )
                }
              />
            </div>
          </div>

          <h3 className="form-group-title">定性情報（任意）</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="topKeywords">上位検索キーワード</label>
              <textarea
                id="topKeywords"
                placeholder="渋谷 もみほぐし／渋谷 マッサージ／店舗名"
                value={form.topKeywords}
                onChange={(e) => update("topKeywords", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="competitorTrend">競合店舗の傾向</label>
              <textarea
                id="competitorTrend"
                placeholder="近隣競合が口コミ返信・写真追加を強化 など"
                value={form.competitorTrend}
                onChange={(e) => update("competitorTrend", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="actionsTaken">今月実施した施策</label>
              <textarea
                id="actionsTaken"
                placeholder="週1投稿、クーポン投稿、写真9枚追加 など"
                value={form.actionsTaken}
                onChange={(e) => update("actionsTaken", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="notes">特記事項</label>
              <textarea
                id="notes"
                placeholder="季節要因・キャンペーン・店舗の出来事 など"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="clientMessage">クライアントに伝えたいこと</label>
              <textarea
                id="clientMessage"
                placeholder="予約数の増加を継続させたい など"
                value={form.clientMessage}
                onChange={(e) => update("clientMessage", e.target.value)}
              />
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
              <>📊 レポートを生成</>
            )}
          </button>
        </section>

        {error && <div className="error">⚠️ {error}</div>}

        {!data && !error && (
          <div className="empty">
            <span className="big" aria-hidden>
              📊
            </span>
            <p>
              店舗情報と数値を入力して「レポートを生成」を押すと、
              <br />
              ここに月次レポートが表示されます。
            </p>
          </div>
        )}

        {/* ---- レポート本体 ---- */}
        {data && (
          <article className="report-doc">
            <div className="report-doc-head">
              <div>
                <h2>{form.storeName} MEO月次レポート</h2>
                <div className="sub">
                  {form.category}
                  {form.area ? ` ・ ${form.area}` : ""} ・ 講評:{" "}
                  {data.source === "ai"
                    ? `AI（${data.model}）`
                    : "サンプル生成"}
                </div>
              </div>
              <div className="period">
                <div style={{ fontSize: "var(--text-xl)" }}>
                  {data.metrics.period}
                </div>
                <div className="sub">比較 {data.metrics.comparePeriod}</div>
              </div>
            </div>

            {/* 1. 今月の総括 */}
            <section className="report-section">
              <h3>1. 今月の総括</h3>
              <p className="commentary-summary">{data.commentary.summary}</p>
            </section>

            {/* 主要指標（KPI） */}
            <section className="report-section">
              <h3>主要指標（当月・前期比）</h3>
              <div className="kpi-grid">
                <Kpi
                  label="表示回数（合計）"
                  pair={data.metrics.impressionsTotal}
                />
                <Kpi label="検索 表示数" pair={data.metrics.impressionsSearch} />
                <Kpi label="マップ 表示数" pair={data.metrics.impressionsMaps} />
                <Kpi label="サイトクリック" pair={data.metrics.websiteClicks} />
                <Kpi label="ルート検索" pair={data.metrics.directionRequests} />
                <Kpi label="電話クリック" pair={data.metrics.calls} />
                <Kpi label="予約数" pair={data.metrics.bookings} />
                <Kpi label="投稿数" pair={data.metrics.posts} />
                <Kpi label="写真追加数" pair={data.metrics.photos} />
                <Kpi label="口コミ件数" pair={data.metrics.newReviews} />
                <Kpi label="返信済み口コミ" pair={data.metrics.repliedReviews} />
                <Kpi label="平均評価" pair={data.metrics.avgRating} decimals={1} />
              </div>
            </section>

            {/* 2. 主要KPIの変化 */}
            <section className="report-section">
              <h3>2. 主要KPIの変化</h3>
              <ul className="kpi-change-list">
                {data.commentary.kpiChanges.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </section>

            {/* 3-4. 良かった点 / 課題点 */}
            <section className="report-section">
              <h3>3-4. 良かった点・課題点</h3>
              <div className="commentary-cols">
                <div className="commentary-block" data-kind="highlights">
                  <h4>👍 良かった点</h4>
                  <ul>
                    {data.commentary.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="commentary-block" data-kind="issues">
                  <h4>⚠️ 課題点</h4>
                  <ul>
                    {data.commentary.issues.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 5-8. 分析セクション */}
            <section className="report-section">
              <h3>5. 検索キーワードの分析</h3>
              <p className="analysis-text">{data.commentary.keywordAnalysis}</p>
            </section>
            <section className="report-section">
              <h3>6. 口コミ状況の分析</h3>
              <p className="analysis-text">{data.commentary.reviewAnalysis}</p>
            </section>
            <section className="report-section">
              <h3>7. 投稿・写真運用の分析</h3>
              <p className="analysis-text">{data.commentary.contentAnalysis}</p>
            </section>
            <section className="report-section">
              <h3>8. 競合比較の所感</h3>
              <p className="analysis-text">
                {data.commentary.competitorAnalysis}
              </p>
            </section>

            {/* 9. 来月の改善アクション */}
            <section className="report-section">
              <h3>9. 来月の改善アクション</h3>
              <ul className="kpi-change-list">
                {data.commentary.nextActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>

            {/* 10. 優先度付きタスク一覧 */}
            <section className="report-section">
              <h3>10. 優先度付きタスク一覧</h3>
              <div className="task-table">
                {data.commentary.priorityTasks.map((t, i) => (
                  <div className="task-card" key={i} data-priority={t.priority}>
                    <div className="task-head">
                      <span
                        className="task-priority"
                        data-priority={t.priority}
                      >
                        優先度 {PRIORITY_LABELS[t.priority]}
                      </span>
                      <span className="task-name">{t.name}</span>
                    </div>
                    <dl className="task-detail">
                      <dt>目的</dt>
                      <dd>{t.purpose}</dd>
                      <dt>実施内容</dt>
                      <dd>{t.action}</dd>
                      <dt>期待効果</dt>
                      <dd>{t.expected}</dd>
                      <dt>注意点</dt>
                      <dd>{t.caution}</dd>
                    </dl>
                  </div>
                ))}
              </div>
            </section>

            {/* 11. クライアント向けコメント */}
            <section className="report-section">
              <h3>11. クライアント向けコメント</h3>
              <p className="client-comment">{data.commentary.clientComment}</p>
            </section>

            <div className="report-actions">
              <button
                type="button"
                className="btn btn-primary"
                data-copied={copied}
                onClick={handleCopy}
              >
                {copied ? "✓ コピーしました" : "レポート全文をコピー"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={exporting !== null}
                onClick={handleExportPdf}
              >
                {exporting === "pdf" ? (
                  <>
                    <span className="spinner" aria-hidden />
                    PDF生成中…
                  </>
                ) : (
                  <>📄 PDFで抽出</>
                )}
              </button>
              <button
                type="button"
                className="btn"
                disabled={exporting !== null}
                onClick={handleExportDocx}
              >
                {exporting === "docx" ? (
                  <>
                    <span className="spinner" aria-hidden />
                    Word生成中…
                  </>
                ) : (
                  <>📝 Word(.docx)で抽出</>
                )}
              </button>
            </div>
          </article>
        )}

        {/* ---- トークスクリプト（クライアント報告用） ---- */}
        {data && talkLoading && (
          <div className="talk-loading">
            <span className="spinner" aria-hidden />
            レポートをもとに報告トークスクリプトを作成中…
          </div>
        )}

        {data && talkError && !talkLoading && (
          <div className="error">
            ⚠️ {talkError}
            <button
              type="button"
              className="btn"
              style={{ marginLeft: "12px" }}
              onClick={() => data && generateTalkScript(data)}
            >
              再生成
            </button>
          </div>
        )}

        {data && talk && !talkLoading && (
          <article className="talk-doc">
            <div className="talk-doc-head">
              <div>
                <h2>クライアント報告トークスクリプト</h2>
                <div className="sub">
                  {form.storeName} ・ 対象 {data.metrics.period} ・ 出力元:{" "}
                  {talk.source === "ai"
                    ? `AI（${talk.model}）`
                    : "サンプル生成"}
                </div>
              </div>
              <span className="talk-badge" aria-hidden>
                🎤 口頭報告用
              </span>
            </div>

            <section className="talk-section">
              <h3>挨拶・導入</h3>
              <p className="talk-text">{talk.talkScript.opening}</p>
            </section>

            <section className="talk-section">
              <h3>本日お伝えすること</h3>
              <ul className="talk-list">
                {talk.talkScript.agenda.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>

            <section className="talk-section">
              <h3>報告の流れ</h3>
              <div className="talk-flow">
                {talk.talkScript.sections.map((s, i) => (
                  <div className="talk-block" key={i}>
                    <h4>{s.heading}</h4>
                    <p className="talk-text">{s.talk}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="talk-section">
              <h3>想定問答</h3>
              <dl className="talk-qa">
                {talk.talkScript.expectedQuestions.map((qa, i) => (
                  <div className="qa-item" key={i}>
                    <dt>Q. {qa.question}</dt>
                    <dd>A. {qa.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="talk-section">
              <h3>締めのトーク</h3>
              <p className="talk-text">{talk.talkScript.closing}</p>
            </section>

            <section className="talk-section">
              <h3>話し方・進め方のコツ</h3>
              <ul className="talk-list">
                {talk.talkScript.talkingTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>

            <div className="report-actions">
              <button
                type="button"
                className="btn btn-primary"
                data-copied={talkCopied}
                onClick={handleTalkCopy}
              >
                {talkCopied ? "✓ コピーしました" : "トークスクリプトをコピー"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={talkExporting !== null}
                onClick={handleExportTalkPdf}
              >
                {talkExporting === "pdf" ? (
                  <>
                    <span className="spinner" aria-hidden />
                    PDF生成中…
                  </>
                ) : (
                  <>📄 PDFで抽出</>
                )}
              </button>
              <button
                type="button"
                className="btn"
                disabled={talkExporting !== null}
                onClick={handleExportTalkDocx}
              >
                {talkExporting === "docx" ? (
                  <>
                    <span className="spinner" aria-hidden />
                    Word生成中…
                  </>
                ) : (
                  <>📝 Word(.docx)で抽出</>
                )}
              </button>
            </div>
          </article>
        )}
      </main>

      <footer className="footer">
        MEO Studio（試作）｜レポート自動生成モジュール — 数値は担当者の手入力です。実運用ではGBP API連携で自動取得に置き換え可能です。
      </footer>
    </div>
  );
}
