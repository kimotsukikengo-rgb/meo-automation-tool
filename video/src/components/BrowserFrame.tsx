import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS } from "../theme";

interface BrowserFrameProps {
  src: string; // public/ からの相対パス
  imgW: number; // 画像の実ピクセル幅
  imgH: number; // 画像の実ピクセル高さ
  url: string; // アドレスバーに表示する URL
  width: number; // 表示枠の幅
  height: number; // 表示枠の高さ（縦スクロールで覗く窓）
  panFrom?: number; // 0=最上部, 1=最下部
  panTo?: number;
  panStart?: number; // パン開始フレーム
  panDuration?: number; // パンにかけるフレーム数
}

const CHROME_H = 56;

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  src,
  imgW,
  imgH,
  url,
  width,
  height,
  panFrom = 0,
  panTo = 0,
  panStart = 0,
  panDuration = 90,
}) => {
  const frame = useCurrentFrame();
  const viewportH = height - CHROME_H;
  const displayH = width * (imgH / imgW);
  const maxScroll = Math.max(0, displayH - viewportH);

  const panProgress = interpolate(
    frame,
    [panStart, panStart + panDuration],
    [panFrom, panTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );
  const translateY = -maxScroll * panProgress;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        background: COLORS.surface,
        border: `1px solid ${COLORS.borderStrong}`,
        boxShadow:
          "0 30px 80px rgba(40,30,80,0.20), 0 4px 16px rgba(40,30,80,0.10)",
      }}
    >
      {/* ブラウザ クローム */}
      <div
        style={{
          height: CHROME_H,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px",
          background: COLORS.surface2,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#ED6A5E", "#F4BF4F", "#61C554"].map((c) => (
            <div
              key={c}
              style={{ width: 13, height: 13, borderRadius: 999, background: c }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 32,
            borderRadius: 999,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            color: COLORS.textMuted,
            fontSize: 16,
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ color: COLORS.positive, marginRight: 8 }}>🔒</span>
          {url}
        </div>
      </div>

      {/* スクロール窓 */}
      <div style={{ height: viewportH, overflow: "hidden", position: "relative" }}>
        <Img
          src={staticFile(src)}
          style={{
            width,
            display: "block",
            transform: `translateY(${translateY}px)`,
          }}
        />
      </div>
    </div>
  );
};
