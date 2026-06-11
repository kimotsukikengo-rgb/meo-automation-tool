import React from "react";
import { Composition } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { FPS } from "./theme";

import { TitleScene } from "./scenes/TitleScene";
import { OverviewScene } from "./scenes/OverviewScene";
import { PhilosophyScene } from "./scenes/PhilosophyScene";
import { PostScene } from "./scenes/PostScene";
import { ReviewScene } from "./scenes/ReviewScene";
import { ReportScene } from "./scenes/ReportScene";
import { RoutineScene } from "./scenes/RoutineScene";
import { AiEnableScene } from "./scenes/AiEnableScene";
import { CautionScene } from "./scenes/CautionScene";
import { OutroScene } from "./scenes/OutroScene";
// GBP連携セクション
import { GbpTitleScene } from "./scenes/GbpTitleScene";
import { GbpIntroScene } from "./scenes/GbpIntroScene";
import { GbpConnectScene } from "./scenes/GbpConnectScene";
import { GbpUsageScene } from "./scenes/GbpUsageScene";
import { GbpSetupScene } from "./scenes/GbpSetupScene";
// 5機能 操作マニュアル（GBP連携済み前提）
import { UsageTitleScene } from "./scenes/UsageTitleScene";
import { UsageOverviewScene } from "./scenes/UsageOverviewScene";
import { RankScene } from "./scenes/RankScene";
import { SettingsUsageScene } from "./scenes/SettingsUsageScene";

const TRANSITION = 16;

// kind = このシーンへ「入場する」トランジション種別。Series は scenes[i+1].kind で
// シーン i→i+1 間のトランジションを選ぶため、配列先頭シーンの kind は使われない。
type Scene = { Comp: React.FC; dur: number; kind: "fade" | "slide" };

// 運用マニュアル（全体）: 3モジュール解説の後に GBP連携セクションを挟む。
const MANUAL_SCENES: Scene[] = [
  { Comp: TitleScene, dur: 150, kind: "fade" },
  { Comp: OverviewScene, dur: 200, kind: "fade" },
  { Comp: PhilosophyScene, dur: 165, kind: "fade" },
  { Comp: PostScene, dur: 480, kind: "slide" },
  { Comp: ReviewScene, dur: 450, kind: "slide" },
  { Comp: ReportScene, dur: 480, kind: "slide" },
  { Comp: RoutineScene, dur: 240, kind: "fade" },
  // ── GBP連携セクション（実運用への接続） ──
  { Comp: GbpIntroScene, dur: 210, kind: "slide" },
  { Comp: GbpConnectScene, dur: 330, kind: "fade" },
  { Comp: GbpUsageScene, dur: 240, kind: "fade" },
  { Comp: GbpSetupScene, dur: 250, kind: "fade" },
  // ──────────────────────────────────────────
  { Comp: AiEnableScene, dur: 240, kind: "fade" },
  { Comp: CautionScene, dur: 240, kind: "fade" },
  { Comp: OutroScene, dur: 165, kind: "fade" },
];

// GBP連携 単独マニュアル: 連携の考え方〜実運用設定までを1本に。
const GBP_SCENES: Scene[] = [
  { Comp: GbpTitleScene, dur: 150, kind: "fade" },
  { Comp: GbpIntroScene, dur: 210, kind: "slide" },
  { Comp: GbpConnectScene, dur: 330, kind: "fade" },
  { Comp: GbpUsageScene, dur: 240, kind: "fade" },
  { Comp: GbpSetupScene, dur: 250, kind: "fade" },
  { Comp: OutroScene, dur: 165, kind: "fade" },
];

// 5機能 操作マニュアル（GBP連携済み前提）: ナビ5項目の使い方を順に解説。
const USAGE_SCENES: Scene[] = [
  { Comp: UsageTitleScene, dur: 140, kind: "fade" },
  { Comp: UsageOverviewScene, dur: 230, kind: "fade" },
  { Comp: PostScene, dur: 480, kind: "slide" },
  { Comp: ReviewScene, dur: 450, kind: "slide" },
  { Comp: ReportScene, dur: 480, kind: "slide" },
  { Comp: RankScene, dur: 270, kind: "slide" },
  { Comp: SettingsUsageScene, dur: 330, kind: "slide" },
  { Comp: OutroScene, dur: 165, kind: "fade" },
];

const totalFrames = (scenes: Scene[]) =>
  scenes.reduce((sum, s) => sum + s.dur, 0) - (scenes.length - 1) * TRANSITION;

// シーン配列から、各シーン間に slide/fade トランジションを挟んだ TransitionSeries を作る。
const Series: React.FC<{ scenes: Scene[] }> = ({ scenes }) => (
  <TransitionSeries>
    {scenes.flatMap((s, i) => {
      const { Comp } = s;
      const nodes = [
        <TransitionSeries.Sequence key={`seq-${i}`} durationInFrames={s.dur}>
          <Comp />
        </TransitionSeries.Sequence>,
      ];
      if (i < scenes.length - 1) {
        const next = scenes[i + 1];
        nodes.push(
          <TransitionSeries.Transition
            key={`tr-${i}`}
            presentation={
              next.kind === "slide" ? slide({ direction: "from-right" }) : fade()
            }
            timing={linearTiming({ durationInFrames: TRANSITION })}
          />,
        );
      }
      return nodes;
    })}
  </TransitionSeries>
);

const Manual: React.FC = () => <Series scenes={MANUAL_SCENES} />;
const GbpManual: React.FC = () => <Series scenes={GBP_SCENES} />;
const UsageGuide: React.FC = () => <Series scenes={USAGE_SCENES} />;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Manual"
        component={Manual}
        durationInFrames={totalFrames(MANUAL_SCENES)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="GbpManual"
        component={GbpManual}
        durationInFrames={totalFrames(GBP_SCENES)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="UsageGuide"
        component={UsageGuide}
        durationInFrames={totalFrames(USAGE_SCENES)}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
