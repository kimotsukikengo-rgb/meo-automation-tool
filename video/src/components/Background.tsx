import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { APP_BG, COLORS } from "../theme";

// アプリのトップと同じ雰囲気の、淡いグラデーション背景。
// ゆっくり呼吸する光彩で、静止画にならないようにする。
export const Background: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 80);
  const glowX = interpolate(drift, [-1, 1], [78, 90]);
  const glowOpacity = interpolate(Math.sin(frame / 50), [-1, 1], [0.5, 0.85]);

  return (
    <AbsoluteFill style={{ background: APP_BG }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 520px at ${glowX}% -8%, rgba(106,76,227,0.16), transparent 60%)`,
          opacity: glowOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(760px 460px at ${100 - glowX}% 108%, rgba(232,149,74,0.12), transparent 60%)`,
        }}
      />
      {/* ごく薄いグリッドのテクスチャ */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          opacity: 0.18,
          maskImage:
            "radial-gradient(circle at 50% 40%, black, transparent 75%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
