# MEO自動化ツール（試作）

MEO（Googleビジネスプロフィール最適化）運用を自動化するためのツール。
モジュールを1つずつ追加していく構成で、第1弾として **投稿文生成** を実装しています。

## クイックスタート

```bash
npm install
npm run dev
# → http://localhost:3000
```

APIキー未設定でも **サンプル生成モード** で全機能を試せます。
Claudeによる本生成を有効にする手順は下記マニュアルの第5章を参照。

## 実装済みモジュール

| モジュール | 状態 | 説明 |
|---|---|---|
| 投稿文生成 | ✅ 試作完成 | 店舗情報＋テーマから投稿本文を複数案生成 |
| 口コミ返信生成 | ✅ 試作完成 | 口コミ＋星評価から返信文を複数案生成。ネガ判定＋エスカレーション |
| レポート自動生成 | ✅ 試作完成 | 月次データを集計し、KPI・推移チャート・AI講評つきレポートを生成 |
| 順位管理 | ⏳ 予定 | — |

## ドキュメント

- [投稿文生成モジュール 活用マニュアル](docs/投稿文生成_マニュアル.md)
- [口コミ返信生成モジュール 活用マニュアル](docs/口コミ返信生成_マニュアル.md)
- [レポート自動生成モジュール 活用マニュアル](docs/レポート自動生成_マニュアル.md)

## 技術構成

- Next.js（App Router）/ TypeScript / React 19
- AI SDK + Vercel AI Gateway（`anthropic/claude-*`）
- APIキー未設定時はモック生成にフォールバック

## ディレクトリ

```
app/
  page.tsx                トップ（投稿文生成）
  reviews/page.tsx        口コミ返信生成
  reports/page.tsx        レポート自動生成
  layout.tsx              ルートレイアウト
  globals.css             デザイントークン＋ベーススタイル
  api/generate/route.ts   投稿文生成API
  api/reply/route.ts      口コミ返信API
  api/report/route.ts     レポートAPI
components/
  AppBar.tsx              共通ヘッダー（モジュール間ナビ）
  ui.css                  共通スタイル
  PostGenerator.tsx       投稿文生成UI
  ReviewReplyGenerator.tsx 口コミ返信UI ＋ review-reply.css
  ReportGenerator.tsx     レポートUI ＋ report.css
lib/
  types.ts / prompt.ts / mock-generator.ts          投稿文生成
  review-types.ts / review-prompt.ts / review-mock.ts 口コミ返信
  report-types.ts / report-data.ts / report-prompt.ts / report-mock.ts レポート
docs/
  投稿文生成_マニュアル.md / 口コミ返信生成_マニュアル.md / レポート自動生成_マニュアル.md
```
