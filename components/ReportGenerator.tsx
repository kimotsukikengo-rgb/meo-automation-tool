"use client";

import { useState } from "react";
import "./ui.css";
import "./report.css";
import AppBar from "./AppBar";
import { MetricPair, ReportResponse } from "@/lib/report-types";

interface FormState {
  storeName: string;
  category: string;
  period: string; // YYYY-MM
}

const INITIAL: FormState = {
  storeName: "",
  category: "",
  period: "2026-05",
};

function deltaInfo(p: MetricPair): { text: string; dir: "up" | "down" | "flat" } {
  if (p.previous === 0) return { text: "—", dir: "flat" };
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
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {pair.current.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </div>
      <span className="kpi-delta" data-dir={d.dir}>
        {ARROW[d.dir]} {d.text}
      </span>
      <span className="kpi-prev">
        前月{" "}
        {pair.previous.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
    </div>
  );
}

function buildReportText(req: FormState, data: ReportResponse): string {
  const m = data.metrics;
  const c = data.commentary;
  const line = (label: string, p: MetricPair) =>
    `- ${label}: ${p.current.toLocaleString()}（前月 ${p.previous.toLocaleString()} / ${deltaInfo(p).text}）`;
  return [
    `【MEO月次レポート】${req.storeName}`,
    `対象月: ${m.period}`,
    "",
    "■ サマリー",
    c.summary,
    "",
    "■ 主要指標",
    line("検索表示回数", m.impressionsSearch),
    line("マップ表示回数", m.impressionsMaps),
    line("ウェブサイトクリック", m.websiteClicks),
    line("通話数", m.calls),
    line("ルート検索", m.directionRequests),
    line("新規口コミ", m.newReviews),
    `- 平均評価: ${m.avgRating.current}（前月 ${m.avgRating.previous} / 累計${m.totalReviews}件）`,
    "",
    "■ 良かった点",
    ...c.highlights.map((h) => `・${h}`),
    "",
    "■ 課題",
    ...c.issues.map((i) => `・${i}`),
    "",
    "■ 次月の改善提案",
    ...c.suggestions.map((s) => `・${s}`),
  ].join("\n");
}

export default function ReportGenerator() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = form.storeName.trim() && form.category.trim() && form.period;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
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
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
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

  const maxTrend = data
    ? Math.max(...data.metrics.trend.map((t) => t.impressions), 1)
    : 1;

  return (
    <div className="shell">
      <AppBar active="report" />

      <main className="main">
        <section className="intro">
          <span className="eyebrow">レポート作成</span>
          <h1>レポート自動生成</h1>
          <p>
            店舗と対象月を指定すると、GBPの主要指標を集計し、AIが講評・改善提案つきの
            月次レポートを自動作成します。そのままクライアント共有資料に転記できます。
          </p>
        </section>

        {/* ---- ツールバー ---- */}
        <div className="report-toolbar">
          <div className="field">
            <label htmlFor="storeName">店舗名</label>
            <input
              id="storeName"
              type="text"
              placeholder="月読 渋谷店"
              value={form.storeName}
              onChange={(e) => update("storeName", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="category">業種</label>
            <input
              id="category"
              type="text"
              placeholder="リラクゼーション"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: "0 0 160px" }}>
            <label htmlFor="period">対象月</label>
            <input
              id="period"
              type="text"
              placeholder="2026-05"
              value={form.period}
              onChange={(e) => update("period", e.target.value)}
            />
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
        </div>

        {error && <div className="error">⚠️ {error}</div>}

        {!data && !error && (
          <div className="empty">
            <span className="big" aria-hidden>
              📊
            </span>
            <p>
              店舗名・業種・対象月を入力して「レポートを生成」を押すと、
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
                  {form.category} ・ データ出所:{" "}
                  {data.dataSource === "sample" ? "サンプル（試作）" : "実データ"} ・
                  講評: {data.source === "ai" ? `AI（${data.model}）` : "サンプル生成"}
                </div>
              </div>
              <div className="period">
                <div style={{ fontSize: "var(--text-xl)" }}>{data.metrics.period}</div>
                <div className="sub">前月比 {data.metrics.previousPeriod}</div>
              </div>
            </div>

            {/* KPI */}
            <section className="report-section">
              <h3>主要指標（前月比）</h3>
              <div className="kpi-grid">
                <Kpi label="検索 表示回数" pair={data.metrics.impressionsSearch} />
                <Kpi label="マップ 表示回数" pair={data.metrics.impressionsMaps} />
                <Kpi label="サイトクリック" pair={data.metrics.websiteClicks} />
                <Kpi label="通話数" pair={data.metrics.calls} />
                <Kpi label="ルート検索" pair={data.metrics.directionRequests} />
                <Kpi label="新規口コミ" pair={data.metrics.newReviews} />
                <Kpi label="平均評価" pair={data.metrics.avgRating} decimals={1} />
              </div>
            </section>

            {/* 推移チャート */}
            <section className="report-section">
              <h3>表示回数の推移（直近6か月）</h3>
              <div className="chart">
                {data.metrics.trend.map((t, i, arr) => (
                  <div className="chart-col" key={i}>
                    <div
                      className="chart-bar"
                      data-latest={i === arr.length - 1}
                      style={{ height: `${(t.impressions / maxTrend) * 100}%` }}
                    >
                      <span className="chart-val">
                        {(t.impressions / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <span className="chart-label">{t.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 講評 */}
            <section className="report-section">
              <h3>講評</h3>
              <p className="commentary-summary">{data.commentary.summary}</p>
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
                  <h4>⚠️ 課題</h4>
                  <ul>
                    {data.commentary.issues.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="commentary-block" data-kind="suggestions">
                  <h4>💡 次月の改善提案</h4>
                  <ul>
                    {data.commentary.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
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
              <button type="button" className="btn" onClick={() => window.print()}>
                印刷 / PDF保存
              </button>
            </div>
          </article>
        )}
      </main>

      <footer className="footer">
        MEO Studio（試作）｜レポート自動生成モジュール — 試作のためデータはサンプルです。実運用ではGBP API連携で実データに置き換わります。
      </footer>
    </div>
  );
}
