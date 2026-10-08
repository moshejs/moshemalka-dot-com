/**
 * Portfolio data + pure utilities. Imported by `pages/index.tsx` and the test
 * suite. Keep this file framework-free (no React, no next/* imports) so it can
 * be unit-tested in plain Node.
 *
 * Everything here is plain English on purpose: company names first, real
 * dates, no invented figures.
 */

/* ── Career clock ─────────────────────────────────────────── */

/**
 * Career start. Anchored to first professional work in 2008 (Eastern time).
 * The role list below starts in 2016; earlier work predates it.
 */
export const CAREER_EPOCH = new Date("2008-06-01T00:00:00-04:00").getTime();

const YEAR_MS = 365.25 * 86_400 * 1000;

/** Whole years of professional work as of `now`. */
export function careerYears(now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - CAREER_EPOCH) / YEAR_MS));
}

/* ── Roles ────────────────────────────────────────────────── */

/** Year-month, e.g. "2024-09". */
export type YearMonth = `${number}-${number}`;

export type Role = {
  id: string;
  company: string;
  /** One plain line: what the job was. */
  role: string;
  start: YearMonth;
  /** null = current. */
  end: YearMonth | null;
  /** What the work involved, in a sentence or two. */
  summary: string;
  highlights: string[];
  tools: string[];
  link?: { href: string; label: string };
};

