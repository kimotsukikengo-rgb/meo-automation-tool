import { NextRequest, NextResponse } from "next/server";
import { isGbpConfigured } from "@/lib/gbp/config";
import { buildAuthUrl } from "@/lib/gbp/oauth";
import { saveMockStore } from "@/lib/gbp/client";

/**
 * 「Googleと連携」の入口。
 * OAuth 設定済みなら Google 同意画面へリダイレクト。
 * 未設定（mock）なら未登録のデモ店舗を 1 件追加して設定画面へ戻す。
 */
export async function GET(request: NextRequest) {
  const settings = (q: string) =>
    NextResponse.redirect(new URL(`/settings?${q}`, request.url));

  if (isGbpConfigured()) {
    try {
      return NextResponse.redirect(buildAuthUrl());
    } catch (err) {
      console.error("[gbp/auth] 認可URL生成に失敗:", err);
      return settings("error=oauth_config");
    }
  }

  try {
    const store = await saveMockStore();
    return settings(store ? "connected=mock" : "error=mock_full");
  } catch (err) {
    console.error("[gbp/auth] mock連携に失敗:", err);
    return settings("error=mock");
  }
}
