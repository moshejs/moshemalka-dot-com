/**
 * Portfolio data + pure utilities. Imported by `pages/index.tsx` and the test
 * suite. Keep this file framework-free (no React, no next/* imports) so it can
 * be unit-tested in plain Node.
 */

/* ── Trading session ──────────────────────────────────────── */

/**
 * Career start. Used as the epoch for the session counter and the
 * "experience" spec on the home page. Anchored to first professional work
 * in 2008 (Eastern time) — the position book below lists roles from 2016
 * onward; earlier work predates it.
 */
export const CAREER_EPOCH = new Date("2008-06-01T00:00:00-04:00").getTime();

export type SessionParts = {
  years: number;
  remDays: number;
  hh: string;
  mm: string;
  ss: string;
};

/**
 * Convert a duration in milliseconds to a Y/D/HH:MM:SS breakdown for the
 * session pill. Uses 365-day "years" — accurate enough for a header counter,
 * and matches `uptime(1)` style formatting.
 */
export function formatSession(ms: number): SessionParts {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const years = Math.floor(days / 365);
  const remDays = days - years * 365;
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    years,
    remDays,
    hh: String(hours).padStart(2, "0"),
    mm: String(minutes).padStart(2, "0"),
    ss: String(seconds).padStart(2, "0"),
  };
}

/* ── Position book ────────────────────────────────────────── */

export type Position = {
  id: string;
  range: string;
  size: string;
  side: "OPEN" | "CLOSED" | "META";
  ticker: string;
  desc: string;
  pnl: string;
  accent: string;
  basis: string;
  strikes: string[];
  instr: string[];
  /** External venue for the position — rendered as a link in the tear sheet. */
  url?: string;
};

