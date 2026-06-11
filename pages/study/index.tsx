import { useCallback, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import useSWR from "swr";
import type { Book, Shelf } from "@/lib/db/schema";
import type { BookData } from "@/components/study/Book";
import BookDetail from "@/components/study/BookDetail";
import { colorFromString } from "@/lib/colorFromString";

const Room = dynamic(() => import("@/components/study/Room"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen bg-[#0e0905] text-[#c9a36a] grid place-items-center font-mono tracking-widest text-xs">
      lighting the lamp…
    </div>
  ),
});

export default function StudyPage() {
  const [demo, setDemo] = useState(false);
  const fetcher = useCallback(async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.statusText);
    if (r.headers.get("x-study-demo")) setDemo(true);
    return r.json();
  }, []);

  const { data: books, error: booksErr } = useSWR<Book[]>(
    "/api/books",
    fetcher
  );
  const { data: shelves, error: shelvesErr } = useSWR<Shelf[]>(
    "/api/shelves",
    fetcher
  );
  const [pulledId, setPulledId] = useState<number | null>(null);

  const groupedRows = useMemo(() => {
    // Wait for both requests so shelved books don't flash into "Stacks"
    // (tolerate a shelves error — render what we have).
    if (!books || (!shelves && !shelvesErr)) return null;
    const byShelf = new Map<number | "none", Book[]>();
    for (const b of books) {
      const key = b.shelfId ?? "none";
      const arr = byShelf.get(key) ?? [];
      arr.push(b);
      byShelf.set(key, arr);
    }
    for (const arr of byShelf.values()) {
      arr.sort((a, b) => a.slotIndex - b.slotIndex || a.id - b.id);
    }

    const orderedShelves: { id: number | null; label: string }[] = [];
    if (shelves) {
      for (const s of shelves) {
        if (byShelf.has(s.id))
          orderedShelves.push({ id: s.id, label: s.label });
      }
    }
    if (byShelf.has("none")) {
      orderedShelves.push({ id: null, label: "Stacks" });
    }

    return orderedShelves.map((s) => ({
      id: s.id,
      label: s.label,
      books: (byShelf.get(s.id ?? "none") ?? []).map(toBookData),
    }));
  }, [books, shelves]);

  const pulled = useMemo(
    () => (pulledId && books ? books.find((b) => b.id === pulledId) ?? null : null),
    [pulledId, books]
  );

  return (
    <>
      <Head>
        <title>The Study · Moshe Malka</title>
        <meta
          name="description"
          content="A 3D study of books I've read."
        />
      </Head>
      <main className="relative h-screen w-screen overflow-hidden bg-[#0e0905] text-[#e8d9b8]">
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6 font-mono text-xs uppercase tracking-widest pointer-events-none">
          <div className="pointer-events-auto">
            <Link href="/" className="opacity-70 hover:opacity-100">
              ← home
            </Link>
          </div>
          <div className="pointer-events-auto opacity-70">The Study</div>
          <div className="pointer-events-auto">
            <Link href="/study/admin" className="opacity-50 hover:opacity-100">
              admin
            </Link>
          </div>
        </header>

        {booksErr && (
          <div className="absolute inset-0 z-30 grid place-items-center font-mono text-sm">
            <div className="border border-[#5b3a29] p-6 max-w-md">
              <div className="text-[#e8a47b] uppercase tracking-widest text-xs mb-2">
                couldn’t load
              </div>
              <p className="opacity-80">
                The library is silent. Check that <code>DATABASE_URL</code> and{" "}
                <code>SESSION_SECRET</code> are set.
              </p>
            </div>
          </div>
        )}

        {books && groupedRows && groupedRows.length === 0 && (
          <div className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-mono pointer-events-none">
            <div className="text-xs uppercase tracking-widest opacity-50">
              an empty study
            </div>
            <p className="mt-2 text-sm opacity-80">
              Add your first book in{" "}
              <Link href="/study/admin" className="underline pointer-events-auto">
                admin
              </Link>
              .
            </p>
          </div>
        )}

        {groupedRows && (
          <Room
            shelves={groupedRows}
            pulledId={pulledId}
            onBookClick={(id) => setPulledId(id)}
            onBackgroundClick={() => setPulledId(null)}
          />
        )}

        <BookDetail book={pulled} onClose={() => setPulledId(null)} />

        <footer className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-1 p-4 font-mono text-[10px] uppercase tracking-widest pointer-events-none">
          {demo && (
            <span className="text-[#c9a36a] opacity-80">
              demo shelf — sample books until a database is connected
            </span>
          )}
          <span className="opacity-40">drag · click a spine · esc to close</span>
        </footer>
      </main>
    </>
  );
}

function toBookData(b: Book): BookData {
  const thickness = clamp((b.pageCount ?? 280) / 1800 + 0.06, 0.07, 0.17);
  const height = 0.54 + ((b.id * 37) % 9) * 0.012; // small per-book variance
  const depth = 0.42 + ((b.id * 53) % 7) * 0.01;
  return {
    id: b.id,
    title: b.title,
    authors: b.authors,
    spineColor:
      b.spineColor ?? colorFromString(b.title + (b.authors[0] ?? "")),
    thickness,
    height,
    depth,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
