import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { GBP_SCOPE } from "./config";
import { decryptToken, encryptToken } from "./crypto";
import type { ConnectedStore, SaveStoreInput, TokenStore } from "./token-store";

/**
 * Neon Postgres によるトークンストア。
 * リフレッシュトークンは AES-256-GCM で暗号化して保存する（平文では持たない）。
 */

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS gbp_connections (
    id TEXT PRIMARY KEY,
    store_label TEXT NOT NULL,
    google_account_id TEXT,
    location_name TEXT NOT NULL,
    location_title TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    scopes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

type Row = Record<string, unknown>;

function toStore(row: Row): ConnectedStore {
  return {
    id: String(row.id),
    storeLabel: String(row.store_label),
    locationName: String(row.location_name),
    locationTitle: String(row.location_title),
    googleAccountId: row.google_account_id
      ? String(row.google_account_id)
      : undefined,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export class PostgresTokenStore implements TokenStore {
  private sql = neon(process.env.DATABASE_URL as string);
  private ready: Promise<unknown> | null = null;

  /** 初回アクセス時にテーブルを用意（冪等） */
  private ensureSchema(): Promise<unknown> {
    if (!this.ready) {
      this.ready = this.sql.query(CREATE_TABLE_SQL);
    }
    return this.ready;
  }

  async listStores(): Promise<ConnectedStore[]> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      `SELECT id, store_label, google_account_id, location_name, location_title, created_at
       FROM gbp_connections ORDER BY created_at DESC`,
    )) as Row[];
    return rows.map(toStore);
  }

  async findByStore(id: string): Promise<ConnectedStore | null> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      `SELECT id, store_label, google_account_id, location_name, location_title, created_at
       FROM gbp_connections WHERE id = $1`,
      [id],
    )) as Row[];
    return rows[0] ? toStore(rows[0]) : null;
  }

  async getRefreshToken(id: string): Promise<string | null> {
    await this.ensureSchema();
    const rows = (await this.sql.query(
      `SELECT encrypted_refresh_token FROM gbp_connections WHERE id = $1`,
      [id],
    )) as Row[];
    const enc = rows[0]?.encrypted_refresh_token;
    return enc ? decryptToken(String(enc)) : null;
  }

  async save(input: SaveStoreInput): Promise<ConnectedStore> {
    await this.ensureSchema();
    const id = randomUUID();
    const rows = (await this.sql.query(
      `INSERT INTO gbp_connections
         (id, store_label, google_account_id, location_name, location_title, encrypted_refresh_token, scopes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, store_label, google_account_id, location_name, location_title, created_at`,
      [
        id,
        input.storeLabel,
        input.googleAccountId ?? null,
        input.locationName,
        input.locationTitle,
        encryptToken(input.refreshToken),
        GBP_SCOPE,
      ],
    )) as Row[];
    return toStore(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.ensureSchema();
    await this.sql.query(`DELETE FROM gbp_connections WHERE id = $1`, [id]);
  }
}
