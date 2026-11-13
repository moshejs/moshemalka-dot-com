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
import type { OuraPublic, OuraWeek } from "@/lib/ouraPublic";
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
      // No hours: how long the nights are stays private.
      a: { label: "longest nights", n: sleep.high.length, avg: mean(sleep.high) },
      b: { label: "shortest nights", n: sleep.low.length, avg: mean(sleep.low) },
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
      // No clock times, for the same reason.
      a: { label: "earliest nights", n: bed.low.length, avg: mean(bed.low) },
      b: { label: "latest nights", n: bed.high.length, avg: mean(bed.high) },
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
  /** Mean per weekday, Monday first; undefined where there's no data.
      Bedtime is minutes later (+) or earlier (−) than the overall average,
      never a clock time. */
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
  const bedtimes = days.flatMap((d) => (d.bedtime != null ? [d.bedtime] : []));
  const usualBedtime = bedtimes.length ? mean(bedtimes) : 0;
  return rows.map(({ id, label, night }) => {
    const buckets: number[][] = WEEKDAYS.map(() => []);
    for (const d of days) {
      const v = d[id];
      if (v == null) continue;
      buckets[(weekday(d.day) + (night ? 6 : 0)) % 7].push(id === "bedtime" ? v - usualBedtime : v);
    }
    return {
      id,
      label,
      values: buckets.map((b) => (b.length ? mean(b) : undefined)),
      n: buckets.map((b) => b.length),
    };
  });
}

/* ── The latest published week, read against the year ─────────
   Everything below works on the public summary (lib/ouraPublic.ts), never
   on raw days: it only re-reads figures the page already publishes. */


export type WeekMetric = "steps" | "readiness" | "sleepScore" | "hrvRel" | "restingHrRel";

export type MetricSpec = {
  id: WeekMetric;
  label: string;
  /** For tight controls. */
  short: string;
  /** Published as a percentage of the 12-month average, so the base is 0. */
  relative: boolean;
  upIsGood: boolean;
};

export const METRICS: MetricSpec[] = [
  { id: "steps", label: "Steps", short: "Steps", relative: false, upIsGood: true },
  { id: "readiness", label: "Readiness", short: "Readiness", relative: false, upIsGood: true },
  { id: "sleepScore", label: "Sleep score", short: "Sleep", relative: false, upIsGood: true },
  { id: "hrvRel", label: "HRV", short: "HRV", relative: true, upIsGood: true },
  { id: "restingHrRel", label: "Resting heart rate", short: "Resting HR", relative: true, upIsGood: false },
];

export const metricSpec = (id: WeekMetric) => METRICS.find((m) => m.id === id) as MetricSpec;

/** The newest week with any published figure, or -1. */
export function latestWeekIndex(weeks: OuraWeek[]): number {
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (METRICS.some((m) => w[m.id] != null)) return i;
  }
  return -1;
}

export type Standing = {
  metric: WeekMetric;
  /** Index into weeks. */
  at: number;
  value: number;
  /** The 12-month average (0 for relative metrics). */
  base: number;
  /** value − base: points, steps, or percent for relative metrics. */
  diff: number;
  /** Steps only: diff as a whole percentage of base. */
  pct?: number;
  /** "up" / "down" against the base, or "level" when the gap is noise. */
  dir: "up" | "down" | "level";
  /** Standard deviations from the mean of the weekly series. */
  z: number;
  lo: { at: number; value: number };
  hi: { at: number; value: number };
  /** Weeks with a figure, and how many of them sat above the base. */
  count: number;
  above: number;
  /** The most recent earlier week that went at least as far in the same
      direction, or "year" when none did. Null when level. */
  since: { at: number } | "year" | null;
};

// Below these gaps a week reads as "about usual".
const LEVEL = { points: 1, pct: 3 };

export function standing(oura: OuraPublic, metric: WeekMetric, at = latestWeekIndex(oura.weeks)): Standing | null {
  const spec = metricSpec(metric);
  const values = oura.weeks.map((w) => w[metric]);
  const value = values[at];
  if (at < 0 || value == null) return null;
  const base = spec.relative ? 0 : (oura.average[metric as "steps" | "readiness" | "sleepScore"] ?? undefined);
  if (base == null) return null;

  const defined = values.flatMap((v, i) => (v == null ? [] : [{ v, i }]));
  const avg = mean(defined.map((d) => d.v));
  const sd = Math.sqrt(mean(defined.map((d) => (d.v - avg) ** 2))) || 1;
  const diff = value - base;
  const pct = metric === "steps" && base ? Math.round((diff / base) * 100) : undefined;
  const level = pct != null ? Math.abs(pct) < LEVEL.pct : Math.abs(diff) < LEVEL.points;
  const dir = level ? "level" : diff > 0 ? "up" : "down";

  let lo = defined[0];
  let hi = defined[0];
  for (const d of defined) {
    if (d.v < lo.v) lo = d;
    if (d.v >= hi.v) hi = d;
  }

  let since: Standing["since"] = null;
  if (dir !== "level") {
    since = "year";
    for (let i = at - 1; i >= 0; i--) {
      const v = values[i];
      if (v != null && (dir === "up" ? v >= value : v <= value)) {
        since = { at: i };
        break;
      }
    }
  }

  return {
    metric,
    at,
    value,
    base,
    diff,
    pct,
    dir,
    z: (value - avg) / sd,
    lo: { at: lo.i, value: lo.v },
    hi: { at: hi.i, value: hi.v },
    count: defined.length,
    above: defined.filter((d) => d.v > base).length,
    since,
  };
}

/** The figure that stands out most in the latest week, if any does: the
    largest move against the year's own spread, at least NOTABLE_Z standard
    deviations from it and clear of the 12-month average. */
export const NOTABLE_Z = 0.75;

export function notableStanding(oura: OuraPublic): Standing | null {
  const at = latestWeekIndex(oura.weeks);
  let best: Standing | null = null;
  for (const m of METRICS) {
    const s = standing(oura, m.id, at);
    if (!s || s.dir === "level" || Math.abs(s.z) < NOTABLE_Z) continue;
    if (!best || Math.abs(s.z) > Math.abs(best.z)) best = s;
  }
  return best;
}
