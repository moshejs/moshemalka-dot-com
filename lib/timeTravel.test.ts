import { ROLES } from "./portfolio";
import {
  buildStops,
  calendarHourDeg,
  dateAt,
  locate,
  mod360,
  monthPosition,
  monthStart,
  nearestEquivalent,
  travelLabel,
  windDeg,
} from "./timeTravel";

const NOW = Date.UTC(2026, 10, 12);

describe("buildStops", () => {
  const stops = buildStops(ROLES, NOW);

  it("starts at now and ends at the earliest role's start", () => {
    expect(stops[0].from).toBe(NOW);
    expect(stops[stops.length - 1].to).toBe(monthStart(ROLES[ROLES.length - 1].start));
  });

  it("is contiguous and only ever runs backwards", () => {
    for (let i = 0; i < stops.length; i++) {
      expect(stops[i].to).toBeLessThanOrEqual(stops[i].from);
      if (i) expect(stops[i].from).toBe(stops[i - 1].to);
    }
  });

  it("never runs forward when a later row starts after an earlier one", () => {
    const s = buildStops(
      [
        { id: "a", company: "A", start: "2023-02" },
        { id: "b", company: "B", start: "2024-09" },
      ],
      NOW
    );
    expect(s[1].to).toBe(s[1].from);
  });
});

describe("dateAt", () => {
  const stop = { id: "x", company: "X", from: 1000, to: 0 };
  it("interpolates and clamps", () => {
    expect(dateAt(stop, 0)).toBe(1000);
    expect(dateAt(stop, 0.25)).toBe(750);
    expect(dateAt(stop, 2)).toBe(0);
    expect(dateAt(stop, -1)).toBe(1000);
  });
});

describe("calendar dial", () => {
  it("counts fractional months", () => {
    expect(monthPosition(Date.UTC(2021, 2, 1))).toBe(2021 * 12 + 2);
    expect(monthPosition(Date.UTC(2021, 2, 16, 12))).toBeCloseTo(2021 * 12 + 2.5, 5);
  });

  it("points the hour hand at the month: January at one, December at twelve", () => {
    expect(mod360(calendarHourDeg(Date.UTC(2020, 0, 1)))).toBe(30);
    expect(mod360(calendarHourDeg(Date.UTC(2020, 11, 1)))).toBe(0);
  });

  it("winds one full turn back per year", () => {
    expect(windDeg(Date.UTC(2026, 5, 1), Date.UTC(2025, 5, 1))).toBeCloseTo(-360, 6);
    expect(windDeg(NOW, NOW)).toBe(0);
  });
});

describe("nearestEquivalent", () => {
  it("keeps the angle's position on the dial but stays near the current turn", () => {
    expect(nearestEquivalent(10, 725)).toBe(730);
    expect(nearestEquivalent(350, -5)).toBe(-10);
    expect(nearestEquivalent(90, 100)).toBe(90);
  });
});

describe("travelLabel", () => {
  it("formats month and year", () => {
    expect(travelLabel(Date.UTC(2018, 9, 1))).toBe("OCT 2018");
  });
});

describe("locate", () => {
  const rows = [
    { top: 100, bottom: 200 },
    { top: 200, bottom: 260 },
  ];
  it("is null above the list", () => {
    expect(locate(rows, 99)).toBeNull();
    expect(locate([], 10)).toBeNull();
  });
  it("finds the row and fraction", () => {
    expect(locate(rows, 150)).toEqual({ index: 0, frac: 0.5 });
    expect(locate(rows, 200)).toEqual({ index: 1, frac: 0 });
  });
  it("holds at the end below the list", () => {
    expect(locate(rows, 999)).toEqual({ index: 1, frac: 1 });
  });
});
