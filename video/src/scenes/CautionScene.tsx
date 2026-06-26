import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, Telop } from "../components/ui";

const CAUTIONS = [
  { icon: "✅", title: "事実確認は人の責任", body: "価格・日時・コース内容はAIが誤ることがある。投稿・返信前に必ず照合。" },
  { icon: "⚖️", title: "薬機法・景表法", body: "「治る」「効果は確実」などの断定や、根拠のない最上級表現は使わない。" },
  { icon: "🔒", title: "個人情報を書かない", body: "来店日時・施術内容・投稿者名など、本人特定につながる情報は入れない。" },
  { icon: "🚨", title: "ネガ口コミは即返信しない", body: "エスカレーション警告が出たら、まず担当者・店舗と事実関係を確認。" },
];

export const CautionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Background>
      <AbsoluteFill style={{ padding: "84px 96px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Kicker delay={2}>運用上の注意（重要）</Kicker>
          <div style={{ marginTop: 18 }}>
            <SceneTitle delay={6} size={60}>
              安全に使うための4つの約束
            </SceneTitle>
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            width: 1500,
          }}
        >
          {CAUTIONS.map((c, i) => {
            const pop = spring({
              frame: frame - (18 + i * 9),
              fps,
              config: { damping: 15, stiffness: 150 },
              durationInFrames: 20,
            });
            return (
              <div
                key={c.title}
                style={{
                  display: "flex",
                  gap: 22,
                  alignItems: "flex-start",
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `6px solid ${COLORS.warm}`,
                  borderRadius: 18,
                  padding: "30px 32px",
                  boxShadow: "0 14px 40px rgba(40,30,80,0.08)",
                  transform: `translateY(${(1 - pop) * 36}px)`,
                  opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                }}
              >
                <div style={{ fontSize: 50, lineHeight: 1 }}>{c.icon}</div>
                <div>
                  <div style={{ fontFamily, fontWeight: 900, fontSize: 32, color: COLORS.text, marginBottom: 8 }}>
                    {c.title}
                  </div>
                  <div style={{ fontFamily, fontSize: 24, lineHeight: 1.55, color: COLORS.textMuted, fontWeight: 500 }}>
                    {c.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Telop>本ツールは「下書き作成の支援」。最終判断は運用担当者が行います</Telop>
      </AbsoluteFill>
    </Background>
  );
};
