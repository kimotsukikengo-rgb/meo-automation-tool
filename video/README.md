# MEO Studio マニュアル動画（Remotion）

`http://localhost:3000`（MEO Studio）の運用マニュアル動画。実画面のスクリーンショットを
埋め込み、テロップ・コールアウト・トランジション付きで解説します。

- 解像度: 1920×1080 / 30fps
- 出力: `out/` 配下に MP4

## 2本のコンポジション

| ID | 内容 | 出力 | 目安尺 |
|----|------|------|--------|
| `Manual` | 運用マニュアル全体（3モジュール＋**GBP連携セクション**） | `out/MEO-Studio-運用マニュアル.mp4` | 約2分 |
| `GbpManual` | **GBP連携 単独マニュアル**（連携の考え方〜実運用設定） | `out/GBP連携マニュアル.mp4` | 約40秒 |

GBP連携の4シーン（Intro/Connect/Usage/Setup）は両コンポジションで共有しています。

## 構成（シーン順）

### `Manual`（運用マニュアル全体）

1. タイトル
2. 全体像（3モジュール）
3. 共通の考え方（半自動設計）
4. 投稿文生成
5. 口コミ返信生成（ネガ判定・エスカレーション）
6. レポート自動生成
7. おすすめの運用サイクル
8. **GBP連携①** APIキーはどこに貼る？→ OAuthの考え方
9. **GBP連携②** 設定画面でボタン連携（連携前→連携後）
10. **GBP連携③** 連携店舗が3モジュールに直結
11. **GBP連携④** 実運用の設定（環境変数・承認待ち）
12. 本物のAI生成（Claude）を有効にする
13. 運用上の注意（4つの約束）
14. クロージング

### `GbpManual`（GBP連携 単独）

1. タイトル（GBP × MEO Studio）
2. APIキーはどこに貼る？→ 画面には貼らない（OAuth 2.0）
3. 設定画面でボタン連携（連携前→連携後）
4. 連携店舗が3モジュールに直結（GBP投稿先 / GBP口コミ取得 / GBP数値取得）
5. 実運用の設定（環境変数・Google承認 3〜10営業日）
6. クロージング

## 使い方

```bash
cd video
npm install
npm run dev          # Remotion Studio（プレビュー・編集）
npm run render       # Manual    → out/MEO-Studio-運用マニュアル.mp4
npm run render:gbp   # GbpManual → out/GBP連携マニュアル.mp4
npm run render:all   # 両方まとめて書き出し
```

## 画面の差し替え

埋め込み画像は `public/screens/*.png`（localhost:3000 の実スクリーンショット）。
UIを更新したら同名で撮り直すだけで動画に反映されます。寸法を変えた場合は
`src/screens.ts` の `imgW/imgH` を実寸に合わせてください。

GBP連携の設定画面は次の2枚を使用しています（連携前／連携後）。撮り直す場合は
ビューポート幅を揃えて全画面キャプチャしてください。

- `settings-empty.png` … `/settings`（連携店舗0件）
- `settings-connected.png` … `/settings`（連携店舗2件）

> 連携店舗はモック時 `/api/gbp/stores`（DELETE で解除）と `/api/gbp/auth`（mock連携で追加）で
> 状態を作れます。GBP連携の挙動は `GBP_LIVE=off`（既定）で全フロー確認できます。

## 主なファイル

- `src/Root.tsx` … 2コンポジション（`Manual` / `GbpManual`）とシーン構成・尺・トランジション
- `src/scenes/*` … 各シーン（`Gbp*Scene` がGBP連携セクション）
- `src/components/*` … 背景・ブラウザ枠・テロップ等の共通部品
  - `SplitLayout.tsx` … 左=説明／右=画面 の汎用2カラム（連携・設定系シーン用）
- `src/theme.ts` … アプリの globals.css に合わせた配色トークン
