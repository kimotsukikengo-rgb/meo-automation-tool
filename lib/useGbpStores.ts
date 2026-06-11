"use client";

import { useCallback, useEffect, useState } from "react";

/** 連携店舗の選択肢（クライアント用。サーバ専用の token-store には依存しない） */
export interface GbpStoreOption {
  id: string;
  storeLabel: string;
  locationTitle: string;
}

/** 連携店舗の一覧を取得するフック（投稿先・取得元の選択に使う） */
export function useGbpStores(): {
  stores: GbpStoreOption[];
  loading: boolean;
  reload: () => void;
} {
  const [stores, setStores] = useState<GbpStoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/gbp/stores")
      .then((r) => r.json())
      .then((j) => {
        if (alive) setStores(j.stores ?? []);
      })
      .catch(() => {
        // 取得失敗時は空のまま（連携導線を表示）
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { stores, loading, reload };
}
