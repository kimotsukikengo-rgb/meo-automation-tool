import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, verifyState } from "@/lib/gbp/oauth";
import { saveDiscoveredStores } from "@/lib/gbp/client";

/**
 * Google OAuth のリダイレクト先。
 * state 検証 → コード交換 → 連携アカウントの全 Location を保存 → 設定画面へ。
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const settings = (q: string) =>
    NextResponse.redirect(new URL(`/settings?${q}`, request.url));

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return settings(`error=${encodeURIComponent(oauthError)}`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !verifyState(state)) {
    return settings("error=invalid_state");
  }

  try {
    const token = await exchangeCode(code);
    if (!token.refreshToken) {
      // refresh_token が返らない場合は再同意が必要
      return settings("error=no_refresh_token");
    }
    const count = await saveDiscoveredStores(
      token.accessToken,
      token.refreshToken,
    );
    return settings(`connected=${count}`);
  } catch (err) {
    console.error("[gbp/callback] 連携に失敗:", err);
    return settings("error=connect_failed");
  }
}
