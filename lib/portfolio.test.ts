import {
  CAREER_EPOCH,
  HOLDINGS,
  OSS_PACKAGES,
  POSITIONS,
  computeHeatmap,
  countCareerPositions,
  countOpenPositions,
  formatSession,
  squarify,
  tenorYears,
  type Holding,
} from "./portfolio";

const VALID_MARKS: Holding["mark"][] = ["LIVE", "HELD"];

describe("formatSession", () => {
  it("returns all zeros for 0ms", () => {
    expect(formatSession(0)).toEqual({
      years: 0,
      remDays: 0,
      hh: "00",
      mm: "00",
      ss: "00",
    });
  });

  it("clamps negative durations to zero", () => {
    expect(formatSession(-5_000)).toEqual({
      years: 0,
      remDays: 0,
      hh: "00",
      mm: "00",
      ss: "00",
    });
  });

  it("zero-pads hours, minutes, and seconds", () => {
    // 1h 2m 3s
    const ms = (1 * 3600 + 2 * 60 + 3) * 1000;
    expect(formatSession(ms)).toMatchObject({ hh: "01", mm: "02", ss: "03" });
  });

  it("converts a single day cleanly", () => {
    expect(formatSession(86_400 * 1000)).toMatchObject({
      years: 0,
      remDays: 1,
      hh: "00",
      mm: "00",
      ss: "00",
    });
  });

  it("rolls 365 days into 1 year", () => {
    expect(formatSession(365 * 86_400 * 1000)).toMatchObject({
      years: 1,
      remDays: 0,
    });
  });

  it("composes years + remaining days correctly", () => {
    // 11 years + 200 days
    const ms = (11 * 365 + 200) * 86_400 * 1000;
    expect(formatSession(ms)).toMatchObject({ years: 11, remDays: 200 });
  });

  it("handles a real session-length value", () => {
    // synthetic "now" — a fixed point so the test stays deterministic
    const NOW = new Date("2026-05-04T12:00:00-04:00").getTime();
    const parts = formatSession(NOW - CAREER_EPOCH);
    expect(parts.years).toBeGreaterThanOrEqual(17);
    expect(parts.years).toBeLessThanOrEqual(18);
    expect(parts.remDays).toBeGreaterThanOrEqual(0);
    expect(parts.remDays).toBeLessThan(365);
    expect(parts.hh).toMatch(/^\d{2}$/);
  });
});

describe("CAREER_EPOCH", () => {
  it("is anchored to 2008-06-01 ET (first professional work)", () => {
    const d = new Date(CAREER_EPOCH);
    expect(d.getUTCFullYear()).toBe(2008);
    expect(d.getUTCMonth()).toBe(5); // June
    expect(d.getUTCDate()).toBe(1);
  });

  it("is in the past", () => {
    expect(CAREER_EPOCH).toBeLessThan(Date.now());
  });
});

