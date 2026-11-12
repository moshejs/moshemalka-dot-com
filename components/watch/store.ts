import { useSyncExternalStore } from "react";

/**
 * Shared state between the Work list (which decides what moment the watch
 * shows), the SVG dial, the readout, and the 3D watch.
 */
export type WatchState = {
  /** live = New York time of day; travel = wound back through the career. */
  mode: "live" | "travel";
  /** How far the hour hand is wound from today, in degrees (≤ 0). */
  wind: number;
  /** "MAR 2021" while travelling. */
  label: string;
  /** The role the reading line is in, while travelling. */
  roleId: string | null;
  company: string | null;
  /** Where the 3D watch currently sits. */
  slot: "hero" | "work";
  /** The 3D watch is drawn and covering the SVG in its slot. */
  ready: boolean;
};

let state: WatchState = {
  mode: "live",
  wind: 0,
  label: "",
  roleId: null,
  company: null,
  slot: "hero",
  ready: false,
};

const listeners = new Set<() => void>();

export function getWatch(): WatchState {
  return state;
}

export function setWatch(patch: Partial<WatchState>): void {
  let changed = false;
  for (const k in patch) {
    if (patch[k as keyof WatchState] !== state[k as keyof WatchState]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const SERVER: WatchState = state;

/** Subscribe to one primitive slice; re-renders only when that slice changes. */
export function useWatch<T>(select: (s: WatchState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(SERVER)
  );
}
