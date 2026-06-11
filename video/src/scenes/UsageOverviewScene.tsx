import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, useReveal } from "../components/ui";

// アプリ上部ナビと同じ5項目。soon=準備中（順位管理）
const NAV = [
  { label: "投稿文生成", soon: false },
  { label: "口コミ返信", soon: false },
  { label: "レポート", soon: false },
  { label: "順位管理", soon: true },
  { label: "設定・連携", soon: false },
];

const ROWS = [
  { no: 1, icon: "✍️", name: "投稿文生成", desc: "店舗情報とテーマから、投稿文の案を複数まとめて作成" },
  { no: 2, icon: "💬", name: "口コミ返信", desc: "口コミと星評価から、返信文の案を作成（ネガは自動で注意表示）" },
  { no: 3, icon: "📊", name: "レポート", desc: "月次のKPIを集計し、グラフとAI講評つきレポートを自動作成" },
  { no: 4, icon: "📍", name: "順位管理", desc: "検索順位の定点観測（※現在 準備中）", soon: true },
  { no: 5, icon: "⚙️", name: "設定・連携", desc: "Googleビジネスプロフィールとの連携・連携店舗の管理" },
];

// アプリ上部ナビの再現（どこをクリックするかを示す）
const MockAppBar: React.FC = () => {
  const r = useReveal(4, 18);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        padding: "18px 28px",
        boxShadow: "0 14px 40px rgba(40,30,80,0.10)",
        opacity: r,
        transform: `translateY(${(1 - r) * -16}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(140deg, ${COLORS.accent}, ${COLORS.accentStrong})`,
            color: "#fff",
            fontFamily,
            fontWeight: 900,
            fontSize: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          M
        </div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 26, color: COLORS.text }}>MEO Studio</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {NAV.map((n) => (
          <div
            key={n.label}
            style={{
              fontFamily,
              fontSize: 22,
              fontWeight: 700,
              padding: "10px 18px",
              borderRadius: 999,
              color: n.soon ? COLORS.textFaint : COLORS.text,
              background: n.soon ? "transparent" : COLORS.surface2,
              border: n.soon ? `1px dashed ${COLORS.borderStrong}` : "1px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {n.label}
            {n.soon && (
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.warm,
                  background: "#FBEEDF",
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                準備中
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const UsageOverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Background>
      <AbsoluteFill style={{ padding: "80px 96px", display: "flex", flexDirection: "column" }}>
        <Kicker delay={2}>画面の構成</Kicker>
        <div style={{ marginTop: 16, marginBottom: 34 }}>
          <SceneTitle delay={6} size={58}>
            上部メニューの切り替えで、5つの機能を使います
          </SceneTitle>
        </div>

        <div style={{ marginBottom: 34 }}>
          <MockAppBar />
        </div>

        {/* 5機能の説明行 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {ROWS.map((row, i) => {
            const pop = spring({
              frame: frame - (28 + i * 9),
              fps,
              config: { damping: 16, stiffness: 150 },
              durationInFrames: 20,
            });
            return (
              <div
                key={row.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  padding: "20px 28px",
                  boxShadow: "0 10px 28px rgba(40,30,80,0.07)",
                  opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateX(${(1 - pop) * -24}px)`,
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: row.soon ? COLORS.surface2 : COLORS.accent,
                    color: row.soon ? COLORS.textFaint : "#fff",
                    fontFamily,
                    fontWeight: 900,
                    fontSize: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {row.no}
                </div>
                <div style={{ fontSize: 36, flex: "0 0 auto", width: 48, textAlign: "center" }}>{row.icon}</div>
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 260,
                    fontFamily,
                    fontWeight: 900,
                    fontSize: 32,
                    color: row.soon ? COLORS.textMuted : COLORS.text,
                  }}
                >
                  {row.name}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily,
                    fontSize: 26,
                    fontWeight: 500,
                    lineHeight: 1.45,
                    color: COLORS.textMuted,
                  }}
                >
                  {row.desc}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
