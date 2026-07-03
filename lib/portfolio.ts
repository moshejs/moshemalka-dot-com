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

/* ── Execution log (career events scrolling as trade fills) ─ */

export type ExecAction = "FILL" | "EXEC" | "OPEN" | "CLOSE" | "ROLL";

export type ExecEntry = {
  ts: string;
  action: ExecAction;
  sec: string;
  status: string;
  pos?: boolean;
};

export const EXEC_LOG: ExecEntry[] = [
  { ts: "26-04-29", action: "FILL",  sec: "ctrl_bar.component @ gs/pwm",         status: "+12 teams",      pos: true },
  { ts: "26-03-12", action: "FILL",  sec: "portfolio_v2.refresh",                status: "+80% cov",       pos: true },
  { ts: "25-09-04", action: "EXEC",  sec: "ai.assist --branch=onboarding",       status: "merged",         pos: true },
  { ts: "25-04-18", action: "EXEC",  sec: "lavita.ring_wizard --gpt-4 --stripe", status: "shipped",        pos: true },
  { ts: "24-09-15", action: "OPEN",  sec: "GS.PWM",                              status: "▲ active",       pos: true },
  { ts: "24-03-08", action: "EXEC",  sec: "odeliya.shopify (16 pages)",          status: "shipped",        pos: true },
  { ts: "23-02-12", action: "OPEN",  sec: "QC.STUDIO",                           status: "▲ active",       pos: true },
  { ts: "22-06-22", action: "ROLL",  sec: "peloton.web → next.gql",              status: "+core_vitals",   pos: true },
  { ts: "21-11-04", action: "FILL",  sec: "guide.launch",                        status: "shipped",        pos: true },
  { ts: "20-03-02", action: "OPEN",  sec: "PELOTON",                             status: "closed 23-02"              },
  { ts: "19-04-10", action: "OPEN",  sec: "INDUSTRIOUS",                         status: "closed 19-12"              },
  { ts: "18-10-22", action: "OPEN",  sec: "ICE.BONDS",                           status: "closed 19-01"              },
  { ts: "18-06-15", action: "OPEN",  sec: "CYA.INSURE",                          status: "closed 18-10"              },
  { ts: "17-10-15", action: "EXEC",  sec: "hitbit.arb 26ms · 40+ exch",          status: "▲ pnl",          pos: true },
  { ts: "16-12-01", action: "OPEN",  sec: "INSTANT.CAR.QUOTE",                   status: "closed 17-09"              },
];

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
      "This site borrows the dense-data ergonomics of a trading desk to describe a software engineering career. The palette is Rolex Milgauss — Z-blue dial, lightning-orange seconds hand, green sapphire crystal, brushed steel — and the visual grammar is Bloomberg: spec sheets, position books, fund holdings, execution logs, analyst tear sheets. Every finance term that appears here was chosen because it carries a second meaning that maps onto a career.",
    strikes: [
      "POSITIONS · jobs reframed as open + closed trading positions, with entry / exit / ΔP",
      "HOLDINGS · the tech stack rendered as a fund-allocation table — weight bars, tenor, LIVE/HELD marks",
      "Execution log · career events scrolling like a trade ticker (FILL · EXEC · OPEN · CLOSE · ROLL)",
      "Tear sheets · every position click expands BASIS · HIGHLIGHTS · INSTRUMENTS · SIZE · TENOR",
      "Restraint · one tape, one pulse, zero orbs — the terminal is flat and dry on purpose",
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
    ticker: "QC.STUDIO",
    desc: "Solo studio · AI prototypes · fractional CTO for early-stage teams",
    pnl: "+9 ships",
    accent: "var(--lightning)",
    basis:
      "Solo studio. AI R&D + prototypes that ship. Fractional CTO for early-stage teams — planning, marketing strategy, integrations, the whole stack.",
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

/* ── Holdings (tech stack as fund allocation) ─────────────── */

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

/* ── Derived counts for the hero spec sheet ───────────────── */

export function countOpenPositions(positions: Position[] = POSITIONS): number {
  return positions.filter((p) => p.side === "OPEN").length;
}

export function countCareerPositions(positions: Position[] = POSITIONS): number {
  return positions.filter((p) => p.side === "OPEN" || p.side === "CLOSED").length;
}