export const POSITIONS: Position[] = [
  {
    id: "site",
    range: "26 → ●",
    size: "1 site",
    side: "META",
    ticker: "MM.NYC.SITE",
    desc: "the art behind this position · click",
    pnl: "read me",
    accent: "var(--lightning)",
    basis:
      "This site borrows the dense-data ergonomics of a trading desk to describe a software engineering career. The palette is Rolex Milgauss — Z-blue dial, lightning-orange seconds hand, green sapphire crystal, brushed steel — and the visual grammar is Bloomberg: spec sheets, position books, sector heatmaps, analyst tear sheets. Every finance term that appears here was chosen because it carries a second meaning that maps onto a career.",
    strikes: [
      "POSITIONS · jobs reframed as open + closed trading positions, with entry / exit / ΔP",
      "HOLDINGS · the tech stack as a sector heatmap — tile size = years on desk, heat = current allocation",
      "Tear sheets · every position click expands BASIS · HIGHLIGHTS · INSTRUMENTS · SIZE · TENOR",
      "Restraint · one pulse, zero tape, zero orbs — the terminal is flat and dry on purpose",
      "Double meanings · POSITIONS · HOLDINGS · TENOR · SIZE · MARK · BASIS · INSTRUMENTS — each reads in two languages",
    ],
    instr: ["Next.js", "TypeScript", "CSS", "Tailwind", "SVG"],
  },
  {
    id: "gs",
    range: "24-09 → ●",
    size: "100%",
    side: "OPEN",
    ticker: "GS.PWM",
    desc: "Private Wealth · Frontend on portfolio platform for brokers + HNW clients",
    pnl: "+12 teams",
    accent: "var(--z-blue)",
    basis:
      "Frontend on the Goldman Sachs Private Wealth platform. Brokers and high-net-worth clients depend on it daily. I own 2–4 core portfolio management pages inside a large-scale React + TypeScript + MobX SPA.",
    strikes: [
      "Built reusable Control Bar + Currency Picker — adopted across the broader app",
      "Led portfolio UX redesign + frontend refactor; aligned with internal design system",
      "Lifted unit-test coverage to 80%+ with Jest, strengthening release reliability",
      "Mentor + onboard analysts on architecture, testing, and code quality",
    ],
    instr: ["TypeScript", "React", "MobX", "Jest"],
  },
  {
    id: "qc",
    range: "23-02 → ●",
    size: "fractional",
    side: "OPEN",
    ticker: "QNTN.SW",
    desc: "Quentin Software · AI-first studio · fractional CTO for early-stage teams",
    pnl: "+9 ships",
    accent: "var(--lightning)",
    url: "https://www.quentin.software/",
    basis:
      "Quentin Software — my solo studio. AI-first product development, prototypes that ship, and fractional CTO work for early-stage teams — planning, marketing strategy, integrations, the whole stack.",
    strikes: [
      "uwu Labs — PFP image gallery (React + Firebase)",
      "Lavita Labs — diamond ring wizard (Next.js + GPT-4 + Stripe)",
      "Odeliya Probeauty — full Shopify build, 16 pages + custom auth + subscriptions",
      "Cut CI time 50% on partner repos",
    ],
    instr: ["Next.js", "GPT-4", "Firebase", "Stripe", "Shopify"],
  },
  {
    id: "peloton",
    range: "20-03 → 23-02",
    size: "100%",
    side: "CLOSED",
    ticker: "PELOTON",
    desc: "E-commerce React → Next.js + GraphQL · Guide launch · design system",
    pnl: "+core_vitals",
    accent: "var(--crystal)",
    basis:
      "Owned chunks of the e-commerce web stack. Migrated React to Next.js + GraphQL. Hosted the Blockchain/Web3 working group. Drove cross-functional launches.",
    strikes: [
      "Migrated React e-commerce → Next.js + GraphQL — Core Web Vitals up across the funnel",
      "Guided design-system team to ship a Storybook UI library from scratch",
      "Led the Guide product launch — cross-fn with product, marketing, content, design, SRE, DevOps",
      "Refreshed home / bike / bike+ / tread pages — sales funnel cut from 7 steps to 3",
    ],
    instr: ["React", "Next.js", "GraphQL", "Storybook", "TypeScript"],
  },
  {
    id: "industrious",
    range: "19-04 → 19-12",
    size: "100%",
    side: "CLOSED",
    ticker: "INDUSTRIOUS",
    desc: "Coworking platform · UI library · React → Gatsby + GraphQL (formerly CBRE Hana)",
    pnl: "+ui_lib v1",
    accent: "var(--steel)",
    basis:
      "Marketing + operations tech for the coworking platform — formerly CBRE Hana Workplaces.",
    strikes: [
      "Built UI library for component reuse across marketing + ops surfaces",
      "Set up CI/CD pipelines for streamlined deploys",
      "Migrated React → GatsbyJS + GraphQL",
      "Secured sign-in pages; extended marketing + coworking platforms",
    ],
    instr: ["React", "Gatsby", "GraphQL"],
  },
  {
    id: "icebonds",
    range: "18-10 → 19-01",
    size: "100%",
    side: "CLOSED",
    ticker: "ICE.BONDS",
    desc: "Lead frontend · Angular RFQ for institutional bond trading",
    pnl: "+cusip.parser",
    accent: "var(--z-blue)",
    basis:
      "Lead frontend on the Angular RFQ app for institutional bond trading. Formerly Bondpoint.",
    strikes: [
      "Built CUSIP parser — auto-extracts from clipboard, fills validation form",
      "Streamlined the quote-request workflow",
    ],
    instr: ["Angular", "TypeScript"],
  },
  {
    id: "cya",
    range: "18-06 → 18-10",
    size: "100%",
    side: "CLOSED",
    ticker: "CYA.INSURE",
    desc: "Tech lead · client-facing warranty platform",
    pnl: "+200ms loads",
    accent: "var(--crystal)",
    basis:
      "Tech lead on the customer-facing warranty + claims platform for CPS Central. Subsidiary build.",
    strikes: [
      "TypeScript / Angular / Ionic on AWS EC2",
      "Server-side rendering + lazy loading + code splitting",
      "Page loads under 200ms",
      "Instituted weekly code discussions + agile workflow",
    ],
    instr: ["TypeScript", "Angular", "Ionic", "AWS"],
  },
  {
    id: "hitbit",
    range: "17-10 → 18-05",
    size: "100%",
    side: "CLOSED",
    ticker: "HITBIT",
    desc: "Lead full-stack · HFT arbitrage · 26ms · 40+ exchanges · BigQuery",
    pnl: "▲ pnl 26ms",
    accent: "var(--lightning)",
    basis:
      "Lead full-stack on real-time HFT + quant trading algos. The room where 26ms mattered.",
    strikes: [
      "Arbitrage trades executing under 26ms",
      "Real-time database + BigQuery for volatility analysis across 40+ exchanges",
      "Trading strategies + profitability significantly enhanced",
    ],
    instr: ["TypeScript", "Node", "GCP", "Kafka", "BigQuery"],
  },
  {
    id: "icq",
    range: "16-12 → 17-09",
    size: "100%",
    side: "CLOSED",
    ticker: "INSTANT.CAR.QUOTE",
    desc: "Lead full-stack · leasing wizard · C# engine → REST API",
    pnl: "+rest engine",
    accent: "var(--steel)",
    basis:
      "Lead full-stack on a car configuration + leasing wizard.",
    strikes: [
      "Full-stack wizard — TypeScript / Angular / Node / AWS",
      "Repurposed the legacy C# leasing engine into a REST API",
    ],
    instr: ["TypeScript", "Angular", "Node", "AWS", "C#"],
  },
];

