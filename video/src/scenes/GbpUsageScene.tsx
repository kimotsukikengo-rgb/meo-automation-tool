import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, Telop } from "../components/ui";

// 連携店舗が直結する3モジュールと、各画面に現れる「選ぶUI」と効果
const FLOWS = [
  {
    icon: "✍️",
    name: "投稿文生成",
    pick: "GBP投稿先",
    effect: "生成した本文を、選んだ店舗へ直接公開",
    tone: COLORS.accent,
  },
  {
    icon: "💬",
    name: "口コミ返信生成",
    pick: "GBP口コミ取得",
    effect: "店舗の口コミを取得し、返信をそのまま投稿",
    tone: COLORS.positive,
  },
  {
    icon: "📊",
    name: "レポート自動生成",
    pick: "GBP数値取得",
    effect: "表示回数・電話・ルート検索などの実数値を取得",
    tone: COLORS.warm,
  },
];

export const GbpUsageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chipPop = spring({ frame: frame - 14, fps, config: { damping: 14, stiffness: 150 }, durationInFrames: 20 });

  return (
    <Background>
      <AbsoluteFill style={{ padding: "80px 96px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Kicker delay={2}>連携したら、どう効く？</Kicker>
          <div style={{ marginTop: 16 }}>
            <SceneTitle delay={6} size={58}>
              連携店舗が、3モジュールに直結
            </SceneTitle>
          </div>
        </div>

        {/* 連携店舗ノード */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 30px",
            borderRadius: 16,
            background: `linear-gradient(140deg, ${COLORS.accent}, ${COLORS.accentStrong})`,
            boxShadow: "0 16px 40px rgba(106,76,227,0.32)",
            transform: `scale(${chipPop})`,
          }}
        >
          <span style={{ fontSize: 30 }}>🏪</span>
          <span style={{ fontFamily, fontWeight: 800, fontSize: 30, color: "#fff" }}>連携店舗</span>
          <span
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 20,
              color: "#fff",
              background: "rgba(255,255,255,0.20)",
              padding: "4px 14px",
              borderRadius: 999,
            }}
          >
            設定・連携で追加
          </span>
        </div>

        {/* 下向きコネクタ */}
        <div
          style={{
            width: 2,
            height: 34,
            background: COLORS.borderStrong,
            opacity: interpolate(frame, [24, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />

        {/* 3モジュールへの分岐カード */}
        <div style={{ display: "flex", gap: 30, width: 1560, alignItems: "stretch" }}>
          {FLOWS.map((f, i) => {
            const pop = spring({
              frame: frame - (34 + i * 9),
              fps,
              config: { damping: 15, stiffness: 150 },
              durationInFrames: 22,
            });
            return (
              <div
                key={f.name}
                style={{
                  flex: 1,
                  background: COLORS.surface,
                  borderRadius: 22,
                  border: `1px solid ${COLORS.border}`,
                  borderTop: `5px solid ${f.tone}`,
                  boxShadow: "0 18px 50px rgba(40,30,80,0.10)",
                  padding: 34,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  transform: `translateY(${(1 - pop) * 44}px)`,
                  opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      background: COLORS.accentSoft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div style={{ fontFamily, fontWeight: 900, fontSize: 30, color: COLORS.text }}>{f.name}</div>
                </div>

                {/* 各画面に現れる「店舗を選ぶ」UI（合成） */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: COLORS.surface2,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontFamily, fontSize: 17, color: COLORS.textFaint, fontWeight: 700 }}>
                      {f.pick}
                    </span>
                    <span style={{ fontFamily, fontSize: 22, color: COLORS.textFaint, fontWeight: 600 }}>
                      店舗を選択…
                    </span>
                  </div>
                  <span style={{ fontSize: 20, color: COLORS.textMuted }}>▾</span>
                </div>

                <div
                  style={{
                    fontFamily,
                    fontSize: 23,
                    lineHeight: 1.55,
                    color: COLORS.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {f.effect}
                </div>
              </div>
            );
          })}
        </div>

        <Telop>連携すると各画面に「店舗を選ぶ」が現れます。選んで取得・投稿すると、実データで動きます</Telop>
      </AbsoluteFill>
    </Background>
  );
};
