import { latestWeekIndex, notableStanding, standing } from "./insights";
import type { OuraPublic, OuraWeek } from "./ouraPublic";

function oura(weeks: Partial<OuraWeek>[], average: OuraPublic["average"]): OuraPublic {
  return {
    from: "2026-01-05",
    through: "2026-03-01",
    weeks: weeks.map((w, i) => ({ start: `2026-01-${String(5 + i).padStart(2, "0")}`, ...w })),
    average,
    factors: [],
    rhythm: [],
  };
}

describe("latestWeekIndex", () => {
  it("skips trailing weeks with nothing published", () => {
    expect(latestWeekIndex(oura([{ steps: 1 }, { readiness: 70 }, {}], {}).weeks)).toBe(1);
    expect(latestWeekIndex(oura([{}, {}], {}).weeks)).toBe(-1);
  });
});

describe("standing", () => {
  const data = oura(
    [
      { steps: 9000, readiness: 70, hrvRel: 2 },
      { steps: 12000, readiness: 75, hrvRel: -4 },
      { steps: 6000, readiness: 71 },
      { readiness: 69, hrvRel: 1 },
      { steps: 11000, readiness: 70, hrvRel: 3 },
    ],
    { steps: 9500, readiness: 71 },
  );

  it("reads the latest week against the 12-month average", () => {
    const s = standing(data, "steps")!;
    expect(s.at).toBe(4);
    expect(s.value).toBe(11000);
    expect(s.diff).toBe(1500);
    expect(s.pct).toBe(16);
    expect(s.dir).toBe("up");
    expect(s.hi).toEqual({ at: 1, value: 12000 });
    expect(s.lo).toEqual({ at: 2, value: 6000 });
    expect(s.count).toBe(4);
    expect(s.above).toBe(2);
  });

  it("finds the last week that went at least as far", () => {
    expect(standing(data, "steps")!.since).toEqual({ at: 1 });
    expect(standing(data, "hrvRel")!.since).toEqual("year");
  });

  it("calls small gaps level and gives them no 'since'", () => {
    const s = standing(data, "readiness")!;
    expect(s.dir).toBe("down");
    const level = standing(oura([{ readiness: 70 }, { readiness: 71.5 }], { readiness: 71 }), "readiness")!;
    expect(level.dir).toBe("level");
    expect(level.since).toBeNull();
  });

  it("uses zero as the base for relative metrics", () => {
    const s = standing(data, "hrvRel")!;
    expect(s.base).toBe(0);
    expect(s.diff).toBe(3);
    expect(s.pct).toBeUndefined();
  });

  it("returns null without a figure or a base", () => {
    expect(standing(data, "sleepScore")).toBeNull();
    expect(standing(oura([{ steps: 5 }], {}), "steps")).toBeNull();
  });
});

describe("notableStanding", () => {
  it("picks the metric furthest from its own year", () => {
    const flat = Array.from({ length: 20 }, (_, i) => ({ steps: 9000 + (i % 2) * 200, readiness: 70 + (i % 2) }));
    const data = oura([...flat, { steps: 9100, readiness: 80 }], { steps: 9100, readiness: 70 });
    expect(notableStanding(data)?.metric).toBe("readiness");
  });
  it("returns null for an ordinary week", () => {
    const flat = Array.from({ length: 20 }, (_, i) => ({ steps: 9000 + (i % 3) * 300, readiness: 70 + (i % 3) }));
    expect(notableStanding(oura(flat, { steps: 9300, readiness: 71 }))).toBeNull();
  });
});