/* ── Holdings (tech stack as sector heatmap) ──────────────── */

export type Holding = {
  tkr: string;
  wt: number;       // % allocation
  tenor: string;    // years on the desk
  mark: "LIVE" | "HELD";
};

export const HOLDINGS: Holding[] = [
  // Weights are an allocation: must sum to 100. Adjust here, not in the JSX.
  { tkr: "typescript",     wt: 17, tenor: "9y", mark: "LIVE" },
  { tkr: "react",          wt: 15, tenor: "9y", mark: "LIVE" },
  { tkr: "next.js",        wt: 13, tenor: "6y", mark: "LIVE" },
  { tkr: "node",           wt: 12, tenor: "9y", mark: "LIVE" },
  { tkr: "python",         wt:  8, tenor: "7y", mark: "LIVE" },
  { tkr: "graphql",        wt:  7, tenor: "5y", mark: "LIVE" },
  { tkr: "tailwind",       wt:  6, tenor: "4y", mark: "LIVE" },
  { tkr: "bun",            wt:  4, tenor: "1y", mark: "LIVE" },
  { tkr: "websockets",     wt:  3, tenor: "8y", mark: "LIVE" },
  { tkr: "rest",           wt:  3, tenor: "9y", mark: "LIVE" },
  { tkr: "mongodb",        wt:  3, tenor: "6y", mark: "HELD" },
  { tkr: "firebase",       wt:  3, tenor: "5y", mark: "HELD" },
  { tkr: "aws",            wt:  2, tenor: "9y", mark: "LIVE" },
  { tkr: "gcp",            wt:  1, tenor: "7y", mark: "HELD" },
  { tkr: "llms · gpt-4",   wt:  1, tenor: "3y", mark: "LIVE" },
  { tkr: "docker",         wt:  1, tenor: "5y", mark: "LIVE" },
  { tkr: "github actions", wt:  1, tenor: "6y", mark: "LIVE" },
];

/* ── Holdings heatmap layout (squarified treemap) ─────────── */
/* The heatmap reads on two axes: tile AREA is tenor (years on the
   desk) and tile HEAT is current allocation weight. Layout is the
   classic squarified treemap (Bruls, Huizing, van Wijk) — rows are
   laid along the shorter side of the remaining rectangle and a row
   is closed as soon as adding the next item would worsen the worst
   aspect ratio in it. Pure math, unit-tested in plain Node. */

