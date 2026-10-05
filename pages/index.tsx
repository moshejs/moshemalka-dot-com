import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import {
  PACKAGES,
  PACKAGE_GROUPS,
  ROLES,
  TOOLS,
  careerYears,
  formatRange,
  formatTenure,
  tenureMonths,
  type Role,
} from "@/lib/portfolio";
import { Dial } from "@/components/Dial";

/**
 * Moshe Malka — product-grade.
 *
 * A software person presented the way the best dev-tool products present
 * themselves: crisp, quiet, high-finish UI where the work (shipped code, open
 * source, a studio) is the product. Milgauss night palette; the live dial is
 * the hero's product shot.
 */


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

const EMAIL = "hello@moshemalka.com";
const LINKEDIN = "https://www.linkedin.com/in/moshenyc/";
const GITHUB = "https://github.com/moshejs";
const STUDIO = "https://quentin.software";

/* ── Icons: authored, one 1.5 stroke ───────────────────────────────── */

const Icon = {
  copy: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <rect x="6.5" y="6.5" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 3.5h-8a2 2 0 0 0-2 2v8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false" className="c-arrow">
      <path d="M6 14L14 6M8 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" className="c-chevron">
      <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

/* ── Copy-to-clipboard with a confirmed state ──────────────────────── */

function CopyButton({
  text,
  label,
  srDone,
  className,
}: {
  text: string;
  label: React.ReactNode;
  srDone: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={className} onClick={copy} data-copied={copied}>
      {copied ? Icon.check : Icon.copy}
      <span>{copied ? "Copied" : label}</span>
      <span className="c-sr" aria-live="polite">
        {copied ? srDone : ""}
      </span>
    </button>
  );
}

/* ── Work ──────────────────────────────────────────────────────────── */

function RoleRow({
  role,
  open,
  onToggle,
  months,
  maxMonths,
}: {
  role: Role;
  open: boolean;
  onToggle: () => void;
  months: number;
  maxMonths: number;
}) {
  const panelId = `role-${role.id}`;
  return (
    <li className="c-role" data-open={open}>
      <h3 className="c-role__head">
        <button
          type="button"
          className="c-role__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="c-role__main">
            <span className="c-role__company">{role.company}</span>
            <span className="c-role__line">{role.role}</span>
          </span>
          <span className="c-role__when">
            <span className="c-role__dates">{formatRange(role.start, role.end)}</span>
            <span className="c-role__tenure">
              <span className="c-role__track" aria-hidden="true">
                <span
                  className="c-role__bar"
                  style={{ "--w": `${Math.max(6, Math.round((months / maxMonths) * 100))}%` } as React.CSSProperties}
                />
              </span>
              <span>{formatTenure(months)}</span>
            </span>
          </span>
          {Icon.chevron}
          <span className="c-sr">{open ? "Hide details" : "Show details"}</span>
        </button>
      </h3>
      <div className="c-role__panel" id={panelId} hidden={!open}>
        <p className="c-role__summary">{role.summary}</p>
        <ul className="c-role__highlights">
          {role.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <ul className="c-chips" aria-label="Tools">
          {role.tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {role.link && (
          <a className="c-textlink" href={role.link.href} target="_blank" rel="noopener noreferrer">
            {role.link.label} {Icon.arrow}
          </a>
        )}
      </div>
    </li>
  );
}

function Work({ asOf }: { asOf: number }) {
  const tenure = (r: Role) => tenureMonths(r.start, r.end, new Date(asOf));
  const maxMonths = Math.max(...ROLES.map(tenure));
  const [openId, setOpenId] = useState<string | null>(ROLES[0].id);
  return (
    <section className="c-section" id="work" aria-labelledby="work-h">
      <div className="c-sechead">
        <h2 id="work-h" className="c-h2">
          Work
        </h2>
        <p className="c-secmeta">
          {ROLES.length} roles · {formatRange(ROLES[ROLES.length - 1].start, null)}
        </p>
      </div>
      <ol className="c-panel c-roles">
        {ROLES.map((role) => (
          <RoleRow
            key={role.id}
            role={role}
            open={openId === role.id}
            onToggle={() => setOpenId((cur) => (cur === role.id ? null : role.id))}
            months={tenure(role)}
            maxMonths={maxMonths}
          />
        ))}
      </ol>
    </section>
  );
}

/* ── Open source ───────────────────────────────────────────────────── */

// Verbatim from the 32nds README.
function FeaturedPackage() {
  return (
    <figure className="c-panel c-feature">
      <div className="c-feature__copy">
        <p className="c-feature__name">32nds</p>
        <p className="c-feature__text">
          Treasuries don&rsquo;t trade in decimals. A 10-year note is quoted like{" "}
          <code>105-16+</code>, and npm had nothing that could read a price the way the market
          writes it. So I wrote it: exact, because Treasury fractions are powers of two.
        </p>
        <CopyButton
          className="c-install"
          text="npm install 32nds"
          srDone="Install command copied"
          label={
            <>
              <span className="c-install__prompt" aria-hidden="true">
                $
              </span>{" "}
              npm install 32nds
            </>
          }
        />
      </div>
      <pre className="c-code" aria-label="Example usage of 32nds">
        <code>
          <span className="tok-k">import</span> <span className="tok-p">{"{"}</span>
          {"\n  "}parsePrice<span className="tok-p">,</span> formatPrice<span className="tok-p">,</span>{" "}
          tickValue<span className="tok-p">,</span>
          {"\n"}
          <span className="tok-p">{"}"}</span> <span className="tok-k">from</span>{" "}
          <span className="tok-s">&quot;32nds&quot;</span>
          <span className="tok-p">;</span>
          {"\n\n"}
          <span className="tok-f">parsePrice</span>
          <span className="tok-p">(</span>
          <span className="tok-s">&quot;105-16+&quot;</span>
          <span className="tok-p">);</span>
          {"       "}
          <span className="tok-c">{"// 105.515625"}</span>
          {"\n"}
          <span className="tok-f">formatPrice</span>
          <span className="tok-p">(</span>
          <span className="tok-n">99.109375</span>
          <span className="tok-p">);</span>
          {"     "}
          <span className="tok-c">{'// "99-03+"'}</span>
          {"\n"}
          <span className="tok-f">tickValue</span>
          <span className="tok-p">(</span>
          <span className="tok-n">1_000_000</span>
          <span className="tok-p">);</span>
          {"     "}
          <span className="tok-c">{"// 312.50"}</span>
        </code>
      </pre>
    </figure>
  );
}

function OpenSource() {
  return (
    <section className="c-section" id="open-source" aria-labelledby="os-h">
      <div className="c-sechead">
        <h2 id="os-h" className="c-h2">
          Open source
        </h2>
        <p className="c-secmeta">{PACKAGES.length} packages on npm · zero dependencies</p>
      </div>
      <p className="c-lede">
        Typed TypeScript libraries for fixed-income math, public financial data and Hebrew text,
        each tested against published reference values.
      </p>
      <FeaturedPackage />
      <div className="c-pkggroups">
        {PACKAGE_GROUPS.map((g) => (
          <div className="c-pkggroup" key={g}>
            <h3 className="c-h3">{g}</h3>
            <ul className="c-pkgs">
              {PACKAGES.filter((p) => p.group === g).map((p) => (
                <li key={p.name} className="c-pkg">
                  <a
                    className="c-pkg__name"
                    href={`https://www.npmjs.com/package/${p.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {p.name}
                    {Icon.arrow}
                  </a>
                  <p className="c-pkg__summary">{p.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <a className="c-textlink" href={GITHUB} target="_blank" rel="noopener noreferrer">
        All repositories on GitHub {Icon.arrow}
      </a>
    </section>
  );
}

/* ── Studio ────────────────────────────────────────────────────────── */

function Studio() {
  const studio = ROLES.find((r) => r.id === "quentin");
  return (
    <section className="c-section" id="studio" aria-labelledby="studio-h">
      <div className="c-panel c-studio">
        <div className="c-studio__copy">
          <h2 id="studio-h" className="c-h2">
            Quentin Code
          </h2>
          <p className="c-studio__text">
            My studio. I build custom software for businesses: AI prototypes that ship, full web
            builds, and fractional CTO work for early-stage teams.
          </p>
          <a className="c-btn c-btn--secondary" href={STUDIO} target="_blank" rel="noopener noreferrer">
            Hire the studio {Icon.arrow}
          </a>
        </div>
        <ul className="c-studio__work" aria-label="Recent studio work">
          {studio?.highlights.slice(0, 3).map((h) => {
            const [client, ...rest] = h.split(": ");
            return (
              <li key={h}>
                <span className="c-studio__client">{client}</span>
                <span className="c-studio__what">
                  {rest.join(": ").replace(/^./, (c) => c.toUpperCase())}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
  "Nineteen", "Twenty", "Twenty-one", "Twenty-two", "Twenty-three", "Twenty-four", "Twenty-five"];

type Props = { asOf: number; revision: string | null };

// Freeze "now" at build time so server and client render the same tenures,
// and record the commit the page was built from.
export async function getStaticProps() {
  let revision: string | null = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  if (!revision) {
    try {
      const { execSync } = await import("child_process");
      revision = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      revision = null;
    }
  }
  const props: Props = { asOf: Date.now(), revision };
  return { props };
}

export default function Home({ asOf, revision }: Props) {
  const years = careerYears(asOf);
  const yearsWord = NUMBER_WORDS[years] ?? String(years);

  return (
    <>
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
        <meta name="theme-color" content="#070b14" />
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

      <header className="c-nav">
        <div className="c-nav__inner">
          <a className="c-nav__mark" href="#top">
            Moshe Malka
          </a>
          <nav className="c-nav__links" aria-label="Sections">
            <a href="#work">Work</a>
            <a href="#open-source">Open source</a>
            <a href="#studio">Studio</a>
          </nav>
          <a className="c-btn c-btn--primary c-btn--sm" href={`mailto:${EMAIL}`}>
            Email me
          </a>
        </div>
      </header>

      <main className="c-page" id="top">
        <section className="c-hero" aria-labelledby="name">
          <div className="c-hero__copy">
            <h1 id="name" className="c-name">
              Moshe Malka
            </h1>
            <p className="c-tagline">
              Engineering leader in New York City, writing software since 2008.
            </p>
            <p className="c-intro">
              Today I&rsquo;m on Goldman Sachs&rsquo; Private Wealth platform. Before that I led
              Peloton&rsquo;s e&#8209;commerce replatform, built institutional bond trading at ICE,
              and wrote high&#8209;frequency arbitrage that filled in 26&nbsp;milliseconds. I lead
              teams, mentor engineers, ship with AI, and run Quentin Code, a studio that builds
              custom software for businesses.
            </p>
            <div className="c-ctas">
              <a className="c-btn c-btn--primary" href={`mailto:${EMAIL}`}>
                Email me
              </a>
              <CopyButton
                className="c-btn c-btn--ghost c-copy"
                text={EMAIL}
                srDone="Email address copied to clipboard"
                label={EMAIL}
              />
            </div>
            <ul className="c-links" aria-label="Elsewhere">
              <li>
                <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                  LinkedIn {Icon.arrow}
                </a>
              </li>
              <li>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                  GitHub {Icon.arrow}
                </a>
              </li>
              <li>
                <a href={STUDIO} target="_blank" rel="noopener noreferrer">
                  Quentin Code {Icon.arrow}
                </a>
              </li>
            </ul>
          </div>

          <figure className="c-shot">
            <div className="c-shot__stage">
              <Dial />
            </div>
            <div className="c-shot__portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/moshe.jpg"
                alt="Moshe Malka"
                width="300"
                height="400"
                loading="eager"
                decoding="async"
                {...({ fetchpriority: "high" } as object)}
              />
            </div>
            <figcaption className="c-shot__caption">
              <span className="c-live" aria-hidden="true" />
              Live New York time
            </figcaption>
          </figure>
        </section>

        <Work asOf={asOf} />
        <OpenSource />
        <Studio />

        <section className="c-section c-about" aria-labelledby="about-h">
          <div className="c-about__text">
            <h2 id="about-h" className="c-h2">
              What I&rsquo;m after
            </h2>
            <p>
              I&rsquo;m interested in leverage: the kind you get from code that moves capital,
              systems that scale without drama, and teams that outlast their founders.
            </p>
            <p>
              {yearsWord} years in, the pattern is consistent. I join where the stakes are
              measured in milliseconds or millions, build the thing, raise the people, and leave
              the platform stronger than the slide deck said it would be. Lately that means
              putting AI to work inside real products, not demos.
            </p>
          </div>
          <div className="c-about__stack">
            <h3 className="c-h3">What I build with</h3>
            <ul className="c-chips">
              {TOOLS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="c-section c-close" aria-labelledby="close-h">
          <div className="c-panel c-close__cta">
            <h2 id="close-h" className="c-h2 c-close__title">
              Get in touch
            </h2>
            <p className="c-close__text">
              Write about your team, your project, or the software you need built.
            </p>
            <div className="c-ctas">
              <a className="c-btn c-btn--primary" href={`mailto:${EMAIL}`}>
                Email me
              </a>
              <a className="c-btn c-btn--ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                LinkedIn {Icon.arrow}
              </a>
              <a className="c-btn c-btn--ghost" href={STUDIO} target="_blank" rel="noopener noreferrer">
                Hire the studio {Icon.arrow}
              </a>
            </div>
          </div>
          <div className="c-foot">
            <p>© {new Date(asOf).getFullYear()} Moshe Malka · New York City</p>
            <ul className="c-links" aria-label="Profiles">
              <li>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                  GitHub {Icon.arrow}
                </a>
              </li>
              <li>
                <a href="https://stackoverflow.com/users/7381252/moshe" target="_blank" rel="noopener noreferrer">
                  Stack Overflow {Icon.arrow}
                </a>
              </li>
              <li>
                <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                  LinkedIn {Icon.arrow}
                </a>
              </li>
            </ul>
            <p className="c-foot__build">
              Built with Next.js{revision ? ` · ${revision}` : ""}
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
