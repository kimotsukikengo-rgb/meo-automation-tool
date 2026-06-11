import { Text, View } from "@react-pdf/renderer";
import { palette, styles } from "./theme";

/** 箇条書き1項目（・ 付き） */
export function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>・</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

/** 箇条書きリスト */
export function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <Bullet key={i}>{t}</Bullet>
      ))}
    </View>
  );
}

/** ページ下部の固定フッター（ページ番号付き） */
export function Footer({ label }: { label: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{label}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

/** 前期比のパーセンテージ文字列（previous=0 は比較不可） */
export function deltaText(current: number, previous: number): string {
  if (previous === 0) return "—";
  const d = ((current - previous) / previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

/** 前期比の表示色（増=positive / 減=danger / 比較不可=faint） */
export function deltaColor(current: number, previous: number): string {
  if (previous === 0) return palette.textFaint;
  if (current > previous) return palette.positive;
  if (current < previous) return palette.danger;
  return palette.textFaint;
}

/** 数値整形（桁区切り） */
export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
