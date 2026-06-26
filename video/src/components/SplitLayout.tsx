import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "./Background";
import { Kicker, SceneTitle } from "./ui";

interface SplitLayoutProps {
  kicker: string;
  title: React.ReactNode;
  titleSize?: number;
  leftWidth?: number; // 左カラムの固定幅
  left: React.ReactNode; // 説明・箇条書き
  right: React.ReactNode; // ブラウザ枠・コードカード等
  children?: React.ReactNode; // フレーム全体に重ねる層（Telop など）
}

// 左に説明、右に画面。ModuleLayout と違い大きな番号は出さない（連携・設定系シーン用）。
export const SplitLayout: React.FC<SplitLayoutProps> = ({
  kicker,
  title,
  titleSize = 62,
  leftWidth = 720,
  left,
  right,
  children,
}) => {
  return (
    <Background>
      <AbsoluteFill
        style={{ padding: "84px 96px", display: "flex", flexDirection: "row", gap: 60 }}
      >
        {/* 左カラム */}
        <div style={{ flex: `0 0 ${leftWidth}px`, display: "flex", flexDirection: "column" }}>
          <Kicker delay={2}>{kicker}</Kicker>
          <div style={{ marginTop: 18, marginBottom: 30 }}>
            <SceneTitle delay={6} size={titleSize}>
              {title}
            </SceneTitle>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{left}</div>
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
      {/* フレーム全体に重ねる層（Telop は absolute / bottom 基準でフレーム下部に出る） */}
      {children}
    </Background>
  );
};
