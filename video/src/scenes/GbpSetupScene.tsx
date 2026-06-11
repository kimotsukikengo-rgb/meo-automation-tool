import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { SplitLayout } from "../components/SplitLayout";
import { Bullet, Telop } from "../components/ui";

// 実運用に必要な環境変数（docs/GBP連携_セットアップ.md と対応。値はプレースホルダ）
const ENV = `# .env.local（本番は Vercel の環境変数）
GBP_OAUTH_CLIENT_ID=...
GBP_OAUTH_CLIENT_SECRET=...
GBP_OAUTH_REDIRECT_URI=.../api/gbp/callback
GBP_TOKEN_ENCRYPTION_KEY=...   # 暗号化鍵(生成はdocs)
GBP_STATE_SECRET=...           # CSRF対策(生成はdocs)
DATABASE_URL=...               # Neon Postgres
GBP_LIVE=on                    # 実APIを有効化`;

const SetupVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const codePop = spring({ frame: frame - 16, fps, config: { damping: 16 }, durationInFrames: 22 });
  const warnPop = spring({ frame: frame - 44, fps, config: { damping: 14, stiffness: 160 }, durationInFrames: 20 });

  return (
    <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 環境変数のコードカード */}
      <div
        style={{
          background: "#1E1B2E",
          borderRadius: 18,
          padding: 30,
          boxShadow: "0 24px 60px rgba(30,20,60,0.30)",
          transform: `translateY(${(1 - codePop) * 40}px)`,
          opacity: interpolate(codePop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["#ED6A5E", "#F4BF4F", "#61C554"].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 999, background: c }} />
          ))}
        </div>
        <pre
          style={{
            margin: 0,
            fontFamily: "SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 21,
            lineHeight: 1.65,
            color: "#E8E4F5",
            whiteSpace: "pre-wrap",
          }}
        >
          {ENV}
        </pre>
      </div>

      {/* 承認待ちの注意バッジ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `6px solid ${COLORS.warm}`,
          borderRadius: 14,
          padding: "18px 24px",
          boxShadow: "0 12px 30px rgba(40,30,80,0.10)",
          transform: `scale(${warnPop})`,
          opacity: interpolate(warnPop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 36 }}>⏳</span>
        <div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 25, color: COLORS.text }}>
            Google の API 利用承認に 3〜10営業日
          </div>
          <div style={{ fontFamily, fontSize: 21, color: COLORS.textMuted, fontWeight: 500, marginTop: 4 }}>
            承認が下りるまでは <b>GBP_LIVE=off</b> のまま mock で全フロー確認OK
          </div>
          <div style={{ fontFamily, fontSize: 19, color: COLORS.textFaint, fontWeight: 500, marginTop: 6 }}>
            ※ mockは画面確認用。実店舗への投稿・実数値の取得はされません
          </div>
        </div>
      </div>
    </div>
  );
};

export const GbpSetupScene: React.FC = () => {
  return (
    <SplitLayout
      kicker="実運用に切り替える"
      title="本番は、環境変数の設定だけ"
      titleSize={54}
      left={
        <>
          <Bullet index={0} variant="number">
            Google Cloud で<b>GBP API群を有効化</b>し、API利用承認を申請
          </Bullet>
          <Bullet index={1} variant="number">
            OAuth同意画面を<b>「テスト」</b>にし、テストユーザーを追加
          </Bullet>
          <Bullet index={2} variant="number">
            OAuthクライアントを作成 → <b>ID／Secret を環境変数へ</b>
          </Bullet>
          <Bullet index={3} variant="number">
            <code style={{ background: COLORS.surface2, padding: "2px 10px", borderRadius: 6 }}>GBP_LIVE=on</code>
            に切替 → 設定画面から<b>本連携</b>
          </Bullet>
        </>
      }
      right={<SetupVisual />}
    >
      <Telop>シークレットは環境変数だけ。詳しい手順は docs/GBP連携_セットアップ.md にまとめています</Telop>
    </SplitLayout>
  );
};
