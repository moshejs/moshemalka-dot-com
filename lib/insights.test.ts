import { MIN_GROUP, formatClock, readinessFactors, weekRhythm } from "./insights";
import { bedtimeMinutes, type OuraDay } from "./stats";

// Consecutive days from a Monday.
function daysFrom(start: string, n: number, fill: (i: number) => Partial<OuraDay>): OuraDay[] {
  const out: OuraDay[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    out.push({ day: d.toISOString().slice(0, 10), ...fill(i) });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

describe("bedtimeMinutes", () => {
  it("counts evenings back from midnight and early hours forward", () => {
    expect(bedtimeMinutes("2026-10-21T23:30:00-04:00")).toBe(-30);
    expect(bedtimeMinutes("2026-10-22T01:15:09-04:00")).toBe(75);
    expect(bedtimeMinutes("2026-10-22T00:00:00+02:00")).toBe(0);
  });
  it("uses the wall-clock time in the string, not UTC", () => {
    expect(bedtimeMinutes("2026-10-22T22:00:00-07:00")).toBe(-120);
  });
});

describe("formatClock", () => {
  it("formats minutes from midnight on a 12-hour clock", () => {
    expect(formatClock(-30)).toBe("11:30pm");
    expect(formatClock(75)).toBe("1:15am");
    expect(formatClock(0)).toBe("12:00am");
  });
});



describe("readinessFactors", () => {
  // Readiness tracks sleep length exactly; steps are noise around it.
  const days = daysFrom("2026-01-05", 120, (i) => {
    const sleepHours = 5 + (i % 5); // 5..9h
    return { sleepHours, readiness: 50 + sleepHours * 4, steps: 8000 + ((i * 37) % 5) * 100 };
  });

  it("ranks the factor that actually drives readiness first", () => {
    const factors = readinessFactors(days);
    expect(factors[0].id).toBe("sleep");
    // Quartile cuts land at 6h and 8h: {8h, 9h} average 84, {5h, 6h} average 72.
    expect(factors[0].diff).toBeCloseTo(12);
    expect(factors[0].a.label).toBe("8.0h+ asleep");
    expect(factors[0].a.n).toBeGreaterThanOrEqual(MIN_GROUP);
  });

  it("is sorted by absolute effect", () => {
    const diffs = readinessFactors(days).map((f) => Math.abs(f.diff));
    expect(diffs).toEqual([...diffs].sort((a, b) => b - a));
  });

  it("skips comparisons without enough days on both sides", () => {
    expect(readinessFactors(days.slice(0, 10))).toEqual([]);
  });

  it("compares this morning's readiness with the previous day's steps", () => {
    // High-step days are followed by low readiness the next morning.
    const lagged = daysFrom("2026-01-05", 120, (i) => ({
      steps: i % 2 === 0 ? 20000 : 4000,
      readiness: i % 2 === 0 ? 85 : 65, // so the day after 20K reads 65
    }));
    const steps = readinessFactors(lagged).find((f) => f.id === "steps")!;
    expect(steps.diff).toBeCloseTo(-20);
  });
});

describe("weekRhythm", () => {
  it("files steps under the day and sleep under the night before", () => {
    // 2026-01-05 is a Monday.
    const days = daysFrom("2026-01-05", 14, (i) => ({
      steps: i % 7 === 0 ? 20000 : 5000,
      sleepScore: i % 7 === 0 ? 90 : 60,
    }));
    const [steps, , sleep] = weekRhythm(days);
    expect(steps.values[0]).toBe(20000); // Monday's steps
    // Monday-morning sleep belongs to Sunday night.
    expect(sleep.values[6]).toBe(90);
    expect(sleep.values[0]).toBe(60);
  });
  it("leaves weekdays with no readings empty", () => {
    const rows = weekRhythm(daysFrom("2026-01-05", 1, () => ({ steps: 100 })));
    expect(rows[0].values.filter((v) => v != null)).toHaveLength(1);
    expect(rows[1].values.every((v) => v == null)).toBe(true);
  });
});
