import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  MetricPair,
  PRIORITY_LABELS,
  Priority,
  ReportResponse,
} from "@/lib/report-types";
import { ReportMeta } from "@/lib/report-export";
import { palette, styles } from "./theme";
import { BulletList, deltaColor, deltaText, fmt, Footer } from "./parts";

/** 優先度ごとのアクセント色（カード左罫・バッジ） */
const PRIORITY_COLORS: Record<
  Priority,
  { bar: string; badgeBg: string; badgeText: string }
> = {
  high: { bar: palette.danger, badgeBg: palette.dangerSoft, badgeText: palette.danger },
  mid: { bar: palette.warm, badgeBg: palette.warmSoft, badgeText: palette.warm },
  low: { bar: palette.accent, badgeBg: palette.accentSoft, badgeText: palette.accentStrong },
};

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.h3}>{children}</Text>;
}

/** 主要指標テーブル */
function MetricsTable({ data }: { data: ReportResponse }) {
  const m = data.metrics;
  const rows: Array<[string, MetricPair, number]> = [
    ["表示回数（合計）", m.impressionsTotal, 0],
    ["検索経由の表示数", m.impressionsSearch, 0],
    ["マップ経由の表示数", m.impressionsMaps, 0],
    ["ウェブサイトクリック", m.websiteClicks, 0],
    ["ルート検索", m.directionRequests, 0],
    ["電話クリック", m.calls, 0],
    ["予約数", m.bookings, 0],
    ["投稿数", m.posts, 0],
    ["写真追加数", m.photos, 0],
    ["口コミ件数（当月）", m.newReviews, 0],
    ["返信済み口コミ数", m.repliedReviews, 0],
    ["平均評価", m.avgRating, 1],
  ];

  const col = { label: 1.7, num: 1, delta: 0.9 };

  return (
    <View style={styles.table}>
      <View style={[styles.tr, styles.thHead]}>
        <Text style={[styles.th, { flex: col.label }]}>指標</Text>
        <Text style={[styles.th, { flex: col.num, textAlign: "right" }]}>当月</Text>
        <Text style={[styles.th, { flex: col.num, textAlign: "right" }]}>比較期間</Text>
        <Text style={[styles.th, { flex: col.delta, textAlign: "right" }]}>前期比</Text>
      </View>
      {rows.map(([label, pair, decimals], i) => {
        const last = i === rows.length - 1;
        return (
          <View style={last ? styles.trLast : styles.tr} key={label}>
            <Text style={[styles.tdMuted, { flex: col.label }]}>{label}</Text>
            <Text style={[styles.td, { flex: col.num, textAlign: "right" }]}>
              {fmt(pair.current, decimals)}
            </Text>
            <Text style={[styles.tdMuted, { flex: col.num, textAlign: "right" }]}>
              {fmt(pair.previous, decimals)}
            </Text>
            <Text
              style={[
                styles.td,
                {
                  flex: col.delta,
                  textAlign: "right",
                  color: deltaColor(pair.current, pair.previous),
                  fontWeight: 700,
                },
              ]}
            >
              {deltaText(pair.current, pair.previous)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** 優先度付きタスクカード */
function TaskCard({
  task,
}: {
  task: ReportResponse["commentary"]["priorityTasks"][number];
}) {
  const c = PRIORITY_COLORS[task.priority];
  const details: Array<[string, string]> = [
    ["目的", task.purpose],
    ["実施内容", task.action],
    ["期待効果", task.expected],
    ["注意点", task.caution],
  ];
  return (
    <View style={[styles.taskCard, { borderLeftColor: c.bar }]} wrap={false}>
      <View style={styles.taskHead}>
        <Text style={[styles.taskBadge, { backgroundColor: c.badgeBg, color: c.badgeText }]}>
          優先度 {PRIORITY_LABELS[task.priority]}
        </Text>
        <Text style={styles.taskName}>{task.name}</Text>
      </View>
      {details.map(([k, v]) => (
        <View style={styles.taskDetailRow} key={k}>
          <Text style={styles.taskDetailKey}>{k}</Text>
          <Text style={styles.taskDetailVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

/** レポートのベクターPDFドキュメント */
export function ReportPdf({
  meta,
  data,
}: {
  meta: ReportMeta;
  data: ReportResponse;
}) {
  const c = data.commentary;
  const m = data.metrics;
  const subtitle = `${meta.category}${meta.area ? ` / ${meta.area}` : ""}　対象 ${m.period}（比較 ${m.comparePeriod}）`;
  const footerLabel = `${meta.storeName}　MEO月次レポート　${m.period}`;

  return (
    <Document title={`${meta.storeName} MEO月次レポート ${m.period}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{meta.storeName} MEO月次レポート</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
          <Text style={styles.headerBadge}>
            {data.source === "ai" ? "AIレポート" : "サンプル"}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.section}>
            <SectionTitle>1. 今月の総括</SectionTitle>
            <View style={styles.softBox}>
              <Text style={styles.paragraph}>{c.summary}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>2. 主要KPIの変化</SectionTitle>
            <BulletList items={c.kpiChanges} />
          </View>

          <View style={styles.section} wrap={false}>
            <SectionTitle>主要指標（当月／比較期間／前期比）</SectionTitle>
            <MetricsTable data={data} />
          </View>

          <View style={styles.section}>
            <SectionTitle>3. 良かった点</SectionTitle>
            <BulletList items={c.highlights} />
          </View>

          <View style={styles.section}>
            <SectionTitle>4. 課題点</SectionTitle>
            <BulletList items={c.issues} />
          </View>

          <View style={styles.section}>
            <SectionTitle>5. 検索キーワードの分析</SectionTitle>
            <Text style={styles.paragraph}>{c.keywordAnalysis}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>6. 口コミ状況の分析</SectionTitle>
            <Text style={styles.paragraph}>{c.reviewAnalysis}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>7. 投稿・写真運用の分析</SectionTitle>
            <Text style={styles.paragraph}>{c.contentAnalysis}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>8. 競合比較の所感</SectionTitle>
            <Text style={styles.paragraph}>{c.competitorAnalysis}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>9. 来月の改善アクション</SectionTitle>
            <BulletList items={c.nextActions} />
          </View>

          <View style={styles.section}>
            <SectionTitle>10. 優先度付きタスク一覧</SectionTitle>
            {c.priorityTasks.map((t, i) => (
              <TaskCard task={t} key={i} />
            ))}
          </View>

          <View style={styles.section} wrap={false}>
            <SectionTitle>11. クライアント向けコメント</SectionTitle>
            <View style={styles.softBox}>
              <Text style={styles.paragraph}>{c.clientComment}</Text>
            </View>
          </View>
        </View>

        <Footer label={footerLabel} />
      </Page>
    </Document>
  );
}
