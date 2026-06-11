import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { ModuleLayout } from "../components/ModuleLayout";
import { Bullet, Telop } from "../components/ui";

// 順位管理は試作版では準備中（AppBar で soon=true）。
// 完成イメージをモックで示しつつ「準備中」であることを明示する。
const ROWS = [
  { kw: "渋谷 リラクゼーション", rank: 3, diff: "▲1", tone: COLORS.positive },
  { kw: "渋谷 マッサージ", rank: 5, diff: "±0", tone: COLORS.textMuted },
  { kw: "肩こり 整体 渋谷", rank: 8, diff: "▼2", tone: COLORS.danger },
  { kw: "渋谷 もみほぐし", rank: 2, diff: "▲3", tone: COLORS.positive },
];

const RankVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardPop = spring({ frame: frame - 12, fps, config: { damping: 16 }, durationInFrames: 22 });
  const stampPop = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 170 }, durationInFrames: 22 });

  return (
    <div style={{ position: "relative", width: 820 }}>
      {/* 完成イメージ（モック）。準備中なので淡く表示 */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 22,
          padding: 34,
          boxShadow: "0 24px 60px rgba(40,30,80,0.16)",
          opacity: interpolate(cardPop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) * 0.5,
          transform: `translateY(${(1 - cardPop) * 36}px)`,
          filter: "saturate(0.7) blur(1.6px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: COLORS.text }}>📍 検索順位の推移</div>
          <div style={{ fontFamily, fontSize: 22, color: COLORS.textMuted, fontWeight: 600 }}>サンプル美容室 渋谷店</div>
        </div>

        {/* 見出し行 */}
        <div
          style={{
            display: "flex",
            fontFamily,
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.textFaint,
            padding: "0 18px 12px",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ flex: 1 }}>キーワード</div>
          <div style={{ width: 120, textAlign: "center" }}>現在順位</div>
          <div style={{ width: 110, textAlign: "center" }}>前回比</div>
        </div>

        {ROWS.map((row) => (
          <div
            key={row.kw}
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily,
              padding: "18px 18px",
              borderBottom: `1px solid ${COLORS.surface2}`,
            }}
          >
            <div style={{ flex: 1, fontSize: 25, fontWeight: 600, color: COLORS.text }}>{row.kw}</div>
            <div style={{ width: 120, textAlign: "center", fontSize: 30, fontWeight: 900, color: COLORS.text }}>
              {row.rank}<span style={{ fontSize: 18, fontWeight: 700, color: COLORS.textMuted }}>位</span>
            </div>
            <div style={{ width: 110, textAlign: "center", fontSize: 24, fontWeight: 800, color: row.tone }}>
              {row.diff}
            </div>
          </div>
        ))}
      </div>

      {/* 準備中スタンプ */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${stampPop}) rotate(-6deg)`,
          opacity: interpolate(stampPop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          background: COLORS.warm,
          color: "#fff",
          fontFamily,
          fontWeight: 900,
          fontSize: 40,
          letterSpacing: "0.04em",
          padding: "20px 44px",
          borderRadius: 18,
          boxShadow: "0 18px 44px rgba(40,30,80,0.30)",
          whiteSpace: "nowrap",
        }}
      >
        準備中 / Coming soon
      </div>
    </div>
  );
};

export const RankScene: React.FC = () => {
  return (
    <ModuleLayout
      stepNo={4}
      kicker="順位管理"
      title="検索順位の管理"
      left={
        <>
          <Bullet index={0} variant="number">
            指定キーワードでの<b>検索順位を定点観測</b>
          </Bullet>
          <Bullet index={1} variant="number">
            マップ・検索での<b>掲載順位の推移</b>を記録
          </Bullet>
          <Bullet index={2} variant="number">
            <b>競合との比較</b>で改善ポイントを把握
          </Bullet>
          <Bullet index={3} variant="warn">
            この機能は<b>現在 準備中</b>。メニューでは「準備中」と表示され、まだ選べません
          </Bullet>
        </>
      }
      right={
        <>
          <RankVisual />
          <Telop>完成イメージです。他の3機能を先にご利用ください</Telop>
        </>
      }
    />
  );
};
