import SettingsManager from "@/components/SettingsManager";
import {
  isDatabaseConfigured,
  isGbpConfigured,
  isGbpLive,
} from "@/lib/gbp/config";

// 環境変数を実行時に反映するため動的レンダリング
export const dynamic = "force-dynamic";

export const metadata = {
  title: "MEO自動化ツール｜設定・連携",
  description:
    "Googleビジネスプロフィールを連携し、投稿公開・口コミ取得/返信・レポート数値の自動取得を行うMEO運用支援ツール（試作）の設定画面",
};

export default function SettingsPage() {
  return (
    <SettingsManager
      status={{
        live: isGbpLive(),
        configured: isGbpConfigured(),
        dbConfigured: isDatabaseConfigured(),
      }}
    />
  );
}
