import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle } from "../components/ui";

const CARDS = [
  {
    no: 1,
    icon: "✍️",
    name: "投稿文生成",
    url: "/",
    desc: "店舗情報とテーマから、ローカル投稿の本文を複数案。ハッシュタグ・CTAも同時に。",
  },
  {
    no: 2,
    icon: "💬",
    name: "口コミ返信生成",
    url: "/reviews",
    desc: "口コミと星評価から返信案を複数。ネガティブを自動判定しエスカレーション。",
  },
  {
    no: 3,
    icon: "📊",
    name: "レポート自動生成",
    url: "/reports",
    desc: "月次のKPIを集計し、推移グラフとAI講評つきレポートを自動作成。",
  },
];

export const OverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Background>
      <AbsoluteFill style={{ padding: "90px 96px", display: "flex", flexDirection: "column" }}>
        <Kicker delay={2}>ツールの全体像</Kicker>
        <div style={{ marginTop: 18, marginBottom: 50 }}>
          <SceneTitle delay={6} size={64}>
            3つのモジュールで、MEO運用をまるごと支援
          </SceneTitle>
        </div>

        <div style={{ display: "flex", gap: 32, flex: 1, alignItems: "stretch" }}>
          {CARDS.map((c, i) => {
            const pop = spring({
              frame: frame - (18 + i * 10),
              fps,
              config: { damping: 14, stiffness: 150 },
              durationInFrames: 22,
            });
            return (
              <div
                key={c.name}
                style={{
                  flex: 1,
                  background: COLORS.surface,
                  borderRadius: 24,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "0 18px 50px rgba(40,30,80,0.10)",
                  padding: 44,
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  transform: `translateY(${(1 - pop) * 50}px) scale(${0.94 + pop * 0.06})`,
                  opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 22,
                      background: COLORS.accentSoft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 46,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div
                    style={{
                      fontFamily,
                      fontWeight: 900,
                      fontSize: 64,
                      color: COLORS.accentSoft,
                      lineHeight: 1,
                    }}
                  >
                    0{c.no}
                  </div>
                </div>
                <div style={{ fontFamily, fontWeight: 900, fontSize: 38, color: COLORS.text }}>
                  {c.name}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: 25,
                    lineHeight: 1.6,
                    color: COLORS.textMuted,
                    fontWeight: 500,
                    flex: 1,
                  }}
                >
                  {c.desc}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: 22,
                    color: COLORS.accentStrong,
                    fontWeight: 700,
                    background: COLORS.surface2,
                    padding: "10px 18px",
                    borderRadius: 999,
                    alignSelf: "flex-start",
                  }}
                >
                  localhost:3000{c.url}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