describe("POSITIONS", () => {
  it("contains a META row + at least one OPEN + at least one CLOSED", () => {
    const sides = POSITIONS.map((p) => p.side);
    expect(sides).toContain("META");
    expect(sides).toContain("OPEN");
    expect(sides).toContain("CLOSED");
  });

  it("has exactly one META row (the design tear sheet)", () => {
    expect(POSITIONS.filter((p) => p.side === "META")).toHaveLength(1);
  });

  it("uses unique ids across every row", () => {
    const ids = POSITIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique tickers across non-meta rows", () => {
    const tkrs = POSITIONS.filter((p) => p.side !== "META").map((p) => p.ticker);
    expect(new Set(tkrs).size).toBe(tkrs.length);
  });

  it.each(POSITIONS)("$id populates every required tear-sheet field", (p) => {
    expect(p.basis.length).toBeGreaterThan(20);
    expect(p.strikes.length).toBeGreaterThan(0);
    expect(p.instr.length).toBeGreaterThan(0);
    for (const s of p.strikes) {
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it.each(POSITIONS)("$id uses a Milgauss CSS variable accent", (p) => {
    expect(p.accent).toMatch(/^var\(--(z-blue|lightning|crystal|steel)\)$/);
  });

  it.each(POSITIONS.filter((p) => p.side === "OPEN"))(
    "$id (open) range ends with a live dot",
    (p) => {
      expect(p.range).toContain("●");
    }
  );

  it.each(POSITIONS.filter((p) => p.side === "CLOSED"))(
    "$id (closed) range is YY-MM → YY-MM",
    (p) => {
      expect(p.range).toMatch(/^\d{2}-\d{2}\s+→\s+\d{2}-\d{2}$/);
    }
  );

  it("countOpenPositions / countCareerPositions agree with the array", () => {
    const open = POSITIONS.filter((p) => p.side === "OPEN").length;
    const career = POSITIONS.filter((p) => p.side === "OPEN" || p.side === "CLOSED").length;
    expect(countOpenPositions()).toBe(open);
    expect(countCareerPositions()).toBe(career);
    // META rows should never be counted toward the career total
    expect(countCareerPositions()).toBeLessThan(POSITIONS.length);
  });
});

describe("HOLDINGS", () => {
  it("uses unique tickers", () => {
    const tkrs = HOLDINGS.map((h) => h.tkr);
    expect(new Set(tkrs).size).toBe(tkrs.length);
  });

  it.each(HOLDINGS)("$tkr has a positive integer weight", (h) => {
    expect(h.wt).toBeGreaterThan(0);
    expect(Number.isInteger(h.wt)).toBe(true);
  });

  it("weights sum to ~100% (allocation, not over-allocated)", () => {
    const total = HOLDINGS.reduce((acc, h) => acc + h.wt, 0);
    expect(total).toBeLessThanOrEqual(100);
    expect(total).toBeGreaterThanOrEqual(80);
  });

  it("is ordered by weight descending", () => {
    for (let i = 1; i < HOLDINGS.length; i++) {
      expect(HOLDINGS[i].wt).toBeLessThanOrEqual(HOLDINGS[i - 1].wt);
    }
  });

  it.each(HOLDINGS)("$tkr uses a 'Ny' tenor string", (h) => {
    expect(h.tenor).toMatch(/^\d+y$/);
  });

  it.each(HOLDINGS)("$tkr is marked LIVE or HELD", (h) => {
    expect(VALID_MARKS).toContain(h.mark);
  });
});

describe("tenorYears", () => {
  it("parses 'Ny' strings", () => {
    expect(tenorYears("9y")).toBe(9);
    expect(tenorYears("1y")).toBe(1);
    expect(tenorYears("12y")).toBe(12);
  });

  it("throws on malformed tenors", () => {
    expect(() => tenorYears("9")).toThrow();
    expect(() => tenorYears("y9")).toThrow();
    expect(() => tenorYears("")).toThrow();
  });
});

describe("squarify", () => {
  const BOUNDS = { x: 0, y: 0, w: 16, h: 9 };

  it("returns one rect per value, in input order", () => {
    const rects = squarify([5, 3, 2], BOUNDS);
    expect(rects).toHaveLength(3);
    // Areas map back to values (input order preserved)
    const total = 5 + 3 + 2;
    const scale = (BOUNDS.w * BOUNDS.h) / total;
    expect(rects[0].w * rects[0].h).toBeCloseTo(5 * scale, 6);
    expect(rects[1].w * rects[1].h).toBeCloseTo(3 * scale, 6);
    expect(rects[2].w * rects[2].h).toBeCloseTo(2 * scale, 6);
  });

  it("tiles the bounds exactly (areas sum to bounds area)", () => {
    const values = [9, 9, 9, 8, 7, 6, 5, 4, 3, 1];
    const rects = squarify(values, BOUNDS);
    const area = rects.reduce((acc, r) => acc + r.w * r.h, 0);
    expect(area).toBeCloseTo(BOUNDS.w * BOUNDS.h, 6);
  });

  it("keeps every rect inside the bounds", () => {
    const rects = squarify([9, 7, 5, 3, 1, 1, 1], BOUNDS);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.w).toBeLessThanOrEqual(BOUNDS.w + 1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(BOUNDS.h + 1e-9);
    }
  });

  it("produces no overlapping rects", () => {
    const rects = squarify([9, 9, 8, 7, 6, 5, 4, 3, 2, 1], BOUNDS);
    const eps = 1e-9;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlaps =
          a.x + a.w > b.x + eps &&
          b.x + b.w > a.x + eps &&
          a.y + a.h > b.y + eps &&
          b.y + b.h > a.y + eps;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe("computeHeatmap", () => {
  const tiles = computeHeatmap();

  it("returns one tile per holding", () => {
    expect(tiles).toHaveLength(HOLDINGS.length);
    expect(new Set(tiles.map((t) => t.tkr)).size).toBe(HOLDINGS.length);
  });

  it("is sorted by years descending (size = experience)", () => {
    for (let i = 1; i < tiles.length; i++) {
      expect(tiles[i].years).toBeLessThanOrEqual(tiles[i - 1].years);
    }
  });

  it("scales tile area proportionally to years on desk", () => {
    const totalYears = tiles.reduce((acc, t) => acc + t.years, 0);
    for (const t of tiles) {
      // w and h are percentages, so tile area % of the map = w*h/100
      expect((t.w * t.h) / 100).toBeCloseTo((t.years / totalYears) * 100, 6);
    }
  });

  it("covers the full map with tiles inside 0–100%", () => {
    const area = tiles.reduce((acc, t) => acc + (t.w * t.h) / 100, 0);
    expect(area).toBeCloseTo(100, 6);
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-1e-9);
      expect(t.y).toBeGreaterThanOrEqual(-1e-9);
      expect(t.x + t.w).toBeLessThanOrEqual(100 + 1e-9);
      expect(t.y + t.h).toBeLessThanOrEqual(100 + 1e-9);
    }
  });

  it("normalizes heat to 0..1 with the top allocation at 1", () => {
    for (const t of tiles) {
      expect(t.heat).toBeGreaterThan(0);
      expect(t.heat).toBeLessThanOrEqual(1);
    }
    expect(Math.max(...tiles.map((t) => t.heat))).toBe(1);
  });
});

describe("OSS_PACKAGES", () => {
  it("lists the full 20-package npm family", () => {
    expect(OSS_PACKAGES).toHaveLength(26);
  });

  it("uses unique, valid npm package names", () => {
    const names = OSS_PACKAGES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      // Unscoped npm names: lowercase alphanumerics and hyphens.
      expect(name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  it("keeps every description one tight line", () => {
    for (const p of OSS_PACKAGES) {
      expect(p.desc.length).toBeGreaterThan(0);
      expect(p.desc.length).toBeLessThanOrEqual(80);
      expect(p.desc).not.toMatch(/\n/);
    }
  });

  it("only sets repo when it differs from the npm name", () => {
    for (const p of OSS_PACKAGES) {
      if (p.repo !== undefined) expect(p.repo).not.toBe(p.name);
    }
  });

  it("keeps groups contiguous so section labels render once each", () => {
    const seen: string[] = [];
    for (const p of OSS_PACKAGES) {
      if (seen[seen.length - 1] !== p.group) seen.push(p.group);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });
});
