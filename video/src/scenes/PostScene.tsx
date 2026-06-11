import React from "react";
import { Sequence } from "remotion";
import { ModuleLayout } from "../components/ModuleLayout";
import { PhasedBrowser } from "../components/PhasedBrowser";
import { Bullet, Callout, Telop } from "../components/ui";
import { SCREENS } from "../screens";

const SWITCH = 165; // 入力→結果に切り替わるフレーム

export const PostScene: React.FC = () => {
  return (
    <ModuleLayout
      stepNo={1}
      kicker="投稿作成・投稿管理"
      title="投稿文生成"
      left={
        <>
          <Bullet index={0} variant="number">
            <b>店舗名・業種・テーマ</b>の3項目を入力
          </Bullet>
          <Bullet index={1} variant="number">
            「✨投稿文を生成」で<b>2〜5案を一括生成</b>
          </Bullet>
          <Bullet index={2} variant="number">
            案ごとに切り口が異なり、<b>ハッシュタグ・CTA</b>も付属
          </Bullet>
          <Bullet index={3} variant="number">
            「本文＋タグをコピー」→ <b>GBPに貼り付け</b>
          </Bullet>
        </>
      }
      right={
        <>
          <PhasedBrowser
            url="localhost:3000/"
            width={860}
            height={720}
            switchFrame={SWITCH}
            empty={{ ...SCREENS.postEmpty, panFrom: 0, panTo: 0.5 }}
            result={{ ...SCREENS.postResult, panFrom: 0, panTo: 1 }}
          />
          <Callout delay={28} tone="accent" style={{ top: 20, right: -8 }}>
            ① まずは「サンプルを入力」でお試し
          </Callout>
          <Callout delay={SWITCH - 18} tone="positive" style={{ top: "44%", left: "40%" }}>
            ② 生成！
          </Callout>
          <Callout delay={SWITCH + 80} tone="warm" style={{ top: "62%", right: -8 }}>
            ③ 気に入った案をコピー
          </Callout>

          <Sequence durationInFrames={SWITCH}>
            <Telop>必須3項目を入れて「生成する」を押すだけ</Telop>
          </Sequence>
          <Sequence from={SWITCH}>
            <Telop>複数案から選び、その場で編集してコピーできます</Telop>
          </Sequence>
        </>
      }
    />
  );
};
