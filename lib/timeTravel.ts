/**
 * The watch as a time machine: pure maths, no DOM.
 *
 * Scrolling down the Work list winds the watch back from now to the start of
 * the earliest role. While winding, the watch stops telling the time of day
 * and tells the calendar instead, with a real movement's gearing: the hour
 * hand turns once a year (pointing at the month: January at one o'clock,
 * December at twelve) and the minute hand turns twelve times as fast, once a
 * month.
 */

import type { Role, YearMonth } from "./portfolio";

/** One role's stretch of the timeline, newest edge first. */
export type Stop = {
  id: string;
  company: string;
  /** Where the row's top edge sits in time (the previous role's start, or now). */
  from: number;
  /** Where the row's bottom edge sits in time (this role's start). */
  to: number;
};

/** UTC midnight on the first of the month. */
export function monthStart(ym: YearMonth): number {
  const [y, m] = ym.split("-").map(Number);
  return Date.UTC(y, m - 1, 1);
}

/**
 * Lay the roles (newest first) end to end so time only ever runs backwards:
 * each row covers from the previous row's start down to its own start.
 * Overlapping roles would otherwise make the hands jump forward again.
 */
export function buildStops(roles: Pick<Role, "id" | "company" | "start">[], now: number): Stop[] {
  let from = now;
  return roles.map((r) => {
    const to = Math.min(monthStart(r.start), from);
    const stop = { id: r.id, company: r.company, from, to };
    from = to;
    return stop;
  });
}

/** The moment `frac` (0 = top edge, 1 = bottom edge) of the way down a stop. */
export function dateAt(stop: Stop, frac: number): number {
  const f = Math.min(1, Math.max(0, frac));
  return stop.from + (stop.to - stop.from) * f;
}

/** Fractional months since year 0, in UTC. Mid-March 2021 is 2021*12 + 2.5. */
export function monthPosition(ms: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = Date.UTC(y, m, 1);
  const end = Date.UTC(y, m + 1, 1);
  return y * 12 + m + (ms - start) / (end - start);
}

/** Hour-hand angle for a date on the calendar dial, unwrapped (not mod 360). */
export function calendarHourDeg(ms: number): number {
  return (monthPosition(ms) + 1) * 30;
}

/** How far the hour hand has been wound from `now` to reach `t`. Negative = back. */
export function windDeg(now: number, t: number): number {
  return calendarHourDeg(t) - calendarHourDeg(now);
}

export function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The angle equal to `target` (mod 360) that is closest to `current`, so a
 * hand that has been wound many turns takes the short way to its next mark.
 */
export function nearestEquivalent(target: number, current: number): number {
  return target + 360 * Math.round((current - target) / 360);
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "MAR 2021" */
export function travelLabel(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Given the rows' top/bottom edges (px, any shared origin) and a reading line
 * in the same space, find which stop the line is in and how far through.
 * Returns null above the first row (the watch tells live time there); below
 * the last row it holds at the last stop's end.
 */
export function locate(
  rows: { top: number; bottom: number }[],
  line: number
): { index: number; frac: number } | null {
  if (!rows.length || line < rows[0].top) return null;
  for (let i = 0; i < rows.length; i++) {
    const { top, bottom } = rows[i];
    if (line < bottom) return { index: i, frac: bottom > top ? (line - top) / (bottom - top) : 0 };
  }
  return { index: rows.length - 1, frac: 1 };
}
