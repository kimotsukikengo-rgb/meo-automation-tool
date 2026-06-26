import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";
import { fontFamily } from "../fonts";
import { Background } from "./Background";
import { Kicker, SceneTitle, useReveal } from "./ui";

interface ModuleLayoutProps {
  stepNo: number; // 1,2,3
  kicker: string; // 例: 投稿作成・投稿管理
  title: React.ReactNode;
  left: React.ReactNode; // 説明・箇条書き
  right: React.ReactNode; // ブラウザ枠など
}

// 左に説明、右に画面。左上に大きなモジュール番号。
export const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  stepNo,
  kicker,
  title,
  left,
  right,
}) => {
  const numR = useReveal(2, 18);
  return (
    <Background>
      <AbsoluteFill style={{ padding: "84px 96px", display: "flex", flexDirection: "row", gap: 64 }}>
        {/* 左カラム */}
        <div style={{ flex: "0 0 720px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: COLORS.accent,
                color: "#fff",
                fontFamily,
                fontWeight: 900,
                fontSize: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 30px rgba(106,76,227,0.35)",
                opacity: numR,
                transform: `scale(${0.6 + numR * 0.4})`,
              }}
            >
              {stepNo}
            </div>
            <Kicker delay={6}>{kicker}</Kicker>
          </div>
          <div style={{ marginBottom: 30 }}>
            <SceneTitle delay={8} size={68}>
              {title}
            </SceneTitle>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>{left}</div>
        </div>

        {/* 右カラム */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {right}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
