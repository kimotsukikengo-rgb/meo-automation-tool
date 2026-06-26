import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGbpClient } from "@/lib/gbp/client";
import { MetricsQuerySchema } from "@/lib/gbp/types";

/** 比較期間が未指定なら前月を返す */
function prevMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-1 が当月(0始まり) → m-2 が前月
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 連携店舗の月次 Performance 指標を取得（?storeId&period&comparePeriod） */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  let parsed;
  try {
    parsed = MetricsQuerySchema.parse({
      storeId: sp.get("storeId"),
      period: sp.get("period"),
      comparePeriod: sp.get("comparePeriod") ?? undefined,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力値が不正です", details: err.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 },
    );
  }

  const comparePeriod = parsed.comparePeriod || prevMonth(parsed.period);
  try {
    const client = await getGbpClient(parsed.storeId);
    const metrics = await client.fetchMetrics(parsed.period, comparePeriod);
    return NextResponse.json(metrics);
  } catch (err) {
    console.error("[gbp/metrics] 取得に失敗:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "指標の取得に失敗しました" },
      { status: 500 },
    );
  }
}
