import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { useReveal } from "../components/ui";

// 連携で実データになる3モジュール
const TARGETS = ["投稿の公開", "口コミの取得・返信", "レポート数値"];

export const GbpTitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgePop = spring({ frame, fps, config: { damping: 13, stiffness: 160 }, durationInFrames: 22 });
  const titleR = useReveal(14, 22);
  const subR = useReveal(26, 18);

  return (
    <Background>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {/* バッジ: GBP × MEO Studio */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              transform: `scale(${badgePop})`,
            }}
          >
            <div
              style={{
                padding: "12px 22px",
                borderRadius: 16,
                background: COLORS.surface,
                border: `1.5px solid ${COLORS.border}`,
                boxShadow: "0 8px 24px rgba(40,30,80,0.10)",
                fontFamily,
                fontWeight: 800,
                fontSize: 26,
                color: COLORS.text,
              }}
            >
              <span style={{ color: "#4285F4" }}>G</span>
              <span style={{ color: "#EA4335" }}>o</span>
              <span style={{ color: "#FBBC05" }}>o</span>
              <span style={{ color: "#4285F4" }}>g</span>
              <span style={{ color: "#34A853" }}>l</span>
              <span style={{ color: "#EA4335" }}>e</span>
              <span style={{ color: COLORS.textMuted, marginLeft: 8 }}>Business Profile</span>
            </div>
            <span style={{ fontFamily, fontWeight: 900, fontSize: 30, color: COLORS.textFaint }}>×</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: 16,
                background: `linear-gradient(140deg, ${COLORS.accent}, ${COLORS.accentStrong})`,
                boxShadow: "0 10px 28px rgba(106,76,227,0.35)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontFamily,
                  fontWeight: 900,
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                M
              </div>
              <span style={{ fontFamily, fontWeight: 800, fontSize: 26, color: "#fff" }}>
                MEO Studio
              </span>
            </div>
          </div>

          <h1
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: 82,
              letterSpacing: "-0.03em",
              color: COLORS.text,
              margin: "12px 0 0",
              textAlign: "center",
              lineHeight: 1.1,
              opacity: titleR,
              transform: `translateY(${(1 - titleR) * 26}px)`,
            }}
          >
            GBP連携 マニュアル
          </h1>

          <p
            style={{
              fontFamily,
              fontSize: 31,
              color: COLORS.textMuted,
              fontWeight: 500,
              margin: 0,
              textAlign: "center",
              opacity: subR,
              transform: `translateY(${(1 - subR) * 16}px)`,
            }}
          >
            連携すると、
            <span style={{ color: COLORS.accentStrong, fontWeight: 700 }}>サンプル</span>
            だった出力が&nbsp;
            <span style={{ color: COLORS.accentStrong, fontWeight: 700 }}>実店舗のデータ</span>
            &nbsp;に変わる
          </p>

          {/* 連携で実データになる対象チップ */}
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {TARGETS.map((t, i) => {
              const c = spring({
                frame: frame - (42 + i * 8),
                fps,
                config: { damping: 14, stiffness: 160 },
                durationInFrames: 20,
              });
              return (
                <div
                  key={t}
                  style={{
                    padding: "13px 26px",
                    borderRadius: 999,
                    background: COLORS.surface,
                    border: `1.5px solid ${COLORS.border}`,
                    boxShadow: "0 6px 18px rgba(40,30,80,0.08)",
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 24,
                    color: COLORS.text,
                    transform: `scale(${c})`,
                    opacity: interpolate(c, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  }}
                >
                  <span style={{ color: COLORS.positive, marginRight: 8 }}>✓</span>
                  {t}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
