import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGbpClient } from "@/lib/gbp/client";
import { ReplyReviewInputSchema } from "@/lib/gbp/types";

/** 連携店舗の口コミを取得（?storeId=...） */
export async function GET(request: NextRequest) {
  const storeId = new URL(request.url).searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId が必要です" }, { status: 400 });
  }
  try {
    const client = await getGbpClient(storeId);
    const reviews = await client.listReviews();
    return NextResponse.json({ reviews, storeLabel: client.storeLabel });
  } catch (err) {
    console.error("[gbp/reviews] 取得に失敗:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "口コミの取得に失敗しました" },
      { status: 500 },
    );
  }
}

/** 口コミへ公開返信を投稿 */
export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = ReplyReviewInputSchema.parse(await request.json());
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
  try {
    const client = await getGbpClient(parsed.storeId);
    await client.replyToReview(parsed.reviewId, parsed.comment);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gbp/reviews] 返信投稿に失敗:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "返信の投稿に失敗しました" },
      { status: 500 },
    );
  }
}
