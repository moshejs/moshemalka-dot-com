import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  CAREER_EPOCH,
  POSITIONS,
  computeHeatmap,
  countCareerPositions,
  countOpenPositions,
  formatSession,
  type Position,
} from "@/lib/portfolio";

/**
 * Moshe Malka — Intersection
 *
 * Not resume.
 * Not corporate.
 * Just signal + energy.
 */

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// ── SEO ───────────────────────────────────────────────────────────────────
const SITE_URL = "https://moshemalka.com";

const SEO = {
  title: "Moshe Malka — Engineering Leader",
  description:
    "Moshe Malka is a New York City engineering leader — writing software since 2008, leading and mentoring teams, and shipping products with AI.",
  ogImage: `${SITE_URL}/og-image.jpg`,
};

// schema.org @graph — establishes "Moshe Malka" as a single entity Google can
// reconcile (Person + WebSite + ProfilePage), with sameAs linking the verified
// social profiles that feed entity/Knowledge-Graph signals for the name query.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Moshe Malka",
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/moshe.jpg`,
      jobTitle: "Engineering Leader",
      description:
        "New York City engineering leader — writing software since 2008, leading and mentoring teams, and shipping products with AI.",
      email: "hello@moshemalka.com",
      birthPlace: { "@type": "Place", name: "New York City, NY, USA" },
      homeLocation: { "@type": "Place", name: "New York City, NY, USA" },
      nationality: { "@type": "Country", name: "United States" },
      knowsAbout: [
        "Software Engineering",
        "Engineering Leadership",
        "Artificial Intelligence",
        "Team Leadership",
        "Web Development",
        "TypeScript",
        "React",
        "Next.js",
        "Distributed Systems",
      ],
      sameAs: [
        "https://www.linkedin.com/in/moshenyc/",
        "https://github.com/moshejs",
        "https://stackoverflow.com/users/7381252/moshe",
        "https://www.instagram.com/justmoshemalka/",
      ],
      affiliation: { "@id": "https://www.quentin.software/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://www.quentin.software/#organization",
      name: "Quentin Software",
      url: "https://www.quentin.software/",
      description:
        "AI-first software studio — product development, prototypes, and fractional CTO work led by Moshe Malka.",
      founder: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Moshe Malka",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#person` },
      about: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: "Moshe Malka — Engineering Leader",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#person` },
      mainEntity: { "@id": `${SITE_URL}/#person` },
      primaryImageOfPage: `${SITE_URL}/og-image.jpg`,
      inLanguage: "en",
    },
  ],
};

/* The one piece of fixed chrome: session + availability in a single pill.
   Years are computed once on mount (no 1Hz timer — the uptime joke lands
   identically without seconds precision). */
function StatusPill() {
  const [years, setYears] = React.useState<number | null>(null);
  useEffect(() => {
    setYears(formatSession(Date.now() - CAREER_EPOCH).years);
  }, []);
  return (
    <a
      href="https://www.linkedin.com/in/moshenyc/"
      target="_blank"
      rel="noopener noreferrer"
      className="mm-status mm-reveal"
      aria-label="Session open — available for select work. Connect on LinkedIn."
    >
      <span className="mm-status-dot" aria-hidden />
      <span className="mm-mono text-[10px]" style={{ color: "var(--muted)" }}>
        SESSION OPEN{years !== null ? ` · ${years}Y` : ""} · Available
      </span>
    </a>
  );
}

/* Words the hero verb cycles through — each carries a finance double
   meaning (move/fill/scale/yield/ship). The rotor plays ONCE on load and
   settles on the last word: an ending makes it a moment, a loop makes it
   noise. Keep all 5–6 chars so the line doesn't reflow as the word swaps. */
const HERO_VERBS = ["move.", "fill.", "scale.", "yield.", "ship."] as const;

