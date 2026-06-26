import { Document, Page, Text, View } from "@react-pdf/renderer";
import { TalkScript } from "@/lib/talk-script-types";
import { ReportMeta } from "@/lib/report-export";
import { palette, styles } from "./theme";
import { BulletList, Footer } from "./parts";

/** トークスクリプトは画面同様に warm 系をアクセントにする */
const warmTitle = { borderLeftColor: palette.warm };

function SectionTitle({ children }: { children: string }) {
  return <Text style={[styles.h3, warmTitle]}>{children}</Text>;
}

/** クライアント報告用トークスクリプトのベクターPDFドキュメント */
export function TalkScriptPdf({
  meta,
  talkScript,
}: {
  meta: ReportMeta;
  talkScript: TalkScript;
}) {
  const t = talkScript;
  const subtitle = `${meta.category}${meta.area ? ` / ${meta.area}` : ""}　対象 ${meta.period}　クライアント報告用`;
  const footerLabel = `${meta.storeName}　報告トークスクリプト　${meta.period}`;

  return (
    <Document title={`${meta.storeName} 報告トークスクリプト ${meta.period}`}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { backgroundColor: palette.warm }]}>
          <View>
            <Text style={styles.headerTitle}>{meta.storeName} 報告トークスクリプト</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
          <Text style={styles.headerBadge}>口頭報告用</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.section}>
            <SectionTitle>挨拶・導入</SectionTitle>
            <Text style={styles.paragraph}>{t.opening}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>本日お伝えすること</SectionTitle>
            <BulletList items={t.agenda} />
          </View>

          <View style={styles.section}>
            <SectionTitle>報告の流れ</SectionTitle>
            {t.sections.map((s, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  backgroundColor: palette.surface2,
                  borderLeftWidth: 4,
                  borderLeftColor: palette.warm,
                  borderRadius: 8,
                  padding: 11,
                  marginBottom: 8,
                }}
              >
                <Text style={styles.h4}>{s.heading}</Text>
                <Text style={styles.paragraph}>{s.talk}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <SectionTitle>想定問答</SectionTitle>
            {t.expectedQuestions.map((qa, i) => (
              <View
                key={i}
                wrap={false}
                style={{
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: palette.accentStrong,
                    marginBottom: 3,
                  }}
                >
                  Q. {qa.question}
                </Text>
                <Text style={[styles.paragraph, { color: palette.textMuted }]}>
                  A. {qa.answer}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <SectionTitle>締めのトーク</SectionTitle>
            <Text style={styles.paragraph}>{t.closing}</Text>
          </View>

          <View style={styles.section}>
            <SectionTitle>話し方・進め方のコツ</SectionTitle>
            <BulletList items={t.talkingTips} />
          </View>
        </View>

        <Footer label={footerLabel} />
      </Page>
    </Document>
  );
}