export const ROLES: Role[] = [
  {
    id: "goldman",
    company: "Goldman Sachs",
    role: "Private Wealth Management · portfolio platform for brokers and clients",
    start: "2024-09",
    end: null,
    summary:
      "Frontend on the Private Wealth portfolio platform that brokers and high-net-worth clients rely on every day. I own core portfolio-management pages inside a large React, TypeScript and MobX application.",
    highlights: [
      "Built the reusable Control Bar and Currency Picker, now used by 12 teams across the app",
      "Led the portfolio UX redesign and frontend refactor, aligned with the firm's design system",
      "Raised unit-test coverage past 80% with Jest, making releases more reliable",
      "Mentor and onboard analysts on architecture, testing and code quality",
    ],
    tools: ["TypeScript", "React", "MobX", "Jest"],
  },
  {
    id: "quentin",
    company: "Quentin Software",
    role: "My studio · AI-first product development, fractional CTO",
    start: "2023-02",
    end: null,
    summary:
      "My solo studio: AI-first product development, prototypes that ship, and fractional CTO work for early-stage teams, covering planning, marketing strategy, integrations and the whole stack.",
    highlights: [
      "Lavita Labs: a diamond-ring design wizard with GPT-4 and Stripe checkout",
      "Odeliya Probeauty: a full Shopify build, 16 pages with custom sign-in and subscriptions",
      "uwu Labs: a profile-picture image gallery on React and Firebase",
      "Cut CI time in half on partner codebases",
    ],
    tools: ["Next.js", "GPT-4", "Firebase", "Stripe", "Shopify"],
    link: { href: "https://www.quentin.software/", label: "quentin.software" },
  },
  {
    id: "peloton",
    company: "Peloton",
    role: "E-commerce web · Next.js and GraphQL replatform",
    start: "2020-03",
    end: "2023-02",
    summary:
      "Owned large parts of the e-commerce web stack, moved it from React to Next.js and GraphQL, ran the Blockchain/Web3 working group, and drove cross-team launches.",
    highlights: [
      "Moved the store from React to Next.js and GraphQL; Core Web Vitals improved across the funnel",
      "Guided the design-system team to ship a Storybook component library from scratch",
      "Led the Guide product launch across product, marketing, content, design, SRE and DevOps",
      "Rebuilt the home, Bike, Bike+ and Tread pages and cut checkout from 7 steps to 3",
    ],
    tools: ["React", "Next.js", "GraphQL", "Storybook", "TypeScript"],
  },
  {
    id: "industrious",
    company: "Industrious",
    role: "Coworking platform · marketing and operations web (formerly CBRE Hana)",
    start: "2019-04",
    end: "2019-12",
    summary:
      "Marketing and operations software for the coworking platform formerly known as CBRE Hana Workplaces.",
    highlights: [
      "Built a shared component library for the marketing and operations sites",
      "Set up CI/CD pipelines for faster, safer deploys",
      "Migrated the sites from React to Gatsby and GraphQL",
      "Secured the sign-in pages and extended the coworking platform",
    ],
    tools: ["React", "Gatsby", "GraphQL"],
  },
  {
    id: "ice",
    company: "ICE Bonds",
    role: "Lead frontend · institutional bond trading (formerly BondPoint)",
    start: "2018-10",
    end: "2019-01",
    summary:
      "Lead frontend engineer on the Angular request-for-quote application institutions use to trade bonds.",
    highlights: [
      "Built a CUSIP parser that reads bond IDs straight from the clipboard and fills the order form",
      "Simplified the quote-request workflow for traders",
    ],
    tools: ["Angular", "TypeScript"],
  },
  {
    id: "cps",
    company: "CPS Central",
    role: "Tech lead · CYA warranty and claims platform",
    start: "2018-06",
    end: "2018-10",
    summary:
      "Tech lead on CYA, the customer-facing warranty and claims platform, built for a CPS Central subsidiary.",
    highlights: [
      "Server-side rendering, lazy loading and code splitting brought page loads under 200ms",
      "Introduced weekly code discussions and an agile workflow to the team",
      "Built with TypeScript, Angular and Ionic on AWS",
    ],
    tools: ["TypeScript", "Angular", "Ionic", "AWS"],
  },
  {
    id: "hitbit",
    company: "HitBit",
    role: "Lead full-stack · high-frequency arbitrage trading",
    start: "2017-10",
    end: "2018-05",
    summary:
      "Lead full-stack engineer on real-time, high-frequency trading and quantitative strategies, where 26 milliseconds mattered.",
    highlights: [
      "Arbitrage trades executing in under 26 milliseconds",
      "Real-time data and BigQuery analysis of volatility across more than 40 exchanges",
      "Strategy work that made the trading measurably more profitable",
    ],
    tools: ["TypeScript", "Node", "GCP", "Kafka", "BigQuery"],
  },
  {
    id: "icq",
    company: "Instant Car Quote",
    role: "Lead full-stack · car configuration and leasing",
    start: "2016-12",
    end: "2017-09",
    summary: "Lead full-stack engineer on a car configuration and leasing wizard.",
    highlights: [
      "Built the full wizard on TypeScript, Angular, Node and AWS",
      "Turned the legacy C# leasing engine into a REST API",
    ],
    tools: ["TypeScript", "Angular", "Node", "AWS", "C#"],
  },
];

/* ── Tools (plain list, no weights) ───────────────────────── */

export const TOOLS: string[] = [
  "TypeScript",
  "React",
  "Next.js",
  "Node",
  "Python",
  "GraphQL",
  "Tailwind",
  "Bun",
  "WebSockets",
  "REST",
  "MongoDB",
  "Firebase",
  "AWS",
  "GCP",
  "LLMs",
  "Docker",
  "GitHub Actions",
];

/* ── Open source (npm package family) ─────────────────────── */

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

/* ── Formatting ───────────────────────────────────────────── */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2024-09" → "Sep 2024". */
export function formatYearMonth(ym: YearMonth): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "Sep 2024 – now" or "Mar 2020 – Feb 2023". */
export function formatRange(start: YearMonth, end: YearMonth | null): string {
  return `${formatYearMonth(start)} – ${end ? formatYearMonth(end) : "now"}`;
}

/** Whole months between two year-months; an open role runs to `now`. */
export function tenureMonths(
  start: YearMonth,
  end: YearMonth | null,
  now: Date = new Date()
): number {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end
    ? end.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  return Math.max(1, (ey - sy) * 12 + (em - sm));
}

/** 35 → "2 yr 11 mo". */
export function formatTenure(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
}
