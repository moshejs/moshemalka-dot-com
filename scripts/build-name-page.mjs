// Writes public/name/index.html, the page served at https://name.moshemalka.com
// (next.config.js rewrites that host's root to it).
//
// "The Name Moshe" is built elsewhere as an HTML fragment (title, font links,
// inline <style> and <script> blocks, body content). This script wraps the
// bundled fragment into a full standalone document:
//   - <head> with charset, viewport, description, canonical, Open Graph and
//     Twitter tags, the site's favicons and color-scheme;
//   - a few base styles the fragment's original host used to supply;
//   - @font-face rules for the self-hosted fonts in public/name/fonts/, in
//     place of the Google Fonts links (the CSP allows fonts from 'self' only);
//   - one line linking back to moshemalka.com after the Sources chapter.
// The page's own CSS, scripts and content pass through unchanged.
//
// Usage: node scripts/build-name-page.mjs <bundled-fragment.html> [out.html]
//
// Not part of `yarn build`: the source lives outside this repo, so the output
// is committed. Fonts are unmodified woff2 subsets from the Fontsource npm
// packages named in public/name/fonts/LICENSE.txt.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [src, outArg] = process.argv.slice(2);
if (!src) {
  console.error("usage: node scripts/build-name-page.mjs <bundled-fragment.html> [out.html]");
  process.exit(2);
}
const OUT = outArg ?? fileURLToPath(new URL("../public/name/index.html", import.meta.url));
const FONT_DIR = fileURLToPath(new URL("../public/name/fonts/", import.meta.url));

const URL_ = "https://name.moshemalka.com/";
const TITLE = "The Name Moshe";
const DESCRIPTION =
  "An interactive investigation into where the name Moshe comes from: weigh the Hebrew and Egyptian theories, compare the sounds, read the manuscripts and set your own odds.";

/* ── Fonts ──────────────────────────────────────────────────────────────
   Unicode ranges are Fontsource's (the same subsets Google Fonts serves).
   Faces that share a family also share weight and style descriptors, so the
   browser treats them as one font split by unicode-range. */
const R = {
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  latinExt:
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
  greek: "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
  cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  cyrillicExt: "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
  hebrew: "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F",
  hieroglyphs: "U+13000-13455,U+13460-143FA",
  syriac:
    "U+0303-0304,U+0307-0308,U+030A,U+0320,U+0323-0325,U+032D-032E,U+0330-0331,U+060C,U+061B-061C,U+061F,U+0621,U+0640,U+064B-0655,U+0660-066C,U+0670,U+0700-074F,U+0860-086A,U+1DF8,U+1DFA,U+200C-200F,U+25CC,U+2670-2671",
  coptic:
    "U+0300-0302,U+0304-0305,U+0307-0308,U+0311,U+0323,U+033F,U+035E,U+0361,U+0374-0375,U+03E2-03EF,U+1DCD,U+2010,U+2053,U+2056,U+2058-2059,U+25CC,U+2C80-2CFF,U+2E17,U+2E33-2E34,U+FE24-FE26,U+102E0-102FB",
  ethiopic: "U+030E,U+1200-1399,U+2D80-2DDE,U+AB01-AB2E,U+1E7E0-1E7E6,U+1E7E8-1E7EB,U+1E7ED-1E7EE,U+1E7F0-1E7FE",
  arabic: "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC",
  armenian: "U+0308,U+0530-058F,U+2010,U+2024,U+25CC,U+FB13-FB17",
};
// The page's body font is "Source Serif 4", Georgia, serif. Script blocks
// only (no shared marks or punctuation), so these never take a character
// that Source Serif 4 itself covers.
const BODY_FALLBACK = {
  armenian: "U+0530-058F,U+FB13-FB17",
  syriac: "U+0700-074F,U+0860-086A",
  arabic: "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFC",
  coptic: "U+2C80-2CFF",
  ethiopic: "U+1200-139F,U+2D80-2DDF,U+AB00-AB2F",
};

