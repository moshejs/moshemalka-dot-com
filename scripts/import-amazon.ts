// Import print books from Amazon order history into the study.
//
//   yarn study:amazon enrich   data/private/amazon-orders.json -> data/private/amazon-library.json
//   yarn study:amazon apply    data/private/amazon-library.json -> data/library.json
//
// `enrich` looks each ISBN up in Open Library / Google Books, samples the cover's
// dominant color for the spine, and writes a review file. Set `include: false`
// on anything you bought but didn't read, then `apply` merges the rest into
// data/library.json — adding new books, dropping excluded ones, and never
// touching a book's fields once it's in the library (so hand edits survive).
//
// data/private/ holds raw order data and is always gitignored.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import * as jpeg from "jpeg-js";
import { lookupByIsbn, type LookupResult } from "../lib/openLibrary";
import type { Book, Library } from "../lib/library/types";

type OrderRow = { asin: string; title: string; author?: string; date: string | null };

type ReviewRow = {
  include: boolean;
  asin: string;
  orderTitle: string;
  acquiredAt: string | null;
  matched: boolean;
  spineColor?: string | null;
  book: Partial<LookupResult> & { title: string; authors: string[]; subjects: string[] };
};

const ORDERS = "data/private/amazon-orders.json";
const REVIEW = "data/private/amazon-library.json";
const LIBRARY = "data/library.json";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toIso(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Most common color on the cover ≈ the color of the book's binding. Quantize
// to 4 bits/channel and take the mode, skipping the outermost pixels (scanner
// borders) — white covers really do get white spines.
async function sampleSpineColor(coverUrl: string | undefined): Promise<string | null> {
  if (!coverUrl) return null;
  const small = coverUrl.replace(/-L\.jpg$/, "-S.jpg").replace(/-M\.jpg$/, "-S.jpg");
  try {
    const res = await fetch(small + (small.includes("openlibrary") ? "?default=false" : ""));
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
    if (img.width < 8 || img.height < 8) return null; // OL's 1×1 "no cover"
    const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
    const mx = Math.floor(img.width * 0.08), my = Math.floor(img.height * 0.08);
    for (let y = my; y < img.height - my; y++) {
      for (let x = mx; x < img.width - mx; x++) {
        const i = (y * img.width + x) * 4;
        const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const c = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        c.n++; c.r += r; c.g += g; c.b += b;
        counts.set(key, c);
      }
    }
    let best: { n: number; r: number; g: number; b: number } | null = null;
    for (const c of counts.values()) if (!best || c.n > best.n) best = c;
    if (!best) return null;
    const hex = (v: number) => Math.round(v / best!.n).toString(16).padStart(2, "0");
    return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
  } catch {
    return null;
  }
}

async function enrich() {
  const orders: OrderRow[] = JSON.parse(readFileSync(ORDERS, "utf8"));
  const previous = new Map<string, ReviewRow>(
    existsSync(REVIEW)
      ? (JSON.parse(readFileSync(REVIEW, "utf8")) as ReviewRow[]).map((r) => [r.asin, r])
      : []
  );

  const out: ReviewRow[] = [];
  let matched = 0;
  for (const [i, o] of orders.entries()) {
    const prev = previous.get(o.asin);
    let row: ReviewRow;
    if (prev?.matched) {
      row = prev; // keep curation + skip the catalog lookup
    } else {
      let found: LookupResult | null = null;
      try {
        found = await lookupByIsbn(o.asin);
      } catch {
        found = null;
      }
      row = {
        include: prev?.include ?? true,
        asin: o.asin,
        orderTitle: o.title,
        acquiredAt: toIso(o.date),
        matched: !!found,
        book: found ?? {
          isbn10: o.asin,
          title: o.title || o.asin,
          authors: o.author ? [o.author] : [],
          subjects: [],
        },
      };
      await sleep(250); // be polite to Open Library
    }
    if (row.spineColor === undefined) {
      row.spineColor = await sampleSpineColor(
        row.book.coverUrl ?? `https://covers.openlibrary.org/b/isbn/${o.asin}-S.jpg`
      );
    }
    if (row.matched) matched++;
    out.push(row);
    process.stdout.write(
      `\r${i + 1}/${orders.length}  matched ${matched}  ${row.spineColor ?? "  ·    "} ${row.book.title.slice(0, 44).padEnd(44)}`
    );
  }
  process.stdout.write("\n");

  out.sort((a, b) => (b.acquiredAt ?? "").localeCompare(a.acquiredAt ?? ""));
  mkdirSync(dirname(REVIEW), { recursive: true });
  writeFileSync(REVIEW, JSON.stringify(out, null, 2) + "\n");
  const misses = out.filter((r) => !r.matched);
  console.log(
    `wrote ${REVIEW}: ${out.length} books, ${matched} catalog-matched, ` +
      `${out.filter((r) => r.spineColor).length} spine colors from covers`
  );
  for (const m of misses) console.log(`  title-only: ${m.asin}  ${m.book.title.slice(0, 70)}`);
}

function toBook(r: ReviewRow): Book {
  const b = r.book;
  const book: Book = {
    id: r.asin,
    asin: r.asin,
    isbn10: b.isbn10 ?? r.asin,
    isbn13: b.isbn13,
    title: b.title,
    subtitle: b.subtitle,
    authors: b.authors ?? [],
    coverUrl: b.coverUrl,
    publisher: b.publisher,
    publishedYear: b.publishedYear,
    pageCount: b.pageCount,
    description: b.description,
    subjects: (b.subjects ?? []).slice(0, 8),
    status: "finished",
    spineColor: r.spineColor ?? undefined,
  };
  // Drop undefined keys so the JSON stays tidy and diffable.
  return JSON.parse(JSON.stringify(book));
}

function apply() {
  const rows: ReviewRow[] = JSON.parse(readFileSync(REVIEW, "utf8"));
  const library: Library = existsSync(LIBRARY)
    ? JSON.parse(readFileSync(LIBRARY, "utf8"))
    : { shelves: [], books: [] };

  const excluded = new Set(rows.filter((r) => !r.include).map((r) => r.asin));
  const before = library.books.length;
  library.books = library.books.filter((b) => !(b.asin && excluded.has(b.asin)));
  const removed = before - library.books.length;

  const have = new Set(library.books.map((b) => b.id));
  const fresh = rows
    .filter((r) => r.include && !have.has(r.asin))
    // Oldest purchase first, so the shelf reads chronologically left to right.
    .sort((a, b) => (a.acquiredAt ?? "").localeCompare(b.acquiredAt ?? ""))
    .map(toBook);
  library.books.push(...fresh);

  mkdirSync(dirname(LIBRARY), { recursive: true });
  writeFileSync(LIBRARY, JSON.stringify(library, null, 2) + "\n");
  console.log(
    `${LIBRARY}: +${fresh.length} added, −${removed} removed, ${library.books.length} books total`
  );
}

const cmd = process.argv[2];
if (cmd === "enrich") enrich();
else if (cmd === "apply") apply();
else {
  console.error("usage: yarn study:amazon <enrich|apply>");
  process.exit(1);
}
