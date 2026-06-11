import React from "react";
import { ModuleLayout } from "../components/ModuleLayout";
import { BrowserFrame } from "../components/BrowserFrame";
import { Bullet, Callout, Telop } from "../components/ui";
import { SCREENS } from "../screens";

// Googleビジネスプロフィール連携済みの状態の設定画面（サンプル店舗2件が連携中）。
export const SettingsUsageScene: React.FC = () => {
  return (
    <ModuleLayout
      stepNo={5}
      kicker="設定・連携"
      title="店舗の連携と管理"
      left={
        <>
          <Bullet index={0} variant="number">
            ヘッダー右の<b>「設定・連携」</b>を開く
          </Bullet>
          <Bullet index={1} variant="number">
            <b>「Googleと連携」</b>でアカウントを接続（このツールは<b>連携済み</b>）
          </Bullet>
          <Bullet index={2} variant="number">
            <b>連携中の店舗</b>が一覧表示（この例は2件）
          </Bullet>
          <Bullet index={3} variant="number">
            投稿・口コミ・レポートは<b>ここで連携した店舗</b>のデータを使用
          </Bullet>
          <Bullet index={4} variant="number">
            店舗を外すときは各行の<b>「連携解除」</b>
          </Bullet>
        </>
      }
      right={
        <>
          <BrowserFrame
            url="localhost:3000/settings"
            width={900}
            height={620}
            src={SCREENS.settingsConnected.src}
            imgW={SCREENS.settingsConnected.imgW}
            imgH={SCREENS.settingsConnected.imgH}
            panFrom={0}
            panTo={0}
          />
          <Callout delay={26} tone="positive" style={{ top: 150, right: -8 }}>
            ✓ 連携済み（Googleと連携）
          </Callout>
          <Callout delay={70} tone="accent" style={{ top: "56%", left: "4%" }}>
            連携中の店舗が一覧に
          </Callout>

          <Telop>各機能は、ここで連携した店舗を対象に動きます</Telop>
        </>
      }
    />
  );
};
