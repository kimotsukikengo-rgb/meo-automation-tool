import {
  MetricPair,
  PRIORITY_LABELS,
  ReportResponse,
} from "@/lib/report-types";
import { TalkScript } from "@/lib/talk-script-types";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

/** レポートのメタ情報（フォーム入力） */
export interface ReportMeta {
  storeName: string;
  category: string;
  area?: string;
  period: string; // YYYY-MM
}

/** 前期比のパーセンテージ文字列 */
function deltaText(p: MetricPair): string {
  if (p.previous === 0) return "比較データなし";
  const d = ((p.current - p.previous) / p.previous) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}%`;
}

/** Blob をファイルとしてダウンロードさせる */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * react-pdf でベクターPDFを生成し、ファイルとしてダウンロードする内部共通処理。
 * スクリーンショット方式と異なり、文字選択・印刷で劣化しないクライアント共有品質。
 */
async function renderPdf(
  doc: ReactElement<DocumentProps>,
  fileBase: string,
): Promise<void> {
  const [{ pdf }, { ensureFonts }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/theme"),
  ]);
  ensureFonts();
  const blob = await pdf(doc).toBlob();
  downloadBlob(blob, `${fileBase}.pdf`);
}

/**
 * レポートデータからベクターPDF（クライアント共有品質）を生成してダウンロードする。
 */
export async function exportReportPdf(
  meta: ReportMeta,
  data: ReportResponse,
  fileBase: string,
): Promise<void> {
  const { ReportPdf } = await import("@/lib/pdf/ReportPdf");
  await renderPdf(
    (<ReportPdf meta={meta} data={data} />) as ReactElement<DocumentProps>,
    fileBase,
  );
}

/**
 * トークスクリプトからベクターPDF（クライアント共有品質）を生成してダウンロードする。
 */
export async function exportTalkScriptPdf(
  meta: ReportMeta,
  talkScript: TalkScript,
  fileBase: string,
): Promise<void> {
  const { TalkScriptPdf } = await import("@/lib/pdf/TalkScriptPdf");
  await renderPdf(
    (
      <TalkScriptPdf meta={meta} talkScript={talkScript} />
    ) as ReactElement<DocumentProps>,
    fileBase,
  );
}

/**
 * レポートデータから編集可能な Word(.docx) を構築してダウンロードする。
 */
export async function exportReportDocx(
  meta: ReportMeta,
  data: ReportResponse,
  fileBase: string,
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
  } = await import("docx");

  const m = data.metrics;
  const c = data.commentary;

  const fmt = (n: number, decimals: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const metricRows: Array<[string, MetricPair, number]> = [
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

  const headerCell = (text: string) =>
    new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text, bold: true })] }),
      ],
    });

  const cell = (
    text: string,
    align?: (typeof AlignmentType)[keyof typeof AlignmentType],
  ) =>
    new TableCell({
      children: [new Paragraph({ text, alignment: align })],
    });

  const metricsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell("指標"),
          headerCell("当月"),
          headerCell("比較期間"),
          headerCell("前期比"),
        ],
      }),
      ...metricRows.map(
        ([label, pair, decimals]) =>
          new TableRow({
            children: [
              cell(label),
              cell(fmt(pair.current, decimals), AlignmentType.RIGHT),
              cell(fmt(pair.previous, decimals), AlignmentType.RIGHT),
              cell(deltaText(pair), AlignmentType.RIGHT),
            ],
          }),
      ),
    ],
  });

  const tasksTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell("優先度"),
          headerCell("施策名"),
          headerCell("目的"),
          headerCell("実施内容"),
          headerCell("期待効果"),
          headerCell("注意点"),
        ],
      }),
      ...c.priorityTasks.map(
        (t) =>
          new TableRow({
            children: [
              cell(PRIORITY_LABELS[t.priority]),
              cell(t.name),
              cell(t.purpose),
              cell(t.action),
              cell(t.expected),
              cell(t.caution),
            ],
          }),
      ),
    ],
  });

  const bulletList = (items: string[]) =>
    items.map((t) => new Paragraph({ text: t, bullet: { level: 0 } }));

  const heading = (text: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, text });

  const subtitle = `${meta.category}${meta.area ? ` / ${meta.area}` : ""} ・ 対象 ${m.period}（比較 ${m.comparePeriod}）`;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({ text: `${meta.storeName} MEO月次レポート` }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: subtitle, color: "666666" })],
          }),

          heading("1. 今月の総括"),
          new Paragraph({ text: c.summary }),

          heading("2. 主要KPIの変化"),
          ...bulletList(c.kpiChanges),

          heading("主要指標（当月／比較期間／前期比）"),
          metricsTable,

          heading("3. 良かった点"),
          ...bulletList(c.highlights),

          heading("4. 課題点"),
          ...bulletList(c.issues),

          heading("5. 検索キーワードの分析"),
          new Paragraph({ text: c.keywordAnalysis }),

          heading("6. 口コミ状況の分析"),
          new Paragraph({ text: c.reviewAnalysis }),

          heading("7. 投稿・写真運用の分析"),
          new Paragraph({ text: c.contentAnalysis }),

          heading("8. 競合比較の所感"),
          new Paragraph({ text: c.competitorAnalysis }),

          heading("9. 来月の改善アクション"),
          ...bulletList(c.nextActions),

          heading("10. 優先度付きタスク一覧"),
          tasksTable,

          heading("11. クライアント向けコメント"),
          new Paragraph({ text: c.clientComment }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileBase}.docx`);
}

/**
 * トークスクリプト（クライアントへの口頭報告台本）から
 * 編集可能な Word(.docx) を構築してダウンロードする。
 */
export async function exportTalkScriptDocx(
  meta: ReportMeta,
  talkScript: TalkScript,
  fileBase: string,
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
  } = await import("docx");

  const t = talkScript;

  const heading = (text: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, text });

  const bulletList = (items: string[]) =>
    items.map((x) => new Paragraph({ text: x, bullet: { level: 0 } }));

  const subtitle = `${meta.category}${meta.area ? ` / ${meta.area}` : ""} ・ 対象 ${meta.period} ・ クライアント報告用トークスクリプト`;

  // 想定問答（Q&A）を段落で表現
  const qaParagraphs = t.expectedQuestions.flatMap((qa) => [
    new Paragraph({
      children: [new TextRun({ text: `Q. ${qa.question}`, bold: true })],
    }),
    new Paragraph({ text: `A. ${qa.answer}` }),
  ]);

  // 報告本編（見出し＋台本）
  const sectionParagraphs = t.sections.flatMap((s) => [
    new Paragraph({ heading: HeadingLevel.HEADING_2, text: s.heading }),
    new Paragraph({ text: s.talk }),
  ]);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({ text: `${meta.storeName} 報告トークスクリプト` }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: subtitle, color: "666666" })],
          }),

          heading("挨拶・導入"),
          new Paragraph({ text: t.opening }),

          heading("本日お伝えすること"),
          ...bulletList(t.agenda),

          heading("報告の流れ"),
          ...sectionParagraphs,

          heading("想定問答"),
          ...qaParagraphs,

          heading("締めのトーク"),
          new Paragraph({ text: t.closing }),

          heading("話し方・進め方のコツ"),
          ...bulletList(t.talkingTips),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileBase}.docx`);
}