function RotatingWord({
  words,
  interval = 1100,
  startDelay = 1700,
}: {
  words: readonly string[];
  interval?: number;
  startDelay?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // No motion: land directly on the settled word.
      setIdx(words.length - 1);
      return;
    }
    // Wait for the entrance animation to settle, then cycle through the
    // list exactly once and stop on the final word.
    let intervalId: number | null = null;
    const startCycling = () => {
      intervalId = window.setInterval(() => {
        setIdx((i) => {
          const next = i + 1;
          if (next >= words.length - 1 && intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          return Math.min(next, words.length - 1);
        });
      }, interval);
    };
    const startTimeoutId = window.setTimeout(startCycling, startDelay);
    return () => {
      window.clearTimeout(startTimeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [words.length, interval, startDelay]);

  return (
    <span className="mm-rotor">
      <span
        className="mm-rotor-inner"
        style={{ ["--idx" as string]: idx }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="mm-rotor-word mm-grad-word">
            {w}
          </span>
        ))}
      </span>
      <span className="mm-rotor-sr">{words[idx]}</span>
    </span>
  );
}

function HeroHeading() {
  const lineOne = ["I", "like", "building"];
  const lineTwo = ["things", "that"];
  const base = 140;
  const step = 70;
  const totalCount = lineOne.length + lineTwo.length + 1;

  return (
    <h1 className="mm-title mt-12 text-6xl md:text-8xl font-bold leading-[1.04]">
      <span className="mm-line">
        {lineOne.map((w, i) => (
          <React.Fragment key={`a-${i}`}>
            <span
              className="mm-word"
              style={{ animationDelay: `${base + i * step}ms` }}
            >
              {w}
            </span>
            {i < lineOne.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </span>
      <span className="mm-line">
        {lineTwo.map((w, i) => (
          <React.Fragment key={`b-${i}`}>
            <span
              className="mm-word"
              style={{
                animationDelay: `${base + (lineOne.length + i) * step + 60}ms`,
              }}
            >
              {w}
            </span>{" "}
          </React.Fragment>
        ))}
        <span
          className="mm-word"
          style={{ animationDelay: `${base + (totalCount - 1) * step + 120}ms` }}
        >
          <RotatingWord words={HERO_VERBS} />
        </span>
      </span>
    </h1>
  );
}

function SectionMarker({ children }: { children: ReactNode }) {
  return (
    <div className="mm-marker">
      <span className="mm-marker-bar" aria-hidden />
      <span
        className="mm-mono text-[11px]"
        style={{ color: "var(--soft)" }}
      >
        {children}
      </span>
    </div>
  );
}

/* Hero spec sheet — Bloomberg frame, recruiter-grade payload. Every value
   is a real fact; counts come from the tested lib helpers. */
const CAREER_YEARS = Math.floor(
  (Date.now() - CAREER_EPOCH) / (365.25 * 24 * 3600 * 1000)
);

function HeroStats() {
  const openCount = countOpenPositions();
  const totalPositions = countCareerPositions();
  return (
    <div className="mm-specs mm-mono mt-14 mm-reveal mm-delay-4">
      <div className="mm-spec">
        <div className="mm-spec-key">experience</div>
        <div className="mm-spec-val">
          <CountUp to={CAREER_YEARS} suffix="Y" />
        </div>
        <div className="mm-spec-ctx">writing software since ’08</div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec">
        <div className="mm-spec-key">current</div>
        <div className="mm-spec-val">GS.PWM</div>
        <div className="mm-spec-ctx">Goldman Sachs · Private Wealth</div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec">
        <div className="mm-spec-key">desk</div>
        <div className="mm-spec-val">NYC ↔ MIA</div>
        <div className="mm-spec-ctx">dual desk</div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec">
        <div className="mm-spec-key">positions</div>
        <div className="mm-spec-val">
          <CountUp to={totalPositions} />
        </div>
        <div className="mm-spec-ctx">{openCount} open · full book below</div>
      </div>
    </div>
  );
}

function GridPaper() {
  return <div className="mm-grid-paper" aria-hidden />;
}

/* ── Count-up animated number ─────────────────────────────── */
/* rAF-driven, starts only once the number scrolls into view, and lands
   directly on the final value under prefers-reduced-motion. */
function CountUp({
  to,
  duration = 1300,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const [val, setVal] = React.useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // For very small targets the ramp would just flicker — skip the animation.
    const skip =
      (to <= 1 && decimals === 0) ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window);
    if (skip) {
      setVal(to);
      return;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(eased * to);
        if (t < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    const el = ref.current;
    if (!el) {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, duration, decimals]);

  return (
    <span ref={ref} className="mm-count">
      {prefix}
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val)}
      {suffix}
    </span>
  );
}

function PositionRow({
  r,
  i,
  expanded,
  onToggle,
}: {
  r: Position;
  i: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <div
        className="mm-watch mm-traj-row"
        style={{
          ["--mm-delay" as string]: `${i * 50}ms`,
          ["--accent" as string]: r.accent,
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="mm-mono mm-traj-year">{r.range}</div>
        <div className="mm-traj-co">
          <span className="mm-pos-side mm-mono" data-side={r.side}>
            {r.side}
          </span>
        </div>
        <div className="mm-traj-note">
          <span
            className="mm-mono"
            style={{
              color: "var(--ink)",
              fontSize: "0.78rem",
              letterSpacing: "0.06em",
            }}
          >
            {r.ticker}
          </span>
          <span style={{ color: "var(--muted)" }}>{` · ${r.desc}`}</span>
          <span
            className="mm-mono"
            style={{
              marginLeft: "0.6rem",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              color:
                r.side === "META"
                  ? "var(--lightning)"
                  : r.side === "OPEN"
                  ? "var(--crystal)"
                  : "var(--soft)",
            }}
          >
            ΔP {r.pnl}
          </span>
          <span className="mm-traj-chevron mm-mono" aria-hidden>
            ▸
          </span>
        </div>
      </div>
      <div
        className="mm-tear mm-mono"
        data-open={expanded}
        style={{ ["--accent" as string]: r.accent }}
        aria-hidden={!expanded}
      >
        <div className="mm-tear-grid">
          <div className="mm-tear-key">basis</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            {r.basis}
          </div>

          <div className="mm-tear-key">highlights</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            <ul className="mm-tear-strikes">
              {r.strikes.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="mm-tear-key">instruments</div>
          <div className="mm-tear-instr">
            {r.instr.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          <div className="mm-tear-key">size · tenor</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            {r.size} · {r.range}
          </div>

          {r.url && (
            <>
              <div className="mm-tear-key">venue</div>
              <div className="mm-tear-val">
                <a
                  className="mm-tear-link mm-mono"
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={expanded ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                >
                  {r.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}{" "}
                  ↗
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function PositionBook() {
  // The flagship credential opens pre-expanded so the strongest proof is
  // visible without a click.
  const [expanded, setExpanded] = React.useState<string | null>("gs");
  const meta = POSITIONS.filter((p) => p.side === "META");
  const open = POSITIONS.filter((p) => p.side === "OPEN");
  const closed = POSITIONS.filter((p) => p.side === "CLOSED");

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id));
  };

  let idx = 0;
  const renderRow = (r: Position) => (
    <PositionRow
      key={r.id}
      r={r}
      i={idx++}
      expanded={expanded === r.id}
      onToggle={() => toggle(r.id)}
    />
  );

  return (
    <section id="position-book" className="mt-16">
      <div className="mm-watch">
        <SectionMarker>Position Book · click to expand tear sheet</SectionMarker>
      </div>
      <div className="mt-8 mm-traj">
        <div className="mm-pos-group-label mm-mono">Open Positions</div>
        {open.map(renderRow)}
        <div className="mm-pos-group-label mm-mono">Closed Positions</div>
        {closed.map(renderRow)}
        {meta.length > 0 && (
          <>
            <div className="mm-pos-group-label mm-mono">
              Meta · the art behind this site
            </div>
            {meta.map(renderRow)}
          </>
        )}
      </div>
    </section>
  );
}

/* Layout is deterministic (pure data → rects), so compute once at module
   scope — identical on server and client, no hydration drift. */
const HEAT_TILES = computeHeatmap();

function Holdings() {
  return (
    <section id="holdings">
      <div className="mm-watch">
        <SectionMarker>Holdings · stack as sector heatmap</SectionMarker>
      </div>
      <div className="mt-8 mm-watch">
        <div
          className="mm-heat"
          role="list"
          aria-label="Tech stack heatmap — tile size is years of experience, color intensity is current allocation"
        >
          {HEAT_TILES.map((t, i) => {
            // Tile area as % of the map — decides how much label fits.
            const area = (t.w * t.h) / 100;
            const size = area >= 6 ? "lg" : area >= 2 ? "md" : "sm";
            return (
              <div
                key={t.tkr}
                role="listitem"
                className="mm-heat-tile"
                data-mark={t.mark}
                data-size={size}
                title={`${t.tkr} — ${t.years}y on desk · ${t.wt}% of current allocation · ${t.mark}`}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  width: `${t.w}%`,
                  height: `${t.h}%`,
                  ["--heat" as string]: t.heat,
                  ["--mm-delay" as string]: `${i * 35}ms`,
                }}
              >
                <span className="mm-heat-tkr">{t.tkr}</span>
                <span className="mm-heat-meta">
                  {t.years}Y · {t.wt}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="mm-heat-legend mm-mono">
          <span>size = years on desk</span>
          <span>heat = current allocation</span>
          <span className="mm-heat-legend-live">live</span>
        </div>
      </div>
    </section>
  );
}

function MagneticCTA({
  href,
  children,
  onClick,
  external = true,
}: {
  href: string;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  external?: boolean;
}) {
  // Terminal buttons don't chase cursors — feedback is hover glow, arrow
  // slide, and press scale, all in CSS.
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="mm-cta"
      onClick={onClick}
    >
      <span>{children}</span>
      <span className="mm-cta-arrow" aria-hidden>
        →
      </span>
    </a>
  );
}

type CardProps = {
  chipColor: string;
  label: string;
  idx: number;
  children: ReactNode;
};

function Card({ chipColor, label, idx, children }: CardProps) {
  const number = String(idx + 1).padStart(2, "0");

  return (
    <div
      className="mm-watch"
      style={{ ["--mm-delay" as string]: `${idx * 90}ms` }}
    >
      <div className="mm-card" style={{ ["--accent" as string]: chipColor }}>
        <div className="mm-card-number mm-mono">{number}</div>
        <div className="mm-mono text-xs mm-chip" style={{ color: chipColor }}>
          {label}
        </div>
        <p className="mt-6 leading-relaxed" style={{ color: "var(--muted)" }}>
          {children}
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="mm-divider h-px w-full my-28"
      style={{ background: "var(--line)" }}
    />
  );
}

/* ── Trade ticket modal — email CTA confirmation ──────────── */

function TicketRow({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: "BUY" | "MKT" | "ACCENT";
}) {
  return (
    <div className="mm-ticket-row">
      <span className="mm-ticket-key">{k}</span>
      <span className="mm-ticket-val" data-side={accent}>
        {v}
      </span>
    </div>
  );
}

function TradeTicket({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const submitRef = useRef<HTMLAnchorElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = (document.activeElement as HTMLElement) ?? null;
    // Focus submit so Enter immediately fires the mailto.
    window.setTimeout(() => submitRef.current?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const handleSubmit = () => {
    // Close after the mailto fires so we don't lose focus mid-handoff.
    window.setTimeout(onClose, 80);
  };

  return (
    <div
      className="mm-ticket-overlay"
      data-open={open}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mm-ticket-title"
      aria-hidden={!open}
    >
      <div className="mm-ticket" onClick={(e) => e.stopPropagation()}>
        <div className="mm-ticket-head">
          <span id="mm-ticket-title" className="mm-ticket-title">
            Trade Ticket · MM.NYC
          </span>
          <button
            className="mm-ticket-close"
            type="button"
            aria-label="Close trade ticket"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mm-ticket-body">
          <TicketRow k="Side" v="BUY" accent="BUY" />
          <TicketRow k="Ticker" v="MM.NYC.HELLO" />
          <TicketRow k="Order Type" v="MARKET" accent="MKT" />
          <TicketRow k="Quantity" v="1 INTRO" />
          <TicketRow k="Limit Px" v="$0.00" />
          <TicketRow k="TIF" v="GTC" />
          <TicketRow k="Settlement" v="T+1 · NYC ↔ MIA" />
          <TicketRow k="Venue" v="hello@moshemalka.com" />
        </div>
        <div className="mm-ticket-foot">
          <span className="mm-ticket-hint">
            <kbd>Esc</kbd>Cancel
          </span>
          <a
            ref={submitRef}
            className="mm-ticket-submit"
            href="mailto:hello@moshemalka.com?subject=Hello%20%E2%80%94%20MM.NYC&body=%2F%2F%20fill%20at%20will%0A%0A"
            onClick={handleSubmit}
          >
            Submit Fill →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Cmd+K Bloomberg-style command terminal ────────────────── */

type TermCmd = {
  tkr: string;
  desc: string;
  match: string[];
  exec: () => void;
  closeAfter?: boolean;
};

function CmdTerminal({
  open,
  onClose,
  onOpenTicket,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTicket: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmds: TermCmd[] = useMemo(() => {
    // exec() only ever runs client-side (user action), so window is safe here.
    const scrollToId = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    };
    return [
      {
        tkr: "BOOK",
        desc: "Position book — open + closed positions",
        match: ["book", "positions", "position", "trading", "trad", "jobs", "career"],
        exec: () => scrollToId("position-book"),
      },
      {
        tkr: "STACK",
        desc: "Holdings — tech stack heatmap, size = tenor",
        match: ["stack", "holdings", "tech", "heatmap", "allocation", "languages"],
        exec: () => scrollToId("holdings"),
      },
      {
        tkr: "QNTN",
        desc: "Quentin Software → quentin.software",
        match: ["quentin", "qntn", "studio", "software", "qc"],
        exec: () =>
          window.open(
            "https://www.quentin.software/",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "ENERGY",
        desc: "Energy — what I'm interested in",
        match: ["energy", "interest", "leverage", "about"],
        exec: () => scrollToId("energy"),
      },
      {
        tkr: "MM.NYC",
        desc: "Hero — top of the page",
        match: ["mm", "top", "home", "hero", "moshe"],
        exec: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
      {
        tkr: "EMAIL",
        desc: "Open trade ticket → hello@moshemalka.com",
        match: ["email", "mail", "contact", "hello", "ticket", "buy", "hire"],
        exec: () => onOpenTicket(),
      },
      {
        tkr: "LI",
        desc: "LinkedIn → linkedin.com/in/moshenyc",
        match: ["li", "linkedin"],
        exec: () =>
          window.open(
            "https://www.linkedin.com/in/moshenyc/",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "GH",
        desc: "GitHub → github.com/moshejs",
        match: ["gh", "github", "code"],
        exec: () =>
          window.open(
            "https://github.com/moshejs",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "SO",
        desc: "Stack Overflow → users/7381252/moshe",
        match: ["so", "stack overflow", "stackoverflow", "answers"],
        exec: () =>
          window.open(
            "https://stackoverflow.com/users/7381252/moshe",
            "_blank",
            "noopener,noreferrer"
          ),
      },
    ];
  }, [onOpenTicket]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cmds;
    return cmds.filter(
      (c) =>
        c.tkr.toLowerCase().includes(q) ||
        c.match.some((m) => m.toLowerCase().includes(q))
    );
  }, [query, cmds]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIdx(0);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = filtered[activeIdx];
        if (!c) return;
        onClose();
        // Defer the action so the overlay tear-down doesn't steal focus
        // from a popup window or the trade-ticket modal that follows.
        window.setTimeout(() => c.exec(), 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIdx, onClose]);

  return (
    <div
      className="mm-term-overlay"
      data-open={open}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command terminal"
      aria-hidden={!open}
    >
      <div className="mm-term" onClick={(e) => e.stopPropagation()}>
        <div className="mm-term-input-row">
          <span className="mm-term-prompt" aria-hidden>
            {"<MM.NYC>"}
          </span>
          <input
            ref={inputRef}
            className="mm-term-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ticker or keyword — book, stack, email, gh"
            autoComplete="off"
            spellCheck={false}
            aria-label="Command query"
          />
          <span className="mm-term-go" aria-hidden>
            <kbd>↵</kbd>GO
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="mm-term-empty">
            No match · try BOOK · STACK · EMAIL · GH
          </div>
        ) : (
          <ul className="mm-term-list" role="listbox">
            {filtered.map((c, i) => (
              <li
                key={c.tkr}
                className="mm-term-item"
                data-active={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => {
                  onClose();
                  window.setTimeout(() => c.exec(), 60);
                }}
                role="option"
                aria-selected={i === activeIdx}
              >
                <span className="mm-term-tkr mm-mono">{c.tkr}</span>
                <span className="mm-term-desc">{c.desc}</span>
                <span className="mm-term-cmd mm-mono" aria-hidden>↵</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mm-term-foot">
          <span>
            <kbd>↑↓</kbd>nav
          </span>
          <span>
            <kbd>↵</kbd>execute
          </span>
          <span>
            <kbd>esc</kbd>close
          </span>
        </div>
      </div>
    </div>
  );
}

function FootNow({ onOpenTicket }: { onOpenTicket: () => void }) {
  return (
    <footer className="mm-foot mm-watch mt-16 pt-12 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div className="max-w-md">
          <SectionMarker>Now</SectionMarker>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Building. Open to engineering leadership roles that touch scale,
            capital, or AI — ideally all three.
          </p>
          <div className="mt-6 mm-pull">
            Build it right. Then scale it.
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4">
          <div className="flex flex-col items-start md:items-end gap-2">
            <MagneticCTA
              href="mailto:hello@moshemalka.com"
              external={false}
              onClick={(e) => {
                e.preventDefault();
                onOpenTicket();
              }}
            >
              <span className="mm-ordtype" data-type="MKT" aria-hidden>MKT</span>
              hello@moshemalka.com
            </MagneticCTA>
            <div className="mm-settle">
              T+1 · NYC Hours ·{" "}
              <a
                className="mm-hover-line"
                href="mailto:hello@moshemalka.com"
                style={{ color: "var(--muted)" }}
              >
                or plain email
              </a>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a
              className="mm-hover-line"
              href="https://www.quentin.software/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              <span className="mm-ordtype" data-type="PROP" aria-hidden>PROP</span>
              Quentin Software
            </a>
            <a
              className="mm-hover-line"
              href="https://www.linkedin.com/in/moshenyc/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              <span className="mm-ordtype" data-type="LMT" aria-hidden>LMT</span>
              LinkedIn
            </a>
            <a
              className="mm-hover-line"
              href="https://github.com/moshejs"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              <span className="mm-ordtype" data-type="GTC" aria-hidden>GTC</span>
              GitHub
            </a>
            <a
              className="mm-hover-line"
              href="https://stackoverflow.com/users/7381252/moshe"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              <span className="mm-ordtype" data-type="RFQ" aria-hidden>RFQ</span>
              Stack Overflow
            </a>
          </div>
        </div>
      </div>

      <div
        className="mt-12 pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] mm-mono"
        style={{ color: "var(--soft)", borderTop: "1px solid var(--line)" }}
      >
        <span>Moshe Malka · NYC ↔ MIA · 2026</span>
        <span>Engineering leader · TypeScript · Next.js · AI</span>
        <span>
          <kbd>⌘K</kbd> terminal
        </span>
      </div>
    </footer>
  );
}

export default function Home() {
  const [ticketOpen, setTicketOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Reveal-on-scroll for everything tagged .mm-watch
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".mm-watch");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Cmd+K (or Ctrl+K) — Bloomberg-style terminal palette.
  // We catch it globally and ignore when the user is in another input so
  // typing in any future field doesn't hijack their text.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isToggle) return;
      e.preventDefault();
      setTerminalOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`${sans.variable} ${mono.variable} mm-sans min-h-screen text-white relative overflow-hidden`}
    >
      {/* Static backdrop: chart paper + film grain. The terminal is flat
          and dry — the StatusPill owns the page's one pulse. */}
      <div className="mm-grain" aria-hidden />
      <GridPaper />

      <StatusPill />

      <TradeTicket
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
      />
      <CmdTerminal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onOpenTicket={() => {
          setTerminalOpen(false);
          window.setTimeout(() => setTicketOpen(true), 80);
        }}
      />

      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-L1ETKYXNV4"
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-L1ETKYXNV4');
        `}
      </Script>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta name="author" content="Moshe Malka" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="Moshe Malka" />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:image" content={SEO.ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Moshe Malka — Engineering Leader" />
        <meta property="og:locale" content="en_US" />
        <meta property="profile:first_name" content="Moshe" />
        <meta property="profile:last_name" content="Malka" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.ogImage} />
        <meta name="twitter:image:alt" content="Moshe Malka — Engineering Leader" />

        {/* Structured data — Person / WebSite / ProfilePage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </Head>

      <main className="mx-auto max-w-5xl px-6 relative z-10">

        {/* HERO */}
        <section className="pt-28 md:pt-36 pb-8 md:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-x-10 gap-y-8 items-start">
            <div className="mm-reveal mm-power-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/moshe.jpg"
                alt="Moshe Malka"
                width="300"
                height="400"
                loading="eager"
                decoding="async"
                // React 18 passes unknown lowercase attrs straight to the DOM;
                // the camelCase prop only exists in React 19 types.
                {...({ fetchpriority: "high" } as object)}
              />
            </div>
            <div>
              {/* Name + title lockup — the two facts every visitor came for,
                  at legible weight (not an 11px marker). */}
              <div className="mm-reveal">
                <p className="mm-mono text-sm md:text-base tracking-[0.14em] uppercase" style={{ color: "var(--ink)" }}>
                  Moshe Malka
                </p>
                <p className="mm-mono text-[11px] tracking-[0.18em] uppercase mt-1" style={{ color: "var(--muted)" }}>
                  Engineering Leader · New York City
                </p>
              </div>

              <HeroHeading />
            </div>
          </div>

          {/* Plain-English intro — answers who/what/where in one read. */}
          <p
            className="mm-reveal mm-delay-3 mt-10 max-w-3xl text-lg md:text-xl leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Engineering leader in New York City — writing software since 2008.
            Currently on Goldman Sachs&rsquo; Private Wealth platform;
            previously Peloton&rsquo;s e-commerce replatform, institutional
            bond trading at ICE, and HFT systems that filled arbitrage in
            26&nbsp;milliseconds. I lead teams, mentor engineers, and ship
            with AI.
          </p>

          <HeroStats />
        </section>

        <Divider />

        {/* GRID INTERSECTION */}
        <section className="mm-grid grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-20 text-xl">
          <Card chipColor="var(--lightning)" label="Trading" idx={0}>
            Arbitrage systems under 26ms. Real-time volatility across 40+
            exchanges. Infrastructure where milliseconds change outcomes.
          </Card>

          <Card chipColor="var(--z-blue)"    label="Institutional Finance" idx={1}>
            Portfolio systems at Goldman. Interfaces that brokers and
            high-net-worth clients rely on. Precision, governance,
            responsibility.
          </Card>

          <Card chipColor="var(--crystal)"   label="Real Estate" idx={2}>
            Operational platforms for coworking and physical space. Software
            that touches real-world infrastructure.
          </Card>

          <Card chipColor="var(--steel)"     label="Modern Web & AI" idx={3}>
            NextJS, React, LangChain, GPT-4. Tools that compress iteration
            cycles. Product built fast, but built right.
          </Card>
        </section>

        <Divider />

        {/* POSITION BOOK */}
        <PositionBook />

        <Divider />

        {/* HOLDINGS — stack as sector heatmap */}
        <Holdings />

        <Divider />

        {/* PERSONAL ENERGY */}
        <section id="energy" className="max-w-3xl pb-20 mm-watch">
          <SectionMarker>Energy</SectionMarker>

          <p
            className="mt-8 text-2xl leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            I&rsquo;m interested in leverage — the kind you get from{" "}
            <span className="mm-hover-line">code that moves capital</span>,{" "}
            <span className="mm-hover-line">systems that scale without drama</span>,
            and <span className="mm-hover-line">teams that outlast their founders</span>.
            <br /><br />
            Eighteen years in, the pattern is consistent: I join where the
            stakes are measured in milliseconds or millions, build the thing,
            raise the people, and leave the platform stronger than the
            slide deck said it would be. Lately that means putting AI to work
            inside real products — not demos.
          </p>
        </section>

        <FootNow onOpenTicket={() => setTicketOpen(true)} />

      </main>
    </div>
  );
}
