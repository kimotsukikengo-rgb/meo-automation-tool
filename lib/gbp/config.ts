/**
 * GBP 連携の設定（環境変数の読取・検証）と定数。
 * シークレットは環境変数のみで管理する（画面・コードに置かない）。
 */

/** OAuth スコープ（GBP API 群はこの 1 スコープで足りる） */
export const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";

/** Google OAuth 2.0 エンドポイント */
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** GBP API ベースURL（用途別に分かれている） */
export const GBP_API = {
  accountManagement: "https://mybusinessaccountmanagement.googleapis.com/v1",
  businessInformation:
    "https://mybusinessbusinessinformation.googleapis.com/v1",
  performance: "https://businessprofileperformance.googleapis.com/v1",
  // 口コミ・ローカル投稿は v4 に残存
  v4: "https://mybusiness.googleapis.com/v4",
} as const;

/** OAuth クライアント設定（実連携に必須） */
export interface GbpOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** OAuth 設定が揃っているか */
export function isGbpConfigured(): boolean {
  return Boolean(
    process.env.GBP_OAUTH_CLIENT_ID &&
      process.env.GBP_OAUTH_CLIENT_SECRET &&
      process.env.GBP_OAUTH_REDIRECT_URI,
  );
}

/** 実 GBP API を呼ぶか（GBP_LIVE=on かつ OAuth 設定済み）。それ以外は mock */
export function isGbpLive(): boolean {
  return process.env.GBP_LIVE === "on" && isGbpConfigured();
}

/** Postgres（永続トークン保存）が利用可能か */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** OAuth 設定を取得（未設定なら例外。OAuth 操作の入口で fail-fast） */
export function getOAuthConfig(): GbpOAuthConfig {
  const clientId = process.env.GBP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GBP_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GBP_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "GBP OAuth が未設定です。GBP_OAUTH_CLIENT_ID / SECRET / REDIRECT_URI を環境変数に設定してください。",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

/** state 署名シークレット（未設定なら例外） */
export function getStateSecret(): string {
  const secret = process.env.GBP_STATE_SECRET;
  if (!secret) {
    throw new Error("GBP_STATE_SECRET が未設定です。");
  }
  return secret;
}
