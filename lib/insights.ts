/**
 * Cross-metric patterns from a run of Oura days. Pure functions, no
 * framework, so they're unit-tested alongside portfolio.ts.
 *
 * Everything here is association, not causation: the UI says so, and every
 * comparison reports how many days back it.
 *
 * Day semantics (Oura's): a day's readiness and sleep belong to the night
 * that ended that morning; steps belong to that calendar day.
 */
import type { OuraDay } from "@/lib/stats";

/* ── Basics ─────────────────────────────────────────────────── */

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// Linear-interpolated quantile of a sorted array.
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function weekday(day: string): number {
  // 0 = Monday … 6 = Sunday
  return (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
}

/* ── What moves readiness ───────────────────────────────────── */

export type Factor = {
  id: "sleep" | "bedtime" | "steps" | "weekend";
  label: string;
  /** Readiness on "a" days minus readiness on "b" days. */
  diff: number;
  a: { label: string; n: number; avg: number };
  b: { label: string; n: number; avg: number };
};

// Comparisons need enough days on both sides to mean anything.
export const MIN_GROUP = 8;

type Pair = { x: number; readiness: number };

// Top quarter of x against bottom quarter, compared on readiness.
function quartileSplit(pairs: Pair[]) {
  if (pairs.length < MIN_GROUP * 4) return null;
  const xs = pairs.map((p) => p.x).sort((a, b) => a - b);
  const q1 = quantile(xs, 0.25);
  const q3 = quantile(xs, 0.75);
  const low = pairs.filter((p) => p.x <= q1).map((p) => p.readiness);
  const high = pairs.filter((p) => p.x >= q3).map((p) => p.readiness);
  if (low.length < MIN_GROUP || high.length < MIN_GROUP) return null;
  return { q1, q3, low, high };
}

export function formatClock(minutesFromMidnight: number): string {
  const m = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm}${h < 12 ? "am" : "pm"}`;
}

export function readinessFactors(days: OuraDay[]): Factor[] {
  const out: Factor[] = [];
  const withReadiness = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.readiness != null) as { d: OuraDay & { readiness: number }; i: number }[];

  const sleep = quartileSplit(
    withReadiness.flatMap(({ d }) => (d.sleepHours != null ? [{ x: d.sleepHours, readiness: d.readiness }] : []))
  );
  if (sleep) {
    out.push({
      id: "sleep",
      label: "Sleep length",
      diff: mean(sleep.high) - mean(sleep.low),
      a: { label: `${sleep.q3.toFixed(1)}h+ asleep`, n: sleep.high.length, avg: mean(sleep.high) },
      b: { label: `under ${sleep.q1.toFixed(1)}h`, n: sleep.low.length, avg: mean(sleep.low) },
    });
  }

  // Earlier is the "a" side, so a positive diff means early nights help.
  const bed = quartileSplit(
    withReadiness.flatMap(({ d }) => (d.bedtime != null ? [{ x: d.bedtime, readiness: d.readiness }] : []))
  );
  if (bed) {
    out.push({
      id: "bedtime",
      label: "Bedtime",
      diff: mean(bed.low) - mean(bed.high),
      a: { label: `in bed by ${formatClock(bed.q1)}`, n: bed.low.length, avg: mean(bed.low) },
      b: { label: `after ${formatClock(bed.q3)}`, n: bed.high.length, avg: mean(bed.high) },
    });
  }

  // Yesterday's steps against this morning's readiness.
  const load = quartileSplit(
    withReadiness.flatMap(({ d, i }) => {
      const prev = days[i - 1];
      return prev?.steps != null ? [{ x: prev.steps, readiness: d.readiness }] : [];
    })
  );
  if (load) {
    out.push({
      id: "steps",
      label: "Previous day's steps",
      diff: mean(load.high) - mean(load.low),
      a: { label: `${Math.round(load.q3 / 100) / 10}K+ steps`, n: load.high.length, avg: mean(load.high) },
      b: { label: `under ${Math.round(load.q1 / 100) / 10}K`, n: load.low.length, avg: mean(load.low) },
    });
  }

  const weekend = withReadiness.filter(({ d }) => weekday(d.day) >= 5).map(({ d }) => d.readiness);
  const weekdays = withReadiness.filter(({ d }) => weekday(d.day) < 5).map(({ d }) => d.readiness);
  if (weekend.length >= MIN_GROUP && weekdays.length >= MIN_GROUP) {
    out.push({
      id: "weekend",
      label: "Weekends",
      diff: mean(weekend) - mean(weekdays),
      a: { label: "Sat & Sun mornings", n: weekend.length, avg: mean(weekend) },
      b: { label: "weekday mornings", n: weekdays.length, avg: mean(weekdays) },
    });
  }

  return out.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
}

/* ── Weekly rhythm ──────────────────────────────────────────── */

export type WeekRow = {
  id: "steps" | "readiness" | "sleepScore" | "bedtime";
  label: string;
  /** Mean per weekday, Monday first; undefined where there's no data. */
  values: (number | undefined)[];
  n: number[];
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Sleep and bedtime are filed under the night they started (the evening
// before the Oura day); steps and readiness under the day itself.
export function weekRhythm(days: OuraDay[]): WeekRow[] {
  const rows: { id: WeekRow["id"]; label: string; night: boolean }[] = [
    { id: "steps", label: "Steps", night: false },
    { id: "readiness", label: "Readiness", night: false },
    { id: "sleepScore", label: "Sleep score", night: true },
    { id: "bedtime", label: "Bedtime", night: true },
  ];
  return rows.map(({ id, label, night }) => {
    const buckets: number[][] = WEEKDAYS.map(() => []);
    for (const d of days) {
      const v = d[id];
      if (v == null) continue;
      buckets[(weekday(d.day) + (night ? 6 : 0)) % 7].push(v);
    }
    return {
      id,
      label,
      values: buckets.map((b) => (b.length ? mean(b) : undefined)),
      n: buckets.map((b) => b.length),
    };
  });
}
