import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Book, Library } from "@/lib/library/types";
import type { BookData } from "@/components/study/Book";
import BookDetail from "@/components/study/BookDetail";
import { colorFromString } from "@/lib/colorFromString";
import { garamond, studyFontVars } from "@/lib/studyFonts";

const Room = dynamic(() => import("@/components/study/Room"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <p className="font-garamond italic text-lg text-[#c9a36a]/80 animate-pulse">lighting the lamp…</p>
    </div>
  ),
});

type Props = { library: Library; source: "library" | "demo" };

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Imported here so fs never reaches the client bundle.
  const { loadLibrary } = await import("@/lib/library/load");
  return { props: loadLibrary() };
};

export default function StudyPage({ library, source }: Props) {
  const [pulledId, setPulledId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  // Named shelves first, in declared order, then the unshelved stacks.
  const shelves = useMemo(() => {
    const known = new Set(library.shelves.map((s) => s.id));
    return [
      ...library.shelves.map((s) => ({ id: s.id, label: s.label, books: library.books.filter((b) => b.shelf === s.id) })),
      { id: "stacks", label: "Stacks", books: library.books.filter((b) => !b.shelf || !known.has(b.shelf)) },
    ].filter((g) => g.books.length);
  }, [library]);

  const roomShelves = useMemo(
    () => shelves.map((s) => ({ ...s, books: s.books.map(toBookData) })),
    [shelves]
  );
  const shelfOrder = useMemo(() => shelves.flatMap((s) => s.books), [shelves]);
  const byId = useMemo(() => new Map(library.books.map((b) => [b.id, b])), [library]);

  const pulled = pulledId ? byId.get(pulledId) ?? null : null;
  // No spine tags while a book is in hand — attention stays on it.
  const hovered = hoverId && !pulledId ? byId.get(hoverId) ?? null : null;

  const step = useCallback(
    (delta: -1 | 1) => {
      if (!pulledId) return;
      const i = shelfOrder.findIndex((b) => b.id === pulledId);
      const next = shelfOrder[(i + delta + shelfOrder.length) % shelfOrder.length];
      if (next) setPulledId(next.id);
    },
    [pulledId, shelfOrder]
  );
  const close = useCallback(() => setPulledId(null), []);

  // The spine tag follows the pointer without re-rendering React.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (tagRef.current) tagRef.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <>
      <Head>
        <title>The Study · Moshe Malka</title>
        <meta name="description" content="Moshe Malka's library — a lamplit 3D study of the books he's read, shelved by subject." />
        <link rel="canonical" href="https://moshemalka.com/study" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://moshemalka.com/study" />
        <meta property="og:title" content="The Study · Moshe Malka" />
        <meta property="og:description" content="A lamplit 3D study of the books Moshe Malka has read, shelved by subject." />
        <meta property="og:image" content="https://moshemalka.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        {source === "library" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(studyStructuredData(library)) }}
          />
        )}
      </Head>
      <main className={`study ${studyFontVars} relative h-[100dvh] w-screen overflow-hidden`}>
        <div className="absolute inset-0">
          <Room
            shelves={roomShelves}
            pulledId={pulledId}
            onBookClick={setPulledId}
            onBackgroundClick={close}
            onBookHover={setHoverId}
            fontFamily={garamond.style.fontFamily}
          />
        </div>

        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-baseline justify-between px-5 pt-4 md:px-8 md:pt-6">
          <Link
            href="/"
            className="pointer-events-auto group inline-flex items-center gap-2 text-[0.95rem] text-[#e8d9b8]/75 transition-colors hover:text-[#f6ead0]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Home
          </Link>
          <h1 className="text-center">
            <span className="block font-garamond text-[1.6rem] md:text-[1.9rem] italic leading-none text-[#f1e3c4] [text-shadow:0_2px_14px_rgba(0,0,0,0.8)]">
              The Study
            </span>
          </h1>
          <p className="text-[0.95rem] tabular-nums text-[#e8d9b8]/60">
            {library.books.length} volumes
          </p>
        </header>

        <div
          ref={tagRef}
          aria-hidden
          className={`study-tag pointer-events-none fixed left-0 top-0 z-40 max-w-[18rem] rounded-[3px] px-3 py-1.5 transition-opacity duration-150 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {hovered && (
            <>
              <span className="block font-garamond text-[0.98rem] leading-snug">{hovered.title}</span>
              {hovered.authors[0] && (
                <span className="block font-garamond italic text-[0.85rem] text-[#c9a36a]">{hovered.authors[0]}</span>
              )}
            </>
          )}
        </div>

        <BookDetail book={pulled} onClose={close} onStep={step} />

        {/* The room is a WebGL canvas that assistive tech can't read, so the
            catalog is mirrored here as plain lists. Server-rendered. */}
        {source === "library" && (
          <section className="sr-only" aria-label="Catalog">
            <h2>Catalog of Moshe Malka&rsquo;s library</h2>
            {shelves.map((s) => (
              <div key={s.id}>
                <h3>{s.label}</h3>
                <ul>
                  {s.books.map((b) => (
                    <li key={b.id}>
                      <cite>{b.title}</cite>
                      {b.authors.length > 0 && ` by ${b.authors.join(", ")}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <footer
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1 px-4 pb-4 text-center transition-opacity duration-500 ${
            pulled ? "opacity-0" : "opacity-100"
          }`}
        >
          {source === "demo" && (
            <p className="font-garamond italic text-[0.95rem] text-[#c9a36a]/85">
              A sample shelf — the real library isn’t published yet.
            </p>
          )}
          <p className="font-garamond text-[0.9rem] text-[#e8d9b8]/50">
            Drag to look around · take down any book · <span className="hidden md:inline">← → to browse · </span>esc to put it back
          </p>
        </footer>
      </main>
    </>
  );
}

const SITE_URL = "https://moshemalka.com";

/** The @ids must match the homepage's graph so both pages describe one Person. */
function studyStructuredData(library: Library) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/study#webpage`,
    url: `${SITE_URL}/study`,
    name: "The Study · Moshe Malka",
    description: "Moshe Malka's library — the books he's read, shelved by subject.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#person` },
    author: { "@id": `${SITE_URL}/#person` },
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: library.books.length,
      itemListElement: library.books.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: b.title,
          ...(b.authors.length && {
            author: b.authors.map((name) => ({ "@type": "Person", name })),
          }),
          ...((b.isbn13 ?? b.isbn10) && { isbn: b.isbn13 ?? b.isbn10 }),
        },
      })),
    },
  };
}

