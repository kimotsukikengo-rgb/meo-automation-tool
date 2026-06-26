import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, Telop } from "../components/ui";

const STEPS = [
  { icon: "🤖", label: "AIが生成", sub: "本文・返信・講評を複数案", tone: COLORS.accent },
  { icon: "👤", label: "人が確認", sub: "事実・表現・ガイドライン", tone: COLORS.warm },
  { icon: "🚀", label: "GBPへ投稿", sub: "コピーして貼り付け", tone: COLORS.positive },
];

export const PhilosophyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Background>
      <AbsoluteFill style={{ padding: "90px 96px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Kicker delay={2}>共通の考え方</Kicker>
          <div style={{ marginTop: 20 }}>
            <SceneTitle delay={6} size={62}>
              「生成」はAI、<span style={{ color: COLORS.accentStrong }}>最終チェックと投稿は人</span>
            </SceneTitle>
          </div>
        </div>

        <div
          style={{
            marginTop: 80,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {STEPS.map((s, i) => {
            const pop = spring({
              frame: frame - (24 + i * 16),
              fps,
              config: { damping: 13, stiffness: 150 },
              durationInFrames: 22,
            });
            const arrowR = spring({
              frame: frame - (34 + i * 16),
              fps,
              config: { damping: 200 },
              durationInFrames: 14,
            });
            return (
              <React.Fragment key={s.label}>
                <div
                  style={{
                    width: 320,
                    background: COLORS.surface,
                    borderRadius: 26,
                    border: `2px solid ${s.tone}`,
                    padding: "44px 28px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    boxShadow: "0 18px 50px rgba(40,30,80,0.10)",
                    transform: `translateY(${(1 - pop) * 40}px) scale(${0.9 + pop * 0.1})`,
                    opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  }}
                >
                  <div style={{ fontSize: 72 }}>{s.icon}</div>
                  <div style={{ fontFamily, fontWeight: 900, fontSize: 38, color: COLORS.text }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily, fontSize: 23, color: COLORS.textMuted, textAlign: "center", fontWeight: 500 }}>
                    {s.sub}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      fontSize: 56,
                      color: COLORS.borderStrong,
                      opacity: arrowR,
                      transform: `translateX(${(1 - arrowR) * -10}px)`,
                    }}
                  >
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Telop>
          事実誤りや炎上を防ぐための、意図的な「半自動」設計です
        </Telop>
      </AbsoluteFill>
    </Background>
  );
};