export type HeatTile = Holding & {
  years: number; // parsed tenor — drives tile area
  heat: number;  // wt / max wt, 0..1 — drives tile color intensity
  /** Tile rect as percentages of the container (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Parse a "9y" tenor string into years. */
export function tenorYears(tenor: string): number {
  const m = tenor.match(/^(\d+)y$/);
  if (!m) throw new Error(`Unparseable tenor: "${tenor}"`);
  return Number(m[1]);
}

type Rect = { x: number; y: number; w: number; h: number };

/** Worst aspect ratio in a row of areas laid along a side of length `side`. */
function worstAspect(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const s2 = sum * sum;
  const side2 = side * side;
  let worst = 1;
  for (const v of row) {
    worst = Math.max(worst, (side2 * v) / s2, s2 / (side2 * v));
  }
  return worst;
}

/**
 * Squarified treemap. `values` should be sorted descending for the
 * canonical near-square result; rects are returned in input order and
 * exactly tile the given rectangle.
 */
export function squarify(values: number[], bounds: Rect): Rect[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => ({ x: bounds.x, y: bounds.y, w: 0, h: 0 }));
  const scale = (bounds.w * bounds.h) / total;
  const areas = values.map((v) => v * scale);

  const rects: Rect[] = [];
  let { x, y, w, h } = bounds;
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h);
    // Grow the row while it keeps the worst aspect ratio from degrading.
    const row = [areas[i]];
    let j = i + 1;
    while (
      j < areas.length &&
      worstAspect([...row, areas[j]], side) <= worstAspect(row, side)
    ) {
      row.push(areas[j]);
      j++;
    }
    const rowSum = row.reduce((a, b) => a + b, 0);
    const thickness = rowSum / side;
    if (w >= h) {
      // Vertical strip on the left edge, items stacked top → bottom.
      let cy = y;
      for (const a of row) {
        const ih = a / thickness;
        rects.push({ x, y: cy, w: thickness, h: ih });
        cy += ih;
      }
      x += thickness;
      w -= thickness;
    } else {
      // Horizontal strip on the top edge, items laid left → right.
      let cx = x;
      for (const a of row) {
        const iw = a / thickness;
        rects.push({ x: cx, y, w: iw, h: thickness });
        cx += iw;
      }
      y += thickness;
      h -= thickness;
    }
    i = j;
  }
  return rects;
}

/**
 * Lay out the holdings as heatmap tiles. Computed in an `aspect`-wide,
 * 1-tall space so tiles come out near-square when the container is
 * rendered at the same aspect ratio, then normalized to percentages.
 */
export function computeHeatmap(
  holdings: Holding[] = HOLDINGS,
  aspect = 16 / 9
): HeatTile[] {
  const sorted = [...holdings].sort(
    (a, b) => tenorYears(b.tenor) - tenorYears(a.tenor) || b.wt - a.wt
  );
  const maxWt = Math.max(...sorted.map((s) => s.wt));
  const rects = squarify(
    sorted.map((s) => tenorYears(s.tenor)),
    { x: 0, y: 0, w: aspect, h: 1 }
  );
  return sorted.map((s, i) => ({
    ...s,
    years: tenorYears(s.tenor),
    heat: s.wt / maxWt,
    x: (rects[i].x / aspect) * 100,
    y: rects[i].y * 100,
    w: (rects[i].w / aspect) * 100,
    h: rects[i].h * 100,
  }));
}

/* ── Open-source listings ─────────────────────────────────── */

export type OssPackage = {
  /** npm package name — the listing lives at npmjs.com/package/<name>. */
  name: string;
  /** GitHub repo when it differs from the npm name (renamed at publish). */
  repo?: string;
  /** Rendered on the homepage; the rest sit behind the "all packages" link. */
  featured?: true;
  desc: string;
  group:
    | "Rates & Treasury"
    | "FX & Volatility"
    | "Market Structure"
    | "Startup Equity"
    | "Crypto & Consumer Credit"
    | "Off Desk";
};

/**
 * The npm package family. Every package is zero-dependency TypeScript with
 * homepage + author pointing back at moshemalka.com; rows render in the
 * Open Source section and feed the SoftwareSourceCode structured data.
 */