// Deterministic per-book variance so the shelf isn't a row of clones.
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * White spines are real (lots of modern non-fiction), but pure white glares in
 * lamplight. Pull near-whites toward warm paper stock so they read as aged
 * cream; every other color passes through untouched.
 */
function aged(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum < 0.78) return hex;
  const t = Math.min(1, (lum - 0.78) / 0.22) * 0.55; // up to 55% toward paper
  const mix = (c: number, p: number) => Math.round(c + (p - c) * t);
  const out = (mix(r, 0xd9) << 16) | (mix(g, 0xc9) << 8) | mix(b, 0xa6);
  return `#${out.toString(16).padStart(6, "0")}`;
}

function toBookData(b: Book): BookData {
  const h = hash(b.id);
  const pages = b.pageCount ?? 260 + (h % 200);
  return {
    id: b.id,
    title: b.title,
    authors: b.authors,
    coverUrl: b.coverUrl,
    spineColor: aged(b.spineColor ?? colorFromString(b.title + (b.authors[0] ?? ""))),
    // Thick tomes and older classics read as hardcovers; the rest mostly paperback.
    binding: pages > 420 || h % 3 === 0 ? "hard" : "paper",
    // Spine width tracks page count, kept wide enough to letter legibly.
    thickness: Math.min(0.16, Math.max(0.06, 0.045 + pages * 0.000135)),
    height: 0.5 + (h % 11) * 0.012,
    depth: 0.36 + ((h >> 5) % 7) * 0.012,
  };
}
