import { isGbpLive } from "./config";
import {
  createLocalPost,
  fetchMetrics,
  listAccounts,
  listLocations,
  listReviews,
  replyToReview,
} from "./api";
import { refreshAccessToken } from "./oauth";
import {
  MOCK_LOCATIONS,
  MOCK_POST_RESULT,
  mockMetrics,
  mockReviews,
} from "./mock";
import { getTokenStore } from "./token-store";
import type { ConnectedStore } from "./token-store";
import type {
  CreatePostInput,
  GbpLocalPostResult,
  GbpMetricsResult,
  GbpReview,
} from "./types";

/**
 * 連携店舗ごとの GBP 操作ファサード。
 * GBP_LIVE=off は mock を、on は実 API（トークン更新つき）を使う。
 */
export interface GbpClient {
  storeLabel: string;
  listReviews(): Promise<GbpReview[]>;
  replyToReview(reviewId: string, comment: string): Promise<void>;
  createPost(input: CreatePostInput): Promise<GbpLocalPostResult>;
  fetchMetrics(period: string, comparePeriod: string): Promise<GbpMetricsResult>;
}

class MockGbpClient implements GbpClient {
  constructor(public storeLabel: string) {}
  async listReviews(): Promise<GbpReview[]> {
    return mockReviews(this.storeLabel);
  }
  async replyToReview(): Promise<void> {
    // mock: 何もしない（投稿成功扱い）
  }
  async createPost(): Promise<GbpLocalPostResult> {
    return MOCK_POST_RESULT;
  }
  async fetchMetrics(
    period: string,
    comparePeriod: string,
  ): Promise<GbpMetricsResult> {
    return mockMetrics(period, comparePeriod);
  }
}

class LiveGbpClient implements GbpClient {
  constructor(
    public storeLabel: string,
    private accessToken: string,
    private accountName: string,
    private locationName: string,
  ) {}
  listReviews(): Promise<GbpReview[]> {
    return listReviews(this.accessToken, this.accountName, this.locationName);
  }
  replyToReview(reviewId: string, comment: string): Promise<void> {
    return replyToReview(
      this.accessToken,
      this.accountName,
      this.locationName,
      reviewId,
      comment,
    );
  }
  createPost(input: CreatePostInput): Promise<GbpLocalPostResult> {
    return createLocalPost(
      this.accessToken,
      this.accountName,
      this.locationName,
      input,
    );
  }
  fetchMetrics(
    period: string,
    comparePeriod: string,
  ): Promise<GbpMetricsResult> {
    return fetchMetrics(
      this.accessToken,
      this.locationName,
      period,
      comparePeriod,
    );
  }
}

/** 連携店舗 ID から GBP クライアントを得る */
export async function getGbpClient(storeId: string): Promise<GbpClient> {
  const store = await getTokenStore().findByStore(storeId);
  if (!store) {
    throw new Error("指定された連携店舗が見つかりません。");
  }
  if (!isGbpLive()) {
    return new MockGbpClient(store.storeLabel);
  }

  const refreshToken = await getTokenStore().getRefreshToken(storeId);
  if (!refreshToken) {
    throw new Error("リフレッシュトークンがありません。再連携してください。");
  }
  if (!store.googleAccountId) {
    throw new Error("Googleアカウント情報が不足しています。再連携してください。");
  }
  const accessToken = await refreshAccessToken(refreshToken);
  return new LiveGbpClient(
    store.storeLabel,
    accessToken,
    store.googleAccountId,
    store.locationName,
  );
}

/**
 * OAuth 後、連携アカウントの全 Location を連携店舗として保存する（マルチテナント）。
 * 保存件数を返す。
 */
export async function saveDiscoveredStores(
  accessToken: string,
  refreshToken: string,
): Promise<number> {
  const store = getTokenStore();
  const accounts = await listAccounts(accessToken);
  let count = 0;
  for (const account of accounts) {
    const locations = await listLocations(accessToken, account.name);
    for (const location of locations) {
      await store.save({
        storeLabel: location.title,
        locationName: location.name,
        locationTitle: location.title,
        googleAccountId: account.name,
        refreshToken,
      });
      count += 1;
    }
  }
  return count;
}

/** mock 連携: 未登録の MOCK_LOCATION を 1 件、連携店舗として追加 */
export async function saveMockStore(): Promise<ConnectedStore | null> {
  const store = getTokenStore();
  const existing = await store.listStores();
  const usedNames = new Set(existing.map((s) => s.locationName));
  const next = MOCK_LOCATIONS.find((l) => !usedNames.has(l.name));
  if (!next) return null;
  return store.save({
    storeLabel: next.title,
    locationName: next.name,
    locationTitle: next.title,
    googleAccountId: "accounts/mock",
    refreshToken: "mock-refresh-token",
  });
}
