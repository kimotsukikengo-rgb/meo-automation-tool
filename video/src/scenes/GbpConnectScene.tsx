import React from "react";
import { Sequence } from "remotion";
import { SplitLayout } from "../components/SplitLayout";
import { PhasedBrowser } from "../components/PhasedBrowser";
import { Bullet, Callout, Telop } from "../components/ui";
import { SCREENS } from "../screens";

const SWITCH = 150; // 「Googleと連携」を押して連携済みに切り替わるフレーム

export const GbpConnectScene: React.FC = () => {
  return (
    <SplitLayout
      kicker="設定・連携 画面"
      title="ボタンひとつで店舗を連携"
      titleSize={56}
      left={
        <>
          <Bullet index={0} variant="number">
            ヘッダー右上の<b>「設定・連携」</b>を開く
          </Bullet>
          <Bullet index={1} variant="number">
            <b>「Googleと連携」</b>を押す（未設定時は<b>サンプル店舗</b>をデモ連携）
          </Bullet>
          <Bullet index={2} variant="number">
            連携した店舗が<b>「連携中の店舗」</b>に並ぶ
          </Bullet>
          <Bullet index={3} variant="number">
            実連携ではGoogle同意画面 →<b>管理権限のある店舗を自動取込</b>
          </Bullet>
        </>
      }
      right={
        <>
          <PhasedBrowser
            url="localhost:3000/settings"
            width={900}
            height={660}
            switchFrame={SWITCH}
            empty={{ ...SCREENS.settingsEmpty, panFrom: 0, panTo: 0.25 }}
            result={{ ...SCREENS.settingsConnected, panFrom: 0, panTo: 0 }}
          />
          <Callout delay={26} tone="accent" style={{ top: 64, left: -6 }}>
            ① 連携状態を確認（実API/mock・保存先）
          </Callout>
          <Callout delay={SWITCH - 16} tone="positive" style={{ top: 150, right: -10 }}>
            ② ここを押す
          </Callout>
          <Callout delay={SWITCH + 70} tone="warm" style={{ bottom: 96, left: 10 }}>
            ③ 連携店舗が追加された
          </Callout>
          <Callout delay={SWITCH + 110} tone="accent" style={{ bottom: 30, right: -10 }}>
            「連携解除」で付け替え・削除も
          </Callout>
        </>
      }
    >
      <Sequence durationInFrames={SWITCH}>
        <Telop>未設定でも「Googleと連携」でサンプル店舗をデモ連携し、流れをそのまま確認できます</Telop>
      </Sequence>
      <Sequence from={SWITCH}>
        <Telop>実連携では同意のあと、管理権限のある店舗がまとめて一覧に取り込まれます</Telop>
      </Sequence>
    </SplitLayout>
  );
};
