"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

/**
 * useState とほぼ同じインターフェースで、値を localStorage に永続化するフック。
 *
 * - マウント後に保存値を復元する（SSRのハイドレーション不一致を避けるため初期値で初回描画）。
 * - 値の更新は set() 経由でのみ保存し、復元時には保存しない（初期値の上書き防止）。
 * - クリアは初期値をセットすれば保存値も初期値で上書きされる。
 *
 * 画面（モジュール）間をルート遷移してコンポーネントがアンマウントされても、
 * 生成結果・入力内容が消えないようにするために使う。
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const hydrated = useRef(false);

  // マウント後に保存値を復元
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      // 破損データ・JSON失敗は無視して初期値を使う
    }
    hydrated.current = true;
  }, [key]);

  // set() 経由の更新時のみ保存する
  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (value) => {
      setState((prev) => {
        const next =
          typeof value === "function"
            ? (value as (p: T) => T)(prev)
            : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // 容量超過などの保存失敗は無視
        }
        return next;
      });
    },
    [key],
  );

  return [state, set];
}
