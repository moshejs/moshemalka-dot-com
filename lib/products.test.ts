import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { CATALOGUE, GROUPS, PRODUCTS, productBySlug, productsInGroup, type Product } from "./products";

// Past or outside employers must never be named or hinted at in product copy:
// the same terms quentin.software guards against. This repo is public, so the
// terms are kept as SHA-256 hashes (with their lengths) rather than spelled
// out; every substring of that length in the lowercased copy is hashed and
// compared, which matches like a case-insensitive substring search.
const EMPLOYER_HASHES: [number, string][] = [
  [7, "1bf26a0f3f93196133aa4e6e2b4104e1355431f55d58c914226c319633d2ca96"],
  [5, "f4c8478ed1e9d21acc43c3a3217b258eb6f0c47bfb05e4276da9d1d78deea920"],
  [15, "cef1f56ed351559aa428df5952e38ac846fef992fe94f54c191836035c62aa26"],
  [11, "3423b099956ab4e70d2a1ae3bd99027edb95264c1572d573539204f244399a02"],
  [7, "459090e9ac2fc23c6a4c10bcc9cd8e9a2df99784220270238c4a190e48257e2c"],
  [9, "423ff4d60a2e30e4387725d016c3209116a11775e144c46ca07f88a9d5e26168"],
  [9, "3805e7fdae6e5df08602a75ba667f0590265ecd36390b9644c6627fcb2f17b99"],
  [11, "0a655d98dc39098d8ff4f82f5409e178f5861822e1caae3a22c7b337199124a5"],
  [4, "bee10fcea1e42a2e80fbdb199b1a45b35a5ceb0fbfb035dd6ca008813c914c71"],
  [6, "9d4439cabfb702a5c90388fa8848545b11daf74eddc8ca6d68bfaecca5912761"],
];

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** The first banned term found in `text` (as its matching substring), or null. */
function employerIn(text: string): string | null {
  const t = text.toLowerCase();
  for (const [len, hash] of EMPLOYER_HASHES) {
    for (let i = 0; i + len <= t.length; i++) {
      if (sha256(t.slice(i, i + len)) === hash) return t.slice(i, i + len);
    }
  }
  return null;
}

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

const strings = (p: Product) =>
  Object.entries(p).filter((e): e is [string, string] => typeof e[1] === "string");

const read = (f: string) => readFileSync(join(__dirname, "..", "public", f), "utf8");

describe("PRODUCTS", () => {
  it("has at least one product, each in a known group", () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
    for (const p of PRODUCTS) expect(GROUPS).toContain(p.group);
    for (const g of GROUPS) expect(productsInGroup(g).length).toBeGreaterThan(0);
  });

  it("uses unique, URL-safe slugs and unique names", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(PRODUCTS.map((p) => p.name)).size).toBe(PRODUCTS.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it.each(PRODUCTS.map((p) => [p.slug, p] as const))("%s has a name, tagline, summary, status and link", (_, p) => {
    for (const key of ["name", "tagline", "summary", "status", "linkLabel", "title", "description"] as const) {
      expect(p[key].trim().length).toBeGreaterThan(0);
    }
    expect(p.summary.length).toBeGreaterThanOrEqual(60);
  });

  it.each(PRODUCTS.map((p) => [p.slug, p] as const))("%s links only to https URLs", (_, p) => {
    for (const key of ["url", "statusSource", "caseStudy"] as const) {
      const v = p[key];
      if (v === undefined) continue;
      expect(new URL(v).protocol).toBe("https:");
    }
  });

  it.each(PRODUCTS.map((p) => [p.slug, p] as const))(
    `%s keeps its title within ${TITLE_MAX} and description within ${DESCRIPTION_MAX} characters`,
    (_, p) => {
      expect(p.title.length).toBeLessThanOrEqual(TITLE_MAX);
      expect(p.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(p.description.length).toBeGreaterThanOrEqual(70);
      expect(p.description).not.toBe(p.summary);
    },
  );

  it("gives every page a distinct title and description", () => {
    const titles = [CATALOGUE.title, ...PRODUCTS.map((p) => p.title)];
    const descriptions = [CATALOGUE.description, ...PRODUCTS.map((p) => p.description)];
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(CATALOGUE.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(CATALOGUE.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it.each(PRODUCTS.map((p) => [p.slug, p] as const))("%s never names a past or outside employer", (_, p) => {
    for (const [key, value] of strings(p)) {
      expect({ key, match: employerIn(value) }).toEqual({ key, match: null });
    }
  });

  it("never names a past or outside employer in the catalogue's own copy", () => {
    expect(employerIn(CATALOGUE.title)).toBeNull();
    expect(employerIn(CATALOGUE.description)).toBeNull();
  });

  // Guards the guard: the hashed list must still catch a term in running text.
  it("detects a banned term in any case, inside other text", () => {
    expect(employerIn("A note on Cbre-style offices")).toBe("cbre");
    expect(employerIn("Learn Arabic through Spanish")).toBeNull();
  });

  it("does not quote prices, user counts or ratings", () => {
    for (const p of PRODUCTS) {
      for (const [key, value] of strings(p)) {
        if (key === "url" || key === "statusSource" || key === "caseStudy") continue;
        expect({ key, value }).not.toEqual({ key, value: expect.stringMatching(/[$€£]\s?\d/) });
        expect({ key, value }).not.toEqual({
          key,
          value: expect.stringMatching(/\b\d[\d,.]*\+?\s*(users|downloads|customers|subscribers|stars)\b/i),
        });
      }
    }
  });

  it("only gives application fields to applications", () => {
    for (const p of PRODUCTS) {
      if (p.schemaType === "CreativeWork") {
        expect(p.applicationCategory).toBeUndefined();
        expect(p.operatingSystem).toBeUndefined();
      } else {
        expect(p.applicationCategory).toBeTruthy();
        expect(p.operatingSystem).toBeTruthy();
      }
    }
  });

  it("finds products by slug", () => {
    expect(productBySlug(PRODUCTS[0].slug)).toBe(PRODUCTS[0]);
    expect(productBySlug("no-such-product")).toBeUndefined();
  });
});

describe("crawl files", () => {
  it("llms.txt lists the catalogue and every product page", () => {
    const llms = read("llms.txt");
    expect(llms).toContain(`https://moshemalka.com${CATALOGUE.path}`);
    for (const p of PRODUCTS) expect(llms).toContain(`https://moshemalka.com/products/${p.slug}`);
  });

  // public/sitemap.xml is written by `yarn build` (scripts/sitemap.mjs); CI
  // runs the tests after the build, as lib/robots.test.ts also expects.
  it("sitemap.xml lists the catalogue and every product page", () => {
    const sitemap = read("sitemap.xml");
    expect(sitemap).toContain(`<loc>https://moshemalka.com${CATALOGUE.path}</loc>`);
    for (const p of PRODUCTS) expect(sitemap).toContain(`<loc>https://moshemalka.com/products/${p.slug}</loc>`);
  });
});
