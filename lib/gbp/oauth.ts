import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  GBP_SCOPE,
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  getOAuthConfig,
  getStateSecret,
} from "./config";

/**
 * Google OAuth 2.0（認可コードフロー）。
 * state は HMAC 署名して CSRF を防ぐ。リフレッシュトークン取得のため offline + consent。
 */

const STATE_TTL_MS = 10 * 60 * 1000; // 10分

interface StatePayload {
  n: string; // nonce
  t: number; // 発行時刻 epoch ms
}

/** state を HMAC 署名して "payloadB64.sig" を返す */
export function signState(): string {
  const payload: StatePayload = {
    n: randomBytes(12).toString("hex"),
    t: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getStateSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/** state の署名と鮮度（10分）を検証 */
export function verifyState(state: string): boolean {
  const [body, sig] = state.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", getStateSecret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as StatePayload;
    return Date.now() - payload.t < STATE_TTL_MS;
  } catch {
    return false;
  }
}

/** Google 同意画面の URL を組み立てる */
export function buildAuthUrl(): string {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GBP_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: signState(),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

interface GoogleTokenJson {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/** 認可コードをトークンに交換 */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `トークン交換に失敗しました (${res.status}): ${await res.text()}`,
    );
  }
  const json = (await res.json()) as GoogleTokenJson;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
  };
}

/** リフレッシュトークンからアクセストークンを再取得 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `アクセストークン更新に失敗しました (${res.status}): ${await res.text()}`,
    );
  }
  const json = (await res.json()) as GoogleTokenJson;
  return json.access_token;
}
