"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and the first client render, true once hydrated. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
