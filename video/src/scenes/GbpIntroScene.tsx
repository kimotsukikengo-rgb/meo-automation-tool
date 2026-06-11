import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { SplitLayout } from "../components/SplitLayout";
import { Bullet, Callout, Telop } from "../components/ui";

// 右側: 「APIキー方式 ✗ / OAuth 2.0 ✓」の対比カード
const CompareCards: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardA = spring({ frame: frame - 16, fps, config: { damping: 16 }, durationInFrames: 20 });
  const cardB = spring({ frame: frame - 34, fps, config: { damping: 16 }, durationInFrames: 22 });

  return (
    <div style={{ width: 660, display: "flex", flexDirection: "column", gap: 26, position: "relative" }}>
      {/* ✗ APIキー方式 */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: "26px 30px",
          boxShadow: "0 14px 40px rgba(40,30,80,0.08)",
          opacity: interpolate(cardA, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${(1 - cardA) * 30}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: COLORS.danger,
              color: "#fff",
              fontFamily,
              fontWeight: 900,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 28, color: COLORS.text }}>
            APIキーを画面に貼る
          </div>
        </div>
        <div
          style={{
            fontFamily: "SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 21,
            color: COLORS.textFaint,
            background: COLORS.surface2,
            borderRadius: 8,
            padding: "10px 14px",
            textDecoration: "line-through",
          }}
        >
          API Key: sk-xxxxxxxxxxxx
        </div>
        <div style={{ fontFamily, fontSize: 21, color: COLORS.textMuted, marginTop: 12, fontWeight: 500 }}>
          GBP API に「APIキー方式」はありません。貼る欄もありません。
        </div>
      </div>

      {/* ✓ OAuth 2.0 */}
      <div
        style={{
          background: COLORS.surface,
          border: `2px solid ${COLORS.positive}`,
          borderRadius: 18,
          padding: "26px 30px",
          boxShadow: "0 18px 50px rgba(47,168,110,0.18)",
          opacity: interpolate(cardB, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${(1 - cardB) * 30}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: COLORS.positive,
              color: "#fff",
              fontFamily,
              fontWeight: 900,
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✓
          </div>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 28, color: COLORS.text }}>
            OAuth 2.0（店舗オーナーが承認）
          </div>
        </div>
        {/* フロー: 環境変数の鍵 → ボタンで承認 → トークン */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { label: "ID / Secret", sub: "環境変数", tone: COLORS.accent },
            { label: "Googleと連携", sub: "ボタンで承認", tone: COLORS.positive },
            { label: "トークン", sub: "自動保存", tone: COLORS.warm },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && (
                <div style={{ fontFamily, fontWeight: 900, fontSize: 26, color: COLORS.textFaint }}>→</div>
              )}
              <div
                style={{
                  flex: 1,
                  background: COLORS.surface2,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: "14px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily, fontWeight: 800, fontSize: 21, color: s.tone }}>{s.label}</div>
                <div style={{ fontFamily, fontSize: 17, color: COLORS.textFaint, marginTop: 4, fontWeight: 600 }}>
                  {s.sub}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Callout delay={50} tone="positive" style={{ bottom: -18, right: 8 }}>
        鍵は環境変数・連携はボタン
      </Callout>
    </div>
  );
};

export const GbpIntroScene: React.FC = () => {
  return (
    <SplitLayout
      kicker="まず最初に"
      title={
        <>
          「APIキーはどこに貼る？」
          <br />
          <span style={{ color: COLORS.accentStrong }}>→ 画面には貼りません</span>
        </>
      }
      titleSize={52}
      left={
        <>
          <Bullet index={0} variant="check">
            GBP API（旧 My Business）は<b>APIキーではなく OAuth 2.0</b>
          </Bullet>
          <Bullet index={1} variant="check">
            画面で行うのは店舗オーナーの<b>「承認」だけ</b>（ボタン1つ）
          </Bullet>
          <Bullet index={2} variant="check">
            クライアントID／シークレットは
            <code style={{ background: COLORS.surface2, padding: "2px 10px", borderRadius: 6 }}>.env.local</code>
            ／Vercelの<b>環境変数</b>で管理
          </Bullet>
          <Bullet index={3} variant="check">
            承認・設定が未了でも<b>mockで全フローを確認</b>できる
          </Bullet>
        </>
      }
      right={<CompareCards />}
    >
      <Telop>APIキーを貼る欄はありません。鍵は環境変数、連携は「承認」ボタンで完結します</Telop>
    </SplitLayout>
  );
};