const face = (family, file, range, { weight = "400", style = "normal" } = {}) => ({ family, file, range, weight, style });
const SS = { weight: "200 900" };
const SSI = { weight: "200 900", style: "italic" };
const FACES = [
  face("Gloock", "gloock-latin-ext-400-normal.woff2", R.latinExt),
  face("Gloock", "gloock-latin-400-normal.woff2", R.latin),

  // Script fallbacks first: for any overlap, later faces win.
  face("Source Serif 4", "noto-serif-armenian-armenian-wght-normal.woff2", BODY_FALLBACK.armenian, SS),
  face("Source Serif 4", "noto-sans-syriac-syriac-400-normal.woff2", BODY_FALLBACK.syriac, SS),
  face("Source Serif 4", "noto-naskh-arabic-arabic-wght-normal.woff2", BODY_FALLBACK.arabic, SS),
  face("Source Serif 4", "noto-sans-coptic-coptic-400-normal.woff2", BODY_FALLBACK.coptic, SS),
  face("Source Serif 4", "noto-sans-ethiopic-ethiopic-wght-normal.woff2", BODY_FALLBACK.ethiopic, SS),
  face("Source Serif 4", "source-serif-4-cyrillic-ext-opsz-normal.woff2", R.cyrillicExt, SS),
  face("Source Serif 4", "source-serif-4-cyrillic-opsz-normal.woff2", R.cyrillic, SS),
  face("Source Serif 4", "source-serif-4-greek-opsz-normal.woff2", R.greek, SS),
  face("Source Serif 4", "source-serif-4-latin-ext-opsz-normal.woff2", R.latinExt, SS),
  face("Source Serif 4", "source-serif-4-latin-opsz-normal.woff2", R.latin, SS),
  face("Source Serif 4", "source-serif-4-latin-ext-opsz-italic.woff2", R.latinExt, SSI),
  face("Source Serif 4", "source-serif-4-latin-opsz-italic.woff2", R.latin, SSI),

  face("IBM Plex Mono", "ibm-plex-mono-latin-ext-400-normal.woff2", R.latinExt),
  face("IBM Plex Mono", "ibm-plex-mono-latin-400-normal.woff2", R.latin),
  face("IBM Plex Mono", "ibm-plex-mono-latin-ext-500-normal.woff2", R.latinExt, { weight: "500" }),
  face("IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", R.latin, { weight: "500" }),

  face("Frank Ruhl Libre", "frank-ruhl-libre-latin-ext-wght-normal.woff2", R.latinExt, { weight: "300 900" }),
  face("Frank Ruhl Libre", "frank-ruhl-libre-latin-wght-normal.woff2", R.latin, { weight: "300 900" }),
  face("Frank Ruhl Libre", "frank-ruhl-libre-hebrew-wght-normal.woff2", R.hebrew, { weight: "300 900" }),

  face("Noto Sans Egyptian Hieroglyphs", "noto-sans-egyptian-hieroglyphs-egyptian-hieroglyphs-400-normal.woff2", R.hieroglyphs),

  // Named directly in the scribe desk's font stacks.
  face("Noto Sans Syriac", "noto-sans-syriac-syriac-400-normal.woff2", R.syriac),
  face("Noto Naskh Arabic", "noto-naskh-arabic-arabic-wght-normal.woff2", R.arabic, { weight: "400 700" }),
  face("Noto Sans Coptic", "noto-sans-coptic-coptic-400-normal.woff2", R.coptic),
  face("Noto Sans Ethiopic", "noto-sans-ethiopic-ethiopic-wght-normal.woff2", R.ethiopic, { weight: "100 900" }),
];

for (const f of FACES) {
  if (!existsSync(FONT_DIR + f.file)) {
    console.error(`build-name-page: missing font public/name/fonts/${f.file}`);
    process.exit(1);
  }
}

const fontCss = FACES.map(
  (f) =>
    `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:swap;` +
    `src:url(/name/fonts/${f.file}) format("woff2");unicode-range:${f.range}}`,
).join("\n");

/* ── Fragment ───────────────────────────────────────────────────────── */
let html = readFileSync(src, "utf8");

const title = html.match(/<title>([\s\S]*?)<\/title>/i);
if (!title || title[1].trim() !== TITLE) {
  console.error(`build-name-page: expected <title>${TITLE}</title> in the fragment`);
  process.exit(1);
}
html = html.replace(title[0], "");

// Google Fonts links and preconnects: replaced by the self-hosted faces.
html = html.replace(/<link\b[^>]*\bhref=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "");
const remote = html.match(/<(?:link|script)\b[^>]*\b(?:href|src)=["'](?:https?:)?\/\/[^>]*>/i);
if (remote) {
  console.error(`build-name-page: the fragment still loads a remote resource: ${remote[0]}`);
  process.exit(1);
}

// Leading <style>/<link> blocks belong in <head>; the rest is the body.
const lead = html.match(/^(?:\s*(?:<style\b[\s\S]*?<\/style>|<link\b[^>]*>|<!--[\s\S]*?-->))*/i)[0];
const headStyles = lead.trim();
let body = html.slice(lead.length).trim();

const FOOT = '<p class="cap sources-foot">';
const footAt = body.indexOf(FOOT);
const footEnd = footAt < 0 ? -1 : body.indexOf("</p>", footAt);
if (footEnd < 0) {
  console.error("build-name-page: Sources footnote not found; update FOOT in this script");
  process.exit(1);
}
body =
  body.slice(0, footEnd + 4) +
  '\n    <p class="cap sources-foot"><a href="https://moshemalka.com/">moshemalka.com</a></p>' +
  body.slice(footEnd + 4);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const doc = `<!doctype html>
<!-- Generated by scripts/build-name-page.mjs from the bundled "The Name Moshe" page. Do not edit by hand. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="${esc(DESCRIPTION)}">
<link rel="canonical" href="${URL_}">
<meta name="author" content="Moshe Malka">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Moshe Malka">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${esc(DESCRIPTION)}">
<meta property="og:url" content="${URL_}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${esc(DESCRIPTION)}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
<style>
${fontCss}
</style>
${headStyles}
</head>
<body>
${body}
</body>
</html>
`;

writeFileSync(OUT, doc);
console.log(`build-name-page: wrote ${OUT} (${(Buffer.byteLength(doc) / 1024).toFixed(1)} KB, ${FACES.length} font faces)`);
