import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "../components/Background";
import { Kicker, SceneTitle, Bullet, Telop } from "../components/ui";

const MODELS = [
  { name: "claude-haiku-4-5", use: "量産・ドラフト", tone: COLORS.positive },
  { name: "claude-sonnet-4-6", use: "通常運用（既定）", tone: COLORS.accent },
  { name: "claude-opus-4-8", use: "重要店舗・最終案", tone: COLORS.warm },
];

const CODE = `# プロジェクト直下に .env.local を作成
AI_GATEWAY_API_KEY=あなたのキー
MEO_GENERATION_MODEL=anthropic/claude-sonnet-4-6`;

export const AiEnableScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const codePop = spring({ frame: frame - 16, fps, config: { damping: 16 }, durationInFrames: 22 });

  return (
    <Background>
      <AbsoluteFill style={{ padding: "84px 96px", display: "flex", flexDirection: "row", gap: 60 }}>
        <div style={{ flex: "0 0 760px", display: "flex", flexDirection: "column" }}>
          <Kicker delay={2}>品質を上げる</Kicker>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <SceneTitle delay={6} size={60}>
              本物のAI生成（Claude）を有効にする
            </SceneTitle>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Bullet index={0} variant="check">
              <b>APIキー未設定でも</b>サンプルで全機能を試せる
            </Bullet>
            <Bullet index={1} variant="check">
              <code style={{ background: COLORS.surface2, padding: "2px 10px", borderRadius: 6 }}>.env.local</code> にキーとモデルを設定
            </Bullet>
            <Bullet index={2} variant="check">
              再起動するとバッジが<b>「● AI生成」</b>に変わる
            </Bullet>
            <Bullet index={3} variant="check">
              失敗時は<b>自動でサンプルにフォールバック</b>
            </Bullet>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
          {/* コードカード */}
          <div
            style={{
              background: "#1E1B2E",
              borderRadius: 18,
              padding: 34,
              boxShadow: "0 24px 60px rgba(30,20,60,0.30)",
              transform: `translateY(${(1 - codePop) * 40}px)`,
              opacity: interpolate(codePop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["#ED6A5E", "#F4BF4F", "#61C554"].map((c) => (
                <div key={c} style={{ width: 13, height: 13, borderRadius: 999, background: c }} />
              ))}
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: "SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 24,
                lineHeight: 1.7,
                color: "#E8E4F5",
                whiteSpace: "pre-wrap",
              }}
            >
              {CODE}
            </pre>
          </div>

          {/* モデル選択 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MODELS.map((m, i) => {
              const r = spring({ frame: frame - (40 + i * 8), fps, config: { damping: 18 }, durationInFrames: 18 });
              return (
                <div
                  key={m.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: "16px 22px",
                    opacity: r,
                    transform: `translateX(${(1 - r) * 24}px)`,
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: m.tone }} />
                  <code style={{ fontFamily: "Menlo, monospace", fontSize: 23, color: COLORS.text, fontWeight: 700 }}>
                    {m.name}
                  </code>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily, fontSize: 22, color: COLORS.textMuted, fontWeight: 600 }}>{m.use}</div>
                </div>
              );
            })}
          </div>
        </div>

        <Telop>まずはサンプルで試し、品質を上げたいときにキーを設定すればOK</Telop>
      </AbsoluteFill>
    </Background>
  );
};
