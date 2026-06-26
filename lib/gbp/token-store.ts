import { randomUUID } from "node:crypto";
import { isDatabaseConfigured } from "./config";
import { MOCK_LOCATIONS } from "./mock";
import { PostgresTokenStore } from "./token-store-postgres";

/**
 * 連携クライアント店舗ごとのトークン保存（マルチテナント）。
 * リポジトリ抽象。DATABASE_URL があれば Postgres、無ければ開発用の in-memory mock。
 */

/** 画面に渡す連携店舗（リフレッシュトークンは含めない） */
export interface ConnectedStore {
  id: string;
  storeLabel: string;
  /** locations/{id} 形式 */
  locationName: string;
  locationTitle: string;
  googleAccountId?: string;
  createdAt: string; // ISO8601
}

/** 連携保存の入力 */
export interface SaveStoreInput {
  storeLabel: string;
  locationName: string;
  locationTitle: string;
  googleAccountId?: string;
  /** 平文のリフレッシュトークン（保存時に暗号化される） */
  refreshToken: string;
}

export interface TokenStore {
  listStores(): Promise<ConnectedStore[]>;
  findByStore(id: string): Promise<ConnectedStore | null>;
  /** 復号済みリフレッシュトークン（API 呼び出しに使用） */
  getRefreshToken(id: string): Promise<string | null>;
  save(input: SaveStoreInput): Promise<ConnectedStore>;
  delete(id: string): Promise<void>;
}

// ---- in-memory mock store（DATABASE_URL 未設定時のデモ用） ----
// 開発サーバの単一プロセス内でのみ永続。サーバレス/再起動では揮発する。

interface MockRow extends ConnectedStore {
  refreshToken: string;
}

function stripToken(row: MockRow): ConnectedStore {
  const { refreshToken: _omit, ...store } = row;
  void _omit;
  return store;
}

const mockRows: Map<string, MockRow> = (() => {
  const seed = new Map<string, MockRow>();
  const first = MOCK_LOCATIONS[0];
  seed.set("demo-shibuya", {
    id: "demo-shibuya",
    storeLabel: first.title,
    locationName: first.name,
    locationTitle: first.title,
    createdAt: "2026-06-01T00:00:00.000Z",
    refreshToken: "mock-refresh-token",
  });
  return seed;
})();

class MockTokenStore implements TokenStore {
  async listStores(): Promise<ConnectedStore[]> {
    return [...mockRows.values()].map(stripToken);
  }
  async findByStore(id: string): Promise<ConnectedStore | null> {
    const row = mockRows.get(id);
    return row ? stripToken(row) : null;
  }
  async getRefreshToken(id: string): Promise<string | null> {
    return mockRows.get(id)?.refreshToken ?? null;
  }
  async save(input: SaveStoreInput): Promise<ConnectedStore> {
    const id = randomUUID();
    const row: MockRow = {
      id,
      storeLabel: input.storeLabel,
      locationName: input.locationName,
      locationTitle: input.locationTitle,
      googleAccountId: input.googleAccountId,
      createdAt: new Date().toISOString(),
      refreshToken: input.refreshToken,
    };
    mockRows.set(id, row);
    return stripToken(row);
  }
  async delete(id: string): Promise<void> {
    mockRows.delete(id);
  }
}

let cached: TokenStore | null = null;

/** 環境に応じたトークンストアを返す（DATABASE_URL 有→Postgres / 無→mock） */
export function getTokenStore(): TokenStore {
  if (!cached) {
    cached = isDatabaseConfigured()
      ? new PostgresTokenStore()
      : new MockTokenStore();
  }
  return cached;
}
