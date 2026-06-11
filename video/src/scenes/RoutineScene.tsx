import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, Telop } from "../components/ui";

const ROUTINE = [
  {
    freq: "毎日",
    icon: "💬",
    title: "口コミに返信",
    body: "新着の口コミへ素早く返信。ネガ判定が出たらまず担当者へ。",
    tone: COLORS.accent,
  },
  {
    freq: "週 1〜2回",
    icon: "✍️",
    title: "投稿を発信",
    body: "テーマを決めて投稿文を生成。確認して GBP に投稿。",
    tone: COLORS.warm,
  },
  {
    freq: "月 1回",
    icon: "📊",
    title: "レポートで振り返り",
    body: "月次レポートを生成し、PDF/Wordでクライアントへ共有。",
    tone: COLORS.positive,
  },
];

export const RoutineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Background>
      <AbsoluteFill style={{ padding: "90px 96px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Kicker delay={2}>おすすめの運用サイクル</Kicker>
          <div style={{ marginTop: 18 }}>
            <SceneTitle delay={6} size={62}>
              日々の運用に、こう組み込む
            </SceneTitle>
          </div>
        </div>

        <div style={{ marginTop: 70, display: "flex", gap: 30 }}>
          {ROUTINE.map((r, i) => {
            const pop = spring({
              frame: frame - (20 + i * 12),
              fps,
              config: { damping: 14, stiffness: 150 },
              durationInFrames: 22,
            });
            return (
              <div
                key={r.freq}
                style={{
                  width: 380,
                  background: COLORS.surface,
                  borderRadius: 24,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "0 18px 50px rgba(40,30,80,0.10)",
                  padding: 40,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  transform: `translateY(${(1 - pop) * 46}px)`,
                  opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 22px",
                    borderRadius: 999,
                    background: r.tone,
                    color: "#fff",
                    fontFamily,
                    fontWeight: 900,
                    fontSize: 26,
                  }}
                >
                  {r.freq}
                </div>
                <div style={{ fontSize: 60 }}>{r.icon}</div>
                <div style={{ fontFamily, fontWeight: 900, fontSize: 34, color: COLORS.text }}>
                  {r.title}
                </div>
                <div style={{ fontFamily, fontSize: 24, lineHeight: 1.6, color: COLORS.textMuted, fontWeight: 500 }}>
                  {r.body}
                </div>
              </div>
            );
          })}
        </div>

        <Telop>生成はAIに任せ、人は「確認と判断」に集中できます</Telop>
      </AbsoluteFill>
    </Background>
  );
};