export const OSS_PACKAGES: OssPackage[] = [
  { name: "32nds", featured: true,                     group: "Rates & Treasury", desc: "US Treasury price math — 32nds quotes (105-16+), ticks, basis points" },
  { name: "treasury-bill-yield",       group: "Rates & Treasury", repo: "tbill", desc: "T-bill math — discount rate ↔ price ↔ bond-equivalent yield" },
  { name: "accrued-interest",          group: "Rates & Treasury", desc: "Bond accrued interest between coupon dates, across day-count bases" },
  { name: "day-count-conventions",     group: "Rates & Treasury", repo: "day-count", desc: "ISDA day counts — 30/360, ACT/360, ACT/365F, ACT/ACT & friends" },
  { name: "tips-index-ratio",          group: "Rates & Treasury", desc: "TIPS inflation math — reference-CPI interpolation & index ratios" },
  { name: "compounded-sofr", featured: true,           group: "Rates & Treasury", desc: "SOFR compounding in arrears — ARRC & ISDA conventions, SOFR Index" },
  { name: "sifma-holidays",            group: "Rates & Treasury", desc: "US bond-market holidays, early closes, and settlement dates" },
  { name: "treasurydirect", featured: true,            group: "Rates & Treasury", desc: "Typed client for the US Treasury's auction & securities APIs" },
  { name: "newyorkfed",                group: "Rates & Treasury", desc: "Typed client for the NY Fed Markets Data API — SOFR, EFFR, SOMA" },
  { name: "treasury-fiscaldata",       group: "Rates & Treasury", desc: "Typed client for Treasury FiscalData — Debt to the Penny & more" },
  { name: "fx-value-date",             group: "FX & Volatility",  desc: "FX settlement dates — spot, tom, forward tenors, dual calendars" },
  { name: "fx-forward-math",           group: "FX & Volatility",  desc: "Forward points ↔ outrights, cross rates, triangular arbitrage" },
  { name: "hagan-sabr", featured: true,                group: "FX & Volatility",  desc: "SABR implied vol — Hagan 2002 expansions, Obłój fix, calibration" },
  { name: "svi-vol-surface",           group: "FX & Volatility",  desc: "Gatheral SVI surfaces — parametrizations, arbitrage checks, fits" },
  { name: "instrument-identifiers", featured: true,    group: "Market Structure", desc: "CUSIP, ISIN, SEDOL, FIGI, LEI — check digits, parsing, conversion" },
  { name: "us-equity-market-calendar", group: "Market Structure", desc: "NYSE / NASDAQ trading calendar — holidays, early closes, sessions" },
  { name: "commitments-of-traders",    group: "Market Structure", desc: "Typed client for CFTC Commitments of Traders reports" },
  { name: "safe-stack-conversion", featured: true,     group: "Startup Equity",   desc: "YC SAFEs & convertible notes → pro-forma cap table at a priced round" },
  { name: "exit-waterfall",            group: "Startup Equity",   desc: "Liquidation-preference waterfalls — seniority, participation, conversion" },
  { name: "priced-round-math",         group: "Startup Equity",   desc: "Priced-round dilution — the option-pool shuffle, PPS, ownership" },
  { name: "vesting-schedule-math",     group: "Startup Equity",   desc: "Equity vesting — cliffs, tranches, fractional shares, acceleration" },
  { name: "perp-funding-math",         group: "Crypto & Consumer Credit", desc: "Perp funding — payments, APR/APY, cross-venue arb carry" },
  { name: "reg-z-apr", featured: true,                 group: "Crypto & Consumer Credit", desc: "Truth in Lending APR — the Reg Z Appendix J actuarial method" },
  { name: "rmd-uniform-lifetime",      group: "Off Desk",         desc: "IRS required-minimum-distribution math — Pub 590-B life tables" },
  { name: "mispar", featured: true,                    group: "Off Desk",         desc: "Hebrew gematria — 13 classical methods, atbash & albam transforms" },
  { name: "dicta-nakdan",              group: "Off Desk",         desc: "Typed client for Dicta's Nakdan API — automatic Hebrew nikud" },
];

/* ── Derived counts for the hero spec sheet ───────────────── */

export function countOpenPositions(positions: Position[] = POSITIONS): number {
  return positions.filter((p) => p.side === "OPEN").length;
}

export function countCareerPositions(positions: Position[] = POSITIONS): number {
  return positions.filter((p) => p.side === "OPEN" || p.side === "CLOSED").length;
}
