import Head from "next/head";
import Link from "next/link";

/* Shared frame for /products and /products/<slug>: head tags, the top bar,
   breadcrumbs and the footer, in the homepage's visual language. */

export const SITE_URL = "https://moshemalka.com";
export const EMAIL = "hello@moshemalka.com";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const OG_ALT = "Moshe Malka — Founder & principal engineer, Quentin.Code";

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const Arrow = (
  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false" className="c-arrow">
    <path d="M6 14L14 6M8 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/** The Person and WebSite nodes every page repeats, since each is read alone. */
export const SITE_NODES = [
  { "@type": "Person", "@id": PERSON_ID, name: "Moshe Malka", url: `${SITE_URL}/` },
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "Moshe Malka",
    publisher: { "@id": PERSON_ID },
  },
];

export type Crumb = { name: string; path: string };

export function breadcrumbNode(id: string, crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

export function PageHead({
  title,
  description,
  path,
  structuredData,
}: {
  title: string;
  description: string;
  path: string;
  structuredData: object;
}) {
  const url = `${SITE_URL}${path}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="author" content="Moshe Malka" />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Moshe Malka" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_ALT} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:image:alt" content={OG_ALT} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </Head>
  );
}

export function TopBar() {
  return (
    <header className="c-nav">
      <div className="c-nav__inner">
        <Link className="c-nav__mark" href="/">
          Moshe Malka
        </Link>
        <nav className="c-nav__links" aria-label="Site">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/study">Library</Link>
        </nav>
        <a className="c-btn c-btn--primary c-btn--sm" href={`mailto:${EMAIL}`}>
          Email me
        </a>
      </div>
    </header>
  );
}

/** Visible breadcrumbs; the last crumb is the current page. */
export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="c-crumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c, i) =>
          i === crumbs.length - 1 ? (
            <li key={c.path}>
              <span aria-current="page">{c.name}</span>
            </li>
          ) : (
            <li key={c.path}>
              <Link href={c.path}>{c.name}</Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

/** The one contact line: email, the channel the site already uses. */
export function AskLine({ about }: { about: string }) {
  return (
    <p className="c-ask">
      Ask me about {about}:{" "}
      <a href={`mailto:${EMAIL}`} className="c-ask__link">
        {EMAIL}
      </a>
    </p>
  );
}

export function Footer() {
  return (
    <footer className="c-foot c-prodfoot">
      <p>Moshe Malka · New York City</p>
      <ul className="c-links" aria-label="More">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/products">All products</Link>
        </li>
        <li>
          <Link href="/study">The Study</Link>
        </li>
      </ul>
    </footer>
  );
}
