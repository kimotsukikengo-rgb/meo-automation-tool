import ReportGenerator from "@/components/ReportGenerator";

export const metadata = {
  title: "MEO自動化ツール｜レポート自動生成",
  description:
    "Googleビジネスプロフィールの月次データを集計し、AIが講評・改善提案つきレポートを自動生成するMEO運用支援ツール（試作）",
};

export default function ReportsPage() {
  return <ReportGenerator />;
}
