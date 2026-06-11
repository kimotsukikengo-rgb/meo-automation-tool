"use client";

import { useCallback, useEffect, useState } from "react";
import "./ui.css";
import "./settings.css";
import AppBar from "./AppBar";

/** 連携店舗（API レスポンス。トークンは含まれない） */
interface ConnectedStore {
  id: string;
  storeLabel: string;
  locationName: string;
  locationTitle: string;
  googleAccountId?: string;
  createdAt: string;
}

interface SettingsStatus {
  live: boolean;
  configured: boolean;
  dbConfigured: boolean;
}

interface Notice {
  kind: "ok" | "err";
  text: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "連携の検証に失敗しました（state 不一致）。もう一度お試しください。",
  no_refresh_token:
    "リフレッシュトークンが取得できませんでした。Googleアカウントの連携（権限）を一度解除してから再度お試しください。",
  connect_failed:
    "連携に失敗しました。API 利用承認・アクセス権限をご確認ください。",
  oauth_config: "OAuth 設定が不正です。環境変数をご確認ください。",
  mock_full: "追加できるデモ店舗がもうありません。",
  mock: "デモ連携に失敗しました。",
  access_denied: "Google 側で連携が拒否されました。",
};

export default function SettingsManager({
  status,
}: {
  status: SettingsStatus;
}) {
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gbp/stores");
      const json = await res.json();
      if (res.ok) setStores(json.stores ?? []);
    } catch {
      setNotice({ kind: "err", text: "連携店舗の取得に失敗しました。" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // OAuth/mock 連携からの戻り（?connected / ?error）を通知に反映
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      setNotice({
        kind: "ok",
        text:
          connected === "mock"
            ? "デモ店舗を1件連携しました。"
            : `${connected}件の店舗を連携しました。`,
      });
    } else if (error) {
      setNotice({
        kind: "err",
        text: ERROR_MESSAGES[error] ?? `連携でエラーが発生しました（${error}）。`,
      });
    }
    if (connected || error) {
      window.history.replaceState(null, "", "/settings");
    }
  }, []);

  const disconnect = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/gbp/stores?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStores((prev) => prev.filter((s) => s.id !== id));
        setNotice({ kind: "ok", text: "連携を解除しました。" });
      } else {
        setNotice({ kind: "err", text: "連携解除に失敗しました。" });
      }
    } catch {
      setNotice({ kind: "err", text: "連携解除に失敗しました。" });
    } finally {
      setBusyId(null);
    }
  };

  const isLive = status.live;

  return (
    <div className="shell">
      <AppBar active="settings" />
      <main className="main">
        <div className="intro">
          <span className="eyebrow">● 設定・連携</span>
          <h1>Googleビジネスプロフィール連携</h1>
          <p>
            お店のGBPをつなぐと、投稿の公開・口コミの取得/返信・レポート数値の取得が
            ボタン操作だけでできるようになります。
          </p>
        </div>

        {/* いまどちらのモードか、ひと目で分かるバナー */}
        <section
          className="set-mode"
          data-mode={isLive ? "live" : "demo"}
          aria-label="動作モード"
        >
          <span className="set-mode-icon" aria-hidden>
            {isLive ? "🔗" : "🧪"}
          </span>
          <div className="set-mode-body">
            <p className="set-mode-title">
              {isLive ? "本番モード" : "おためしモード"}
            </p>
            <p className="set-mode-desc">
              {isLive
                ? "実際のお店のGBPに反映されます。「Googleと連携」からお店をつないでください。"
                : "サンプル店舗で操作を体験できます（実際のお店には反映されません）。本番にするには初回の準備が必要です。"}
            </p>
          </div>
        </section>

        {/* はじめての方向けの3ステップガイド（開閉式） */}
        <details className="set-guide">
          <summary>
            <span className="set-guide-icon" aria-hidden>
              💡
            </span>
            はじめての方へ — 使い方は3ステップ
          </summary>
          <ol className="set-steps">
            <li>
              <span className="set-step-no">1</span>
              <span>
                下の <strong>「Googleと連携」</strong> ボタンを押す
              </span>
            </li>
            <li>
              <span className="set-step-no">2</span>
              <span>
                {isLive
                  ? "お店を管理しているGoogleアカウントでログインし「許可」を押す"
                  : "サンプル店舗が追加されます（練習用）"}
              </span>
            </li>
            <li>
              <span className="set-step-no">3</span>
              <span>
                「連携中の店舗」にお店が表示されたら完了。投稿・口コミ・レポートで使えます
              </span>
            </li>
          </ol>
          <p className="set-guide-note">
            くわしい手順は <code>docs/GBP連携_セットアップ.md</code>（かんたんマニュアル）をご覧ください。
          </p>
        </details>

        {notice && (
          <div className={`set-notice ${notice.kind}`} role="status">
            {notice.text}
          </div>
        )}

        <section className="set-connect">
          <div>
            <h2>店舗を連携</h2>
            <p className="set-sub">
              {isLive
                ? "Googleアカウントで認証し、管理権限のあるお店を取り込みます。"
                : "いまはおためしモードです。ボタンを押すとサンプル店舗が追加され、各機能を試せます。"}
            </p>
          </div>
          <a className="generate set-connect-btn" href="/api/gbp/auth">
            Googleと連携
          </a>
        </section>

        <section>
          <div className="results-head">
            <h2>
              連携中の店舗{" "}
              <span className="set-count">{stores.length}件</span>
            </h2>
            <button
              className="clear-btn"
              onClick={loadStores}
              disabled={loading}
            >
              ↻ 更新
            </button>
          </div>

          {loading ? (
            <p className="set-sub">読み込み中…</p>
          ) : stores.length === 0 ? (
            <div className="empty">
              <span className="big">🏪</span>
              <p>まだ店舗が連携されていません。</p>
              <p className="set-sub">「Googleと連携」から追加してください。</p>
            </div>
          ) : (
            <ul className="store-list">
              {stores.map((s) => (
                <li key={s.id} className="store-row">
                  <div className="store-main">
                    <span className="store-name">{s.storeLabel}</span>
                    <span className="store-meta">
                      {s.locationName}
                      {s.googleAccountId ? ` ・ ${s.googleAccountId}` : ""}
                    </span>
                  </div>
                  <button
                    className="store-disconnect"
                    disabled={busyId === s.id}
                    onClick={() => disconnect(s.id)}
                  >
                    連携解除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 準備担当向けの詳細ステータス（ふだんは畳んでおく） */}
        <details className="set-detail">
          <summary>準備担当の方へ — 設定の状態を確認</summary>
          <ul className="set-detail-list">
            <li data-state={isLive ? "on" : "off"}>
              連携モード：{isLive ? "本番（実API）" : "おためし（デモ）"}
            </li>
            <li data-state={status.configured ? "on" : "off"}>
              OAuth設定：{status.configured ? "登録済み" : "未登録"}
            </li>
            <li data-state={status.dbConfigured ? "on" : "off"}>
              保存先：{status.dbConfigured ? "データベース（永続）" : "メモリ（再起動で消えます）"}
            </li>
          </ul>
          <p className="set-guide-note">
            本番にする手順とエラー対処は <code>docs/GBP連携_セットアップ.md</code> を参照。
            秘密の情報（鍵・シークレット）は画面に貼らず環境変数で管理します。
          </p>
        </details>
      </main>
      <footer className="footer">
        MEO Studio（試作）｜設定・連携モジュール — シークレットは環境変数で管理します。
      </footer>
    </div>
  );
}
