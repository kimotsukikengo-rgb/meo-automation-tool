import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";

// 共通: delay フレーム後にフェード＋上方向スライドで現れる進捗値 0→1
export const useReveal = (delay: number, duration = 16) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

// アプリのセクション見出し上にある小さなピル
export const Kicker: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const r = useReveal(delay);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        background: COLORS.accentSoft,
        color: COLORS.accentStrong,
        fontFamily,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: "0.04em",
        opacity: r,
        transform: `translateY(${(1 - r) * 14}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const SceneTitle: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 4, size = 76 }) => {
  const r = useReveal(delay, 20);
  return (
    <h1
      style={{
        fontFamily,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: "-0.02em",
        color: COLORS.text,
        margin: 0,
        opacity: r,
        transform: `translateY(${(1 - r) * 24}px)`,
      }}
    >
      {children}
    </h1>
  );
};

export const Lead: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 10,
}) => {
  const r = useReveal(delay);
  return (
    <p
      style={{
        fontFamily,
        fontSize: 28,
        lineHeight: 1.6,
        color: COLORS.textMuted,
        margin: 0,
        maxWidth: 760,
        opacity: r,
        transform: `translateY(${(1 - r) * 16}px)`,
      }}
    >
      {children}
    </p>
  );
};

// 画面下部のナレーション帯
export const Telop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 64,
        display: "flex",
        justifyContent: "center",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          padding: "20px 40px",
          borderRadius: 18,
          background: "rgba(28,24,48,0.86)",
          color: "#fff",
          fontFamily,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.45,
          textAlign: "center",
          boxShadow: "0 14px 40px rgba(20,15,45,0.35)",
          backdropFilter: "blur(6px)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// 番号つき / チェックつきの箇条書き
export const Bullet: React.FC<{
  children: React.ReactNode;
  index: number;
  baseDelay?: number;
  variant?: "check" | "number" | "warn";
}> = ({ children, index, baseDelay = 18, variant = "check" }) => {
  const r = useReveal(baseDelay + index * 12);
  const markBg =
    variant === "warn"
      ? COLORS.danger
      : variant === "number"
        ? COLORS.accent
        : COLORS.positive;
  const mark = variant === "warn" ? "!" : variant === "number" ? index + 1 : "✓";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
        opacity: r,
        transform: `translateX(${(1 - r) * -20}px)`,
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: markBg,
          color: "#fff",
          fontFamily,
          fontWeight: 900,
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {mark}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 30,
          lineHeight: 1.5,
          color: COLORS.text,
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// 画面を指す浮遊バッジ（pop イン）
export const Callout: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: "accent" | "danger" | "positive" | "warm";
  style?: React.CSSProperties;
}> = ({ children, delay = 0, tone = "accent", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 180 },
    durationInFrames: 20,
  });
  const bg =
    tone === "danger"
      ? COLORS.danger
      : tone === "positive"
        ? COLORS.positive
        : tone === "warm"
          ? COLORS.warm
          : COLORS.accent;
  return (
    <div
      style={{
        position: "absolute",
        padding: "12px 22px",
        borderRadius: 14,
        background: bg,
        color: "#fff",
        fontFamily,
        fontWeight: 700,
        fontSize: 26,
        boxShadow: "0 12px 30px rgba(30,20,60,0.30)",
        transform: `scale(${pop})`,
        opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
