import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { useReveal } from "../components/ui";

const MODULES = ["投稿文生成", "口コミ返信生成", "レポート自動生成"];

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoPop = spring({ frame, fps, config: { damping: 12, stiffness: 160 }, durationInFrames: 24 });
  const titleR = useReveal(14, 22);
  const subR = useReveal(26, 18);

  return (
    <Background>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          {/* ロゴマーク */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              transform: `scale(${logoPop})`,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: `linear-gradient(140deg, ${COLORS.accent}, ${COLORS.accentStrong})`,
                color: "#fff",
                fontFamily,
                fontWeight: 900,
                fontSize: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 18px 44px rgba(106,76,227,0.40)",
              }}
            >
              M
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily, fontWeight: 900, fontSize: 40, color: COLORS.text }}>
                MEO Studio
              </div>
              <div style={{ fontFamily, fontSize: 22, color: COLORS.textMuted, fontWeight: 500 }}>
                運用自動化ツール（試作）
              </div>
            </div>
          </div>

          <h1
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: 92,
              letterSpacing: "-0.03em",
              color: COLORS.text,
              margin: "8px 0 0",
              textAlign: "center",
              opacity: titleR,
              transform: `translateY(${(1 - titleR) * 26}px)`,
            }}
          >
            運用マニュアル
          </h1>

          <p
            style={{
              fontFamily,
              fontSize: 32,
              color: COLORS.textMuted,
              fontWeight: 500,
              margin: 0,
              opacity: subR,
              transform: `translateY(${(1 - subR) * 16}px)`,
            }}
          >
            Googleビジネスプロフィールを、AIで&nbsp;<span style={{ color: COLORS.accentStrong, fontWeight: 700 }}>半自動</span>&nbsp;運用する
          </p>

          {/* 3モジュール チップ */}
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {MODULES.map((m, i) => {
              const c = spring({
                frame: frame - (40 + i * 8),
                fps,
                config: { damping: 14, stiffness: 160 },
                durationInFrames: 20,
              });
              return (
                <div
                  key={m}
                  style={{
                    padding: "14px 28px",
                    borderRadius: 999,
                    background: COLORS.surface,
                    border: `1.5px solid ${COLORS.border}`,
                    boxShadow: "0 6px 18px rgba(40,30,80,0.08)",
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 26,
                    color: COLORS.text,
                    transform: `scale(${c})`,
                    opacity: interpolate(c, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  }}
                >
                  <span style={{ color: COLORS.accent, marginRight: 8 }}>●</span>
                  {m}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
