// 実アプリ（localhost:3000）の全画面スクリーンショットのメタ情報。
// imgW/imgH は実ピクセル寸法（縦パンの計算に使用）。
export const SCREENS = {
  postEmpty: { src: "screens/post-empty.png", imgW: 1440, imgH: 1355 },
  postResult: { src: "screens/post-result.png", imgW: 1440, imgH: 1598 },
  reviewEmpty: { src: "screens/review-empty.png", imgW: 1440, imgH: 1300 },
  reviewResult: { src: "screens/review-result.png", imgW: 1440, imgH: 1466 },
  reportEmpty: { src: "screens/report-empty.png", imgW: 1440, imgH: 1099 },
  reportResult: { src: "screens/report-result.png", imgW: 1440, imgH: 2150 },
  // 設定・連携画面（連携前＝連携店舗なし／連携後＝取り込み済み。mock時はサンプル店舗）
  settingsEmpty: { src: "screens/settings-empty.png", imgW: 1492, imgH: 1186 },
  settingsConnected: { src: "screens/settings-connected.png", imgW: 1492, imgH: 945 },
} as const;
