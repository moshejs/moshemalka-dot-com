/**
 * What the site is allowed to say about Oura data.
 *
 * The raw readings (one row per day: sleep, heart rate, bedtime) never leave
 * the server. Everything public goes through `summarise`, which enforces:
 *
 *  - weekly, never daily: each figure is the average of a Monday–Sunday week,
 *    and a week with fewer than MIN_READINGS readings is a gap;
 *  - a week late: the newest week shown ended at least PUBLISH_LAG_DAYS ago,
 *    so nothing here says how last night or this week went;
 *  - relative where the absolute number is clinical: HRV and resting heart
 *    rate are published only as a percentage of the wearer's own average;
 *  - no clock times: bedtime appears only as minutes earlier or later than
 *    usual, by weekday, and sleep length not at all.
 *
 * Pure functions, unit-tested in ouraPublic.test.ts.
 */
import { mean, readinessFactors, weekRhythm, type Factor, type WeekRow } from "./insights";
import type { OuraDay } from "./stats";

export const PUBLISH_LAG_DAYS = 7;
export const PUBLISH_WEEKS = 52;
export const MIN_READINGS = 4;

export type OuraWeek = {
  /** The week's Monday. */
  start: string;
  readiness?: number;
  sleepScore?: number;
  /** Average steps a day, to the nearest hundred. */
  steps?: number;
  /** Percent above or below the wearer's own average over the whole period. */
  hrvRel?: number;
  restingHrRel?: number;
};

export type OuraPublic = {
  /** First and last day covered: a Monday and a Sunday. */
  from: string;
  through: string;
  weeks: OuraWeek[];
  average: { readiness?: number; sleepScore?: number; steps?: number };
  /** To the nearest thousand. */
  stepsTotal?: number;
  factors: Factor[];
  rhythm: WeekRow[];
};

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The latest Sunday at least PUBLISH_LAG_DAYS before `today`. */
export function publishedThrough(today: string): string {
  const cutoff = addDays(today, -PUBLISH_LAG_DAYS);
  const dow = new Date(`${cutoff}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(cutoff, -dow);
}

/** The Monday PUBLISH_WEEKS whole weeks before that Sunday. */
export function publishedFrom(today: string): string {
  return addDays(publishedThrough(today), -(PUBLISH_WEEKS * 7 - 1));
}

const defined = (xs: (number | undefined)[]) => xs.filter((x): x is number => x != null);
const avg = (xs: number[], min = 1) => (xs.length >= min ? mean(xs) : undefined);
const round = (v: number | undefined, to = 1) => (v == null ? undefined : Math.round(v / to) * to);
const relative = (v: number | undefined, base: number | undefined) =>
  v == null || !base ? undefined : Math.round((v / base - 1) * 100);

/** Raw days in, publishable summary out. Null when there's nothing to show. */
export function summarise(raw: OuraDay[], today: string): OuraPublic | null {
  const from = publishedFrom(today);
  const through = publishedThrough(today);
  const byDay = new Map(raw.map((d) => [d.day, d]));
  // A continuous run, so weekday maths and "the day before" both hold.
  const days: OuraDay[] = [];
  for (let day = from; day <= through; day = addDays(day, 1)) days.push(byDay.get(day) ?? { day });

  const all = (key: "readiness" | "sleepScore" | "steps" | "hrv" | "restingHr") =>
    defined(days.map((d) => d[key]));
  if (!all("readiness").length && !all("sleepScore").length && !all("steps").length) return null;

  const hrvBase = avg(all("hrv"));
  const rhrBase = avg(all("restingHr"));

  const weeks: OuraWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    const of = (key: Parameters<typeof all>[0]) =>
      avg(defined(slice.map((d) => d[key])), MIN_READINGS);
    const week: OuraWeek = { start: slice[0].day };
    const set = <K extends keyof OuraWeek>(k: K, v: OuraWeek[K] | undefined) => {
      if (v != null) week[k] = v;
    };
    set("readiness", round(of("readiness")));
    set("sleepScore", round(of("sleepScore")));
    set("steps", round(of("steps"), 100));
    set("hrvRel", relative(of("hrv"), hrvBase));
    set("restingHrRel", relative(of("restingHr"), rhrBase));
    weeks.push(week);
  }

  const steps = all("steps");
  return {
    from,
    through,
    weeks,
    average: {
      readiness: round(avg(all("readiness"))),
      sleepScore: round(avg(all("sleepScore"))),
      steps: round(avg(steps), 100),
    },
    stepsTotal: steps.length ? round(steps.reduce((a, b) => a + b, 0), 1000) : undefined,
    factors: readinessFactors(days).map((f) => ({
      ...f,
      diff: +f.diff.toFixed(1),
      a: { ...f.a, avg: Math.round(f.a.avg) },
      b: { ...f.b, avg: Math.round(f.b.avg) },
    })),
    rhythm: weekRhythm(days).map((row) => ({
      ...row,
      values: row.values.map((v) =>
        round(v, row.id === "steps" ? 100 : row.id === "bedtime" ? 5 : 1),
      ),
    })),
  };
}
