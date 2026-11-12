import { PUBLISH_WEEKS, publishedFrom, publishedThrough, summarise } from "./ouraPublic";
import type { OuraDay } from "./stats";

function daysFrom(start: string, n: number, fill: (i: number, day: string) => Partial<OuraDay>): OuraDay[] {
  const out: OuraDay[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    const day = d.toISOString().slice(0, 10);
    out.push({ day, ...fill(i, day) });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// 2026-11-12 is a Thursday.
const TODAY = "2026-11-12";

describe("publishing window", () => {
  it("ends on the latest Sunday at least a week back", () => {
    expect(publishedThrough(TODAY)).toBe("2026-11-01");
    expect(publishedThrough("2026-11-15")).toBe("2026-11-08"); // a Sunday: exactly 7 days
    expect(publishedThrough("2026-11-14")).toBe("2026-11-01");
  });
  it("starts on a Monday, a whole number of weeks earlier", () => {
    const from = publishedFrom(TODAY);
    expect(new Date(`${from}T00:00:00Z`).getUTCDay()).toBe(1);
    const span = (Date.parse("2026-11-01") - Date.parse(from)) / 86_400_000 + 1;
    expect(span).toBe(PUBLISH_WEEKS * 7);
  });
});

describe("summarise", () => {
  const raw = daysFrom("2025-10-01", 420, (i) => ({
    readiness: 70 + (i % 7),
    sleepScore: 60 + (i % 5),
    steps: 8000 + (i % 3) * 1111,
    sleepHours: 4.3 + (i % 4),
    hrv: 50 + (i % 9),
    restingHr: 48 + (i % 6),
    bedtime: 137 + (i % 11),
  }));
  const out = summarise(raw, TODAY)!;

  it("never includes a day inside the last week", () => {
    expect(out.through).toBe("2026-11-01");
    expect(out.weeks).toHaveLength(PUBLISH_WEEKS);
    expect(out.weeks.at(-1)!.start).toBe("2026-10-26");
    // A wild reading yesterday changes nothing that is published.
    const spiked = raw.map((d) => (d.day > "2026-11-01" ? { ...d, readiness: 1, hrv: 300, steps: 99999 } : d));
    expect(summarise(spiked, TODAY)).toEqual(out);
  });

  it("carries no daily rows, hours, clock times or absolute heart numbers", () => {
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/sleepHours|"hrv"|"restingHr"|"day"/);
    // Bedtime survives only as minutes from the usual, by weekday.
    const bed = out.rhythm.find((r) => r.id === "bedtime")!;
    for (const v of bed.values) expect(Math.abs(v!)).toBeLessThan(30);
    for (const w of out.weeks) {
      expect(Object.keys(w).sort()).toEqual(["hrvRel", "readiness", "restingHrRel", "sleepScore", "start", "steps"]);
      expect(Math.abs(w.hrvRel!)).toBeLessThan(20);
    }
  });

  it("rounds steps so a week's figure can't be matched to exact days", () => {
    for (const w of out.weeks) expect(w.steps! % 100).toBe(0);
    expect(out.stepsTotal! % 1000).toBe(0);
  });

  it("treats a thinly worn week as a gap", () => {
    const sparse = raw.map((d) => (d.day >= "2026-10-26" && d.day <= "2026-10-29" ? { day: d.day } : d));
    const last = summarise(sparse, TODAY)!.weeks.at(-1)!;
    expect(last).toEqual({ start: "2026-10-26" }); // 3 readings left: below the minimum
  });

  it("returns null when the ring logged nothing in the window", () => {
    expect(summarise([], TODAY)).toBeNull();
    expect(summarise(daysFrom("2026-11-05", 7, () => ({ readiness: 80 })), TODAY)).toBeNull();
  });
});
