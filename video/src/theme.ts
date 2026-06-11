// MEO Studio アプリの globals.css デザイントークンに合わせた配色（oklch → sRGB 近似）

export const COLORS = {
  bg: "#FAFAFC",
  surface: "#FFFFFF",
  surface2: "#F5F5F9",
  border: "#E5E4EC",
  borderStrong: "#D2D0DC",

  text: "#2B2840",
  textMuted: "#6B6880",
  textFaint: "#8E8BA0",

  accent: "#6A4CE3",
  accentStrong: "#5733C9",
  accentSoft: "#EEEAFB",

  warm: "#E8954A",
  positive: "#2FA86E",
  danger: "#DB4A3B",

  white: "#FFFFFF",
} as const;

// 半透明の白サーフェス（背景グラデーションの上に乗せるカード用）
export const GLASS = "rgba(255,255,255,0.72)";

// アプリと同じ雰囲気の背景グラデーション
export const APP_BG = [
  "radial-gradient(1200px 600px at 85% -10%, #EFEAFB, transparent 60%)",
  "radial-gradient(900px 500px at -10% 10%, #FBEEDF, transparent 55%)",
  COLORS.bg,
].join(", ");

export const FPS = 30;
