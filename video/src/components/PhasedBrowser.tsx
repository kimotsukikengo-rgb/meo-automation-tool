import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { BrowserFrame } from "./BrowserFrame";

interface Shot {
  src: string;
  imgW: number;
  imgH: number;
  panFrom: number;
  panTo: number;
}

interface PhasedBrowserProps {
  url: string;
  width: number;
  height: number;
  empty: Shot; // 入力フェーズ
  result: Shot; // 生成結果フェーズ
  switchFrame: number; // 結果に切り替わるフレーム
}

// 入力画面 → 生成結果画面をクロスフェードで切り替える。
// 「生成」ボタンを押した瞬間に結果が出る、という流れを表現する。
export const PhasedBrowser: React.FC<PhasedBrowserProps> = ({
  url,
  width,
  height,
  empty,
  result,
  switchFrame,
}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(
    frame,
    [switchFrame - 8, switchFrame + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

  return (
    <div style={{ position: "relative", width, height }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
        <BrowserFrame
          url={url}
          width={width}
          height={height}
          src={empty.src}
          imgW={empty.imgW}
          imgH={empty.imgH}
          panFrom={empty.panFrom}
          panTo={empty.panTo}
          panStart={10}
          panDuration={switchFrame - 10}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: fade }}>
        <BrowserFrame
          url={url}
          width={width}
          height={height}
          src={result.src}
          imgW={result.imgW}
          imgH={result.imgH}
          panFrom={result.panFrom}
          panTo={result.panTo}
          panStart={switchFrame + 8}
          panDuration={150}
        />
      </div>
    </div>
  );
};
