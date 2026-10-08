import {
  CAREER_EPOCH,
  ROLES,
  TOOLS,
  careerYears,
  formatRange,
  formatYearMonth,
  formatTenure,
  tenureMonths,
  OSS_PACKAGES,
} from "./portfolio";

const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

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

describe("careerYears", () => {
  it("counts whole years since 2008", () => {
    const NOW = new Date("2026-10-05T12:00:00-04:00").getTime();
    expect(careerYears(NOW)).toBe(18);
  });

  it("never goes negative", () => {
    expect(careerYears(CAREER_EPOCH - 1000)).toBe(0);
  });
});

describe("formatting", () => {
  it("formats a year-month", () => {
    expect(formatYearMonth("2024-09")).toBe("Sep 2024");
    expect(formatYearMonth("2016-12")).toBe("Dec 2016");
  });

  it("formats open and closed ranges", () => {
    expect(formatRange("2024-09", null)).toBe("Sep 2024 – now");
    expect(formatRange("2020-03", "2023-02")).toBe("Mar 2020 – Feb 2023");
  });
});

describe("ROLES", () => {
  it("uses unique ids and company names", () => {
    expect(new Set(ROLES.map((r) => r.id)).size).toBe(ROLES.length);
    expect(new Set(ROLES.map((r) => r.company)).size).toBe(ROLES.length);
  });

  it.each(ROLES)("$id has valid dates that end after they start", (r) => {
    expect(r.start).toMatch(YM_RE);
    if (r.end) {
      expect(r.end).toMatch(YM_RE);
      expect(r.end > r.start).toBe(true);
    }
  });

  it.each(ROLES)("$id populates every detail field", (r) => {
    expect(r.role.length).toBeGreaterThan(5);
    expect(r.summary.length).toBeGreaterThan(20);
    expect(r.highlights.length).toBeGreaterThan(0);
    expect(r.tools.length).toBeGreaterThan(0);
  });

  it("is ordered current first, then by start date descending", () => {
    for (let i = 1; i < ROLES.length; i++) {
      expect(ROLES[i].start <= ROLES[i - 1].start).toBe(true);
    }
  });

  it("links the studio to quentin.software", () => {
    const studio = ROLES.find((r) => r.company === "Quentin Software");
    expect(studio?.link?.href).toBe("https://www.quentin.software/");
  });

  it("never mentions Miami (NYC only)", () => {
    expect(JSON.stringify(ROLES)).not.toMatch(/miami|\bMIA\b/i);
  });
});

describe("TOOLS", () => {
  it("is a plain, unique list", () => {
    expect(TOOLS.length).toBeGreaterThan(5);
    expect(new Set(TOOLS).size).toBe(TOOLS.length);
  });
});

describe("tenure", () => {
  it("counts whole months between start and end", () => {
    expect(tenureMonths("2020-03", "2023-02")).toBe(35);
    expect(tenureMonths("2018-06", "2018-10")).toBe(4);
  });

  it("measures an open role up to now", () => {
    const NOW = new Date("2026-10-05T12:00:00-04:00");
    expect(tenureMonths("2024-09", null, NOW)).toBe(25);
  });

  it("formats tenure as years and months", () => {
    expect(formatTenure(35)).toBe("2 yr 11 mo");
    expect(formatTenure(4)).toBe("4 mo");
    expect(formatTenure(24)).toBe("2 yr");
  });
});

describe("OSS_PACKAGES", () => {
  it("lists unique npm names", () => {
    expect(new Set(OSS_PACKAGES.map((p) => p.name)).size).toBe(OSS_PACKAGES.length);
  });

  it("features 32nds (the homepage example)", () => {
    expect(OSS_PACKAGES.find((p) => p.name === "32nds")?.featured).toBe(true);
  });

  it.each(OSS_PACKAGES)("$name has a description", (p) => {
    expect(p.desc.length).toBeGreaterThan(10);
  });
});
