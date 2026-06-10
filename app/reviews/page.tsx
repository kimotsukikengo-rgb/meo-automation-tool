import ReviewReplyGenerator from "@/components/ReviewReplyGenerator";

export const metadata = {
  title: "MEO自動化ツール｜口コミ返信生成",
  description:
    "Googleビジネスプロフィールの口コミ返信文をAIで生成し、ネガティブ口コミを自動判定するMEO運用支援ツール（試作）",
};

export default function ReviewsPage() {
  return <ReviewReplyGenerator />;
}
