// Writes public/sitemap.xml at build time (runs before `next build`).
//
// The indexable pages: home, the Study, the product catalogue and one page per
// product (from lib/products.ts, loaded with Node's built-in type stripping);
// everything else is the 404 or /api/*.
// Each page's <lastmod> is the date of the newest commit touching the files
// that render it, so it moves only when the page actually changes. Falls back
// to today when git history isn't available.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PRODUCTS } from "../lib/products.ts";

const SITE = "https://moshemalka.com";

const PAGES = [
  {
    path: "/",
    priority: "1.0",
    sources: ["pages/index.tsx", "lib/portfolio.ts", "components/watch/scene.ts", "styles/theme.css"],
  },
  {
    path: "/study",
    priority: "0.5",
    sources: ["pages/study", "components/study", "data/library.json"],
  },
  {
    path: "/products",
    priority: "0.6",
    sources: ["pages/products/index.tsx", "components/products", "lib/products.ts"],
  },
  ...PRODUCTS.map((p) => ({
    path: `/products/${p.slug}`,
    priority: "0.5",
    sources: ["pages/products/[slug].tsx", "components/products", "lib/products.ts"],
  })),
];

const root = fileURLToPath(new URL("..", import.meta.url));

function lastmod(sources) {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...sources], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (iso) return iso.slice(0, 10);
  } catch {
    // No git (or no history): use the build date.
  }
  return new Date().toISOString().slice(0, 10);
}

const urls = PAGES.map(
  (p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${lastmod(p.sources)}</lastmod>
    <priority>${p.priority}</priority>
  </url>`,
).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
console.log(`sitemap.xml: ${PAGES.length} URLs`);
