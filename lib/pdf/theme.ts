import { Font, StyleSheet } from "@react-pdf/renderer";

/**
 * クライアント共有用ベクターPDFの共通テーマ。
 * 日本語フォント（Noto Sans JP）を埋め込み、画面の oklch パレットに
 * 近い sRGB の配色で統一する。
 */

let fontsReady = false;

/** 日本語フォントを一度だけ登録する */
export function ensureFonts(): void {
  if (fontsReady) return;
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: "/fonts/NotoSansJP-Regular.otf", fontWeight: 400 },
      { src: "/fonts/NotoSansJP-Bold.otf", fontWeight: 700 },
    ],
  });
  // 日本語は単語分割しない（途中改行・ハイフネーション抑止）
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

/** 画面の oklch トークンに対応する sRGB パレット */
export const palette = {
  accent: "#4F46E5",
  accentStrong: "#4338CA",
  accentSoft: "#EEF0FE",
  accentContrast: "#FFFFFF",
  warm: "#E08A2E",
  warmSoft: "#FBEFDF",
  positive: "#16A06A",
  danger: "#DC4A3D",
  dangerSoft: "#FBE9E7",
  text: "#232730",
  textMuted: "#5A5F6B",
  textFaint: "#868C99",
  border: "#E4E6EE",
  borderStrong: "#CBCFDC",
  surface: "#FFFFFF",
  surface2: "#F6F7FB",
} as const;

/** 全PDF共通のスタイル */
export const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9.5,
    lineHeight: 1.6,
    color: palette.text,
    paddingTop: 0,
    paddingBottom: 48,
    backgroundColor: palette.surface,
  },

  // ---- ヘッダーバンド ----
  header: {
    backgroundColor: palette.accent,
    color: palette.accentContrast,
    paddingVertical: 22,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: palette.accentContrast,
  },
  headerSub: {
    fontSize: 9,
    color: palette.accentContrast,
    opacity: 0.9,
    marginTop: 5,
  },
  headerBadge: {
    fontSize: 8.5,
    fontWeight: 700,
    color: palette.accentContrast,
    borderWidth: 1,
    borderColor: palette.accentContrast,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  // ---- 本文 ----
  body: {
    paddingHorizontal: 36,
    paddingTop: 18,
  },
  section: {
    marginBottom: 14,
  },
  h3: {
    fontSize: 11.5,
    fontWeight: 700,
    color: palette.text,
    marginBottom: 7,
    paddingLeft: 9,
    borderLeftWidth: 3,
    borderLeftColor: palette.accent,
  },
  h4: {
    fontSize: 9.5,
    fontWeight: 700,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 9.5,
    color: palette.text,
    lineHeight: 1.7,
  },
  softBox: {
    backgroundColor: palette.accentSoft,
    borderRadius: 8,
    padding: 12,
  },

  // ---- 箇条書き ----
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletMark: {
    width: 12,
    color: palette.accent,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: palette.textMuted,
    lineHeight: 1.6,
  },

  // ---- テーブル ----
  table: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  trLast: {
    flexDirection: "row",
  },
  thHead: {
    backgroundColor: palette.surface2,
  },
  th: {
    fontSize: 8.5,
    fontWeight: 700,
    color: palette.textMuted,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  td: {
    fontSize: 9,
    color: palette.text,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tdMuted: {
    fontSize: 9,
    color: palette.textMuted,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // ---- KPIカード ----
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  kpiCard: {
    width: "33.333%",
    padding: 4,
  },
  kpiInner: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: palette.surface2,
    padding: 9,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: palette.textMuted,
    fontWeight: 700,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 2,
  },
  kpiDelta: {
    fontSize: 8,
    fontWeight: 700,
    marginTop: 1,
  },

  // ---- タスクカード ----
  taskCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 4,
    borderRadius: 8,
    backgroundColor: palette.surface2,
    padding: 11,
    marginBottom: 8,
  },
  taskHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  taskBadge: {
    fontSize: 7.5,
    fontWeight: 700,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 9,
    marginRight: 8,
  },
  taskName: {
    fontSize: 10,
    fontWeight: 700,
    flex: 1,
  },
  taskDetailRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  taskDetailKey: {
    width: 56,
    fontSize: 8,
    fontWeight: 700,
    color: palette.textFaint,
  },
  taskDetailVal: {
    flex: 1,
    fontSize: 8.5,
    color: palette.textMuted,
    lineHeight: 1.55,
  },

  // ---- フッター ----
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: palette.textFaint,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 6,
  },
});
