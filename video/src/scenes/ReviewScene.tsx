import React from "react";
import { Sequence } from "remotion";
import { ModuleLayout } from "../components/ModuleLayout";
import { PhasedBrowser } from "../components/PhasedBrowser";
import { Bullet, Callout, Telop } from "../components/ui";
import { SCREENS } from "../screens";

const SWITCH = 150;

export const ReviewScene: React.FC = () => {
  return (
    <ModuleLayout
      stepNo={2}
      kicker="口コミ管理"
      title="口コミ返信生成"
      left={
        <>
          <Bullet index={0} variant="number">
            <b>口コミ本文＋星評価</b>を入力して生成
          </Bullet>
          <Bullet index={1} variant="number">
            感情を<b>自動判定</b>（😊ポジ／😐中立／⚠️ネガ）
          </Bullet>
          <Bullet index={2} variant="warn">
            ネガは<b>「🚨担当者の確認を推奨」</b>を自動表示
          </Bullet>
          <Bullet index={3} variant="number">
            案を選び編集→コピー。<b>即返信せず事実確認</b>
          </Bullet>
        </>
      }
      right={
        <>
          <PhasedBrowser
            url="localhost:3000/reviews"
            width={860}
            height={720}
            switchFrame={SWITCH}
            empty={{ ...SCREENS.reviewEmpty, panFrom: 0, panTo: 0.45 }}
            result={{ ...SCREENS.reviewResult, panFrom: 0, panTo: 1 }}
          />
          <Callout delay={28} tone="accent" style={{ top: 22, right: -6 }}>
            ① 口コミと★評価を入力
          </Callout>
          <Callout delay={SWITCH + 16} tone="danger" style={{ top: 88, left: "36%" }}>
            ⚠️ ネガ判定 → エスカレーション
          </Callout>
          <Callout delay={SWITCH + 95} tone="warm" style={{ top: "60%", right: -6 }}>
            ② 確認してから返信
          </Callout>

          <Sequence durationInFrames={SWITCH}>
            <Telop>高評価は感謝中心、低評価は謝意とオフライン誘導に最適化</Telop>
          </Sequence>
          <Sequence from={SWITCH}>
            <Telop>ネガティブは警告が出たら、必ず担当者と事実確認を</Telop>
          </Sequence>
        </>
      }
    />
  );
};
