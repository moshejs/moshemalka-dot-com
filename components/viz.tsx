/* Chart helpers shared by the live-stats cards and the pattern cards.
   Marks follow one spec: 2px lines, 4px rounded bar ends square at the
   baseline, <= 24px bars, hairline reference lines. */
import { useLayoutEffect, useState, type KeyboardEvent, type PointerEvent } from "react";

export const BAR_MAX = 24;
export const RADIUS = 4;
export const PAD = 6; // room for a 4px end-dot plus its 2px ring

export function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Oura's "day" is a local calendar date.
export function dayLabel(day: string, style: "relative" | "short" = "relative"): string {
  if (style === "relative") {
    const now = new Date();
    if (day === localIso(now)) return "today";
    now.setDate(now.getDate() - 1);
    if (day === localIso(now)) return "yesterday";
  }
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const fmt = (n: number) => n.toLocaleString("en-US");

// Callback ref, so it measures whenever the element mounts, including one
// that appears later (a chart rendered once its data arrives).
export function useWidth<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width] as const;
}

// Width and height, for a chart that fills whatever room its card has.
export function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size] as const;
}

// The pointer snaps to the nearest day; arrow keys step through days when the
// chart has focus. The readout line under each chart shows the selected day.
export function useScrub(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * count);
    setActive(Math.max(0, Math.min(count - 1, i)));
  };
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -1 : 1;
    setActive((i) => Math.max(0, Math.min(count - 1, (i ?? count - 1) + step)));
  };
  const clear = () => setActive(null);
  return {
    active,
    handlers: {
      onPointerMove,
      onPointerLeave: clear,
      onBlur: clear,
      onKeyDown,
      tabIndex: 0,
    },
  };
}

export type ScrubHandlers = ReturnType<typeof useScrub>["handlers"];

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function barPath(x0: number, y: number, bar: number, base: number): string {
  const r = Math.min(RADIUS, base - y, bar / 2);
  // Rounded data-end, square at the baseline.
  return (
    `M${x0},${base}V${y + r}Q${x0},${y} ${x0 + r},${y}` +
    `H${x0 + bar - r}Q${x0 + bar},${y} ${x0 + bar},${y + r}V${base}Z`
  );
}
