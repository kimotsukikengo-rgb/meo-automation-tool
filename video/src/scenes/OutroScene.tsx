import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { useReveal } from "../components/ui";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoPop = spring({ frame, fps, config: { damping: 13, stiffness: 150 }, durationInFrames: 24 });
  const r1 = useReveal(16, 18);
  const r2 = useReveal(28, 18);

  return (
    <Background>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 28,
              background: `linear-gradient(140deg, ${COLORS.accent}, ${COLORS.accentStrong})`,
              color: "#fff",
              fontFamily,
              fontWeight: 900,
              fontSize: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 18px 44px rgba(106,76,227,0.40)",
              transform: `scale(${logoPop})`,
            }}
          >
            M
          </div>

          <h1
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: 70,
              color: COLORS.text,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              opacity: r1,
              transform: `translateY(${(1 - r1) * 22}px)`,
            }}
          >
            まずは&nbsp;<span style={{ color: COLORS.accentStrong }}>サンプル生成</span>&nbsp;から
          </h1>

          <p
            style={{
              fontFamily,
              fontSize: 30,
              color: COLORS.textMuted,
              fontWeight: 500,
              margin: 0,
              textAlign: "center",
              maxWidth: 1180,
              lineHeight: 1.6,
              opacity: r2,
              transform: `translateY(${(1 - r2) * 16}px)`,
            }}
          >
            投稿・口コミ・レポートを、AIで半自動に。
            <br />
            モジュールは1つずつ追加し、GBP API連携で実データ運用へ拡張できます。
          </p>

          <div
            style={{
              marginTop: 14,
              padding: "16px 34px",
              borderRadius: 999,
              background: COLORS.text,
              color: "#fff",
              fontFamily,
              fontWeight: 700,
              fontSize: 28,
              opacity: interpolate(frame, [44, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            http://localhost:3000
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
