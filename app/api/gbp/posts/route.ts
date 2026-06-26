import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGbpClient } from "@/lib/gbp/client";
import { CreatePostInputSchema } from "@/lib/gbp/types";

/** 生成した投稿文を GBP のローカル投稿として公開 */
export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = CreatePostInputSchema.parse(await request.json());
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
    const result = await client.createPost(parsed);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[gbp/posts] 投稿に失敗:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "投稿に失敗しました" },
      { status: 500 },
    );
  }
}
