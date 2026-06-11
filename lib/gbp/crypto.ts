import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * リフレッシュトークンを保存前に AES-256-GCM で暗号化する。
 * 鍵は環境変数 GBP_TOKEN_ENCRYPTION_KEY（base64 の 32 バイト）から取得。
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM 推奨の 96bit
const KEY_BYTES = 32;

function getKey(): Buffer {
  const raw = process.env.GBP_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("GBP_TOKEN_ENCRYPTION_KEY が未設定です。");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      "GBP_TOKEN_ENCRYPTION_KEY は base64 でエンコードした 32 バイトの鍵にしてください。",
    );
  }
  return key;
}

/** 平文を暗号化し、"iv:tag:ciphertext"（各 base64）を返す */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64")).join(":");
}

/** encryptToken の逆。形式不正・改ざん時は例外を投げる */
export function decryptToken(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("暗号化トークンの形式が不正です。");
  }
  const [iv, tag, ciphertext] = parts.map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
