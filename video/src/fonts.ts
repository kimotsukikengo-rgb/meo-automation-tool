// 日本語表示のため Noto Sans JP を読み込む（アプリの Hiragino/Noto 系に近い見た目）
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  ignoreTooManyRequestsWarning: true,
});
