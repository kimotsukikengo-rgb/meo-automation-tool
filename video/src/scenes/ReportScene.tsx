import React from "react";
import { Sequence } from "remotion";
import { ModuleLayout } from "../components/ModuleLayout";
import { PhasedBrowser } from "../components/PhasedBrowser";
import { Bullet, Callout, Telop } from "../components/ui";
import { SCREENS } from "../screens";

const SWITCH = 120;

export const ReportScene: React.FC = () => {
  return (
    <ModuleLayout
      stepNo={3}
      kicker="レポート作成"
      title="レポート自動生成"
      left={
        <>
          <Bullet index={0} variant="number">
            <b>店舗・業種・対象月</b>を指定して生成
          </Bullet>
          <Bullet index={1} variant="number">
            KPIを<b>前月比つきカード</b>で表示（▲緑／▼赤）
          </Bullet>
          <Bullet index={2} variant="number">
            直近6か月の<b>推移を棒グラフ</b>で可視化
          </Bullet>
          <Bullet index={3} variant="number">
            <b>AI講評</b>（総括・良かった点・課題・改善提案）
          </Bullet>
          <Bullet index={4} variant="number">
            <b>全文コピー / PDF / Word</b> で共有資料に
          </Bullet>
        </>
      }
      right={
        <>
          <PhasedBrowser
            url="localhost:3000/reports"
            width={860}
            height={720}
            switchFrame={SWITCH}
            empty={{ ...SCREENS.reportEmpty, panFrom: 0, panTo: 0 }}
            result={{ ...SCREENS.reportResult, panFrom: 0, panTo: 1 }}
          />
          <Callout delay={26} tone="accent" style={{ top: 70, left: "30%" }}>
            ① 店舗・対象月を入力
          </Callout>
          <Callout delay={SWITCH + 40} tone="positive" style={{ top: 80, right: 0 }}>
            ② KPI＋前月比
          </Callout>
          <Callout delay={SWITCH + 150} tone="warm" style={{ top: "60%", left: "30%" }}>
            ③ AI講評つき
          </Callout>

          <Sequence durationInFrames={SWITCH}>
            <Telop>店舗名と対象月（YYYY-MM）を指定するだけ</Telop>
          </Sequence>
          <Sequence from={SWITCH}>
            <Telop>数値はサンプル。実データはGBP連携で差し替え可能</Telop>
          </Sequence>
        </>
      }
    />
  );
};
