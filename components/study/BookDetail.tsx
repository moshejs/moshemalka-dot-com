import { useEffect, useRef } from "react";
import type { Book } from "@/lib/library/types";
import { AMAZON_DISCLOSURE, amazonUrl } from "@/lib/amazon";

// A library catalog card (AACR2-ish main entry) for the book in hand.
export default function BookDetail({
  book,
  onClose,
  onStep,
}: {
  book: Book | null;
  onClose: () => void;
  onStep: (delta: -1 | 1) => void;
}) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!book) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, onClose, onStep]);

  // Move focus to the card itself (not the close button, which would flash a
  // focus ring after a mouse click) so screen readers announce the book.
  useEffect(() => {
    if (book) cardRef.current?.focus({ preventScroll: true });
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!book;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 flex items-end md:items-center justify-center md:justify-end p-3 md:p-10 transition-opacity duration-500 ${
        open ? "opacity-100" : "opacity-0"
      }`}
    >
      <article
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={book ? `${book.title} — catalog card` : undefined}
        className={`study-card relative w-full max-w-[34rem] md:w-[32rem] max-h-[50dvh] md:max-h-[86vh] overflow-y-auto outline-none text-[#2b2118] transition-[transform,opacity] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "pointer-events-auto translate-y-0 md:translate-x-0 md:-rotate-[1.25deg]"
            : "pointer-events-none translate-y-10 md:translate-y-0 md:translate-x-16 md:rotate-[2deg] invisible"
        }`}
      >
        {book && <Card book={book} onClose={onClose} />}
      </article>
    </div>
  );
}

function Card({ book, onClose }: { book: Book; onClose: () => void }) {
  const [first, ...rest] = book.authors;
  const isbn = book.isbn13 ?? book.isbn10;
  const imprint = [book.publisher, book.publishedYear && formatYear(book.publishedYear)]
    .filter(Boolean)
    .join(", ");
  const titleLine = book.subtitle ? `${book.title} : ${book.subtitle}` : book.title;

  return (
    <div className="relative px-6 md:px-9 pt-5 md:pt-6 pb-6 md:pb-8">
      {/* the red ruled line every catalog card carries */}
      <div aria-hidden className="absolute left-0 right-0 top-[3.6rem] h-px bg-[#b8473a]/70" />

      <header className="flex items-start justify-between gap-4 h-[2.6rem]">
        <p className="font-typewriter text-[0.8rem] leading-tight text-[#5b4a3a] pt-1">
          {isbn ? <>ISBN {isbn}</> : <>&nbsp;</>}
          {book.status !== "finished" && (
            <span className="ml-3 uppercase tracking-[0.12em] text-[#8a3324]">
              {statusLabel(book.status)}
            </span>
          )}
        </p>
        <button
          onClick={onClose}
          aria-label="Put the book back"
          className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#5b4a3a] transition-colors hover:bg-[#2b2118]/[0.07] hover:text-[#2b2118] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a3324]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="mt-4 md:mt-5 font-typewriter text-[0.84rem] md:text-[0.92rem] leading-[1.55]">
        {first && <p className="text-[#2b2118]">{invertName(first).replace(/\.+$/, "")}.</p>}
        <h2 className="mt-1 pl-6 font-garamond text-[1.4rem] md:text-[1.85rem] leading-[1.15] tracking-[-0.01em] text-[#1c140d] [text-wrap:balance]">
          {titleLine}
        </h2>
        <p className="pl-6 mt-1 text-[#3a2d22]">
          {book.authors.length > 0 && <>/ {[first, ...rest].join(", ")}. </>}
          {imprint && <>— {imprint}.</>}
        </p>
        {book.pageCount && <p className="pl-6 text-[#3a2d22]">{book.pageCount} p.</p>}

        {book.subjects.length > 0 && (
          <p className="pl-6 mt-3 text-[#3a2d22]">
            {book.subjects.slice(0, 4).map((s, i) => (
              <span key={s}>
                {i + 1}. {s}.{" "}
              </span>
            ))}
            I. Title.
          </p>
        )}

        {book.rating && (
          <p className="pl-6 mt-3 text-[#8a3324]">
            Rated {book.rating}/10
            {book.dateFinished && <> · finished {formatDate(book.dateFinished)}</>}
          </p>
        )}
      </div>

      {book.notes && (
        <div className="mt-6 -rotate-[0.6deg]">
          <p className="font-pencil text-[1.45rem] leading-[1.25] text-[#4a4440] [text-wrap:pretty]">
            {book.notes}
          </p>
        </div>
      )}

      {!book.notes && book.description && (
        <p className="mt-6 font-garamond text-[1.02rem] leading-[1.6] text-[#3a2d22] [text-wrap:pretty]">
          {truncate(stripHtml(book.description), 520)}
        </p>
      )}

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <a
          href={amazonUrl(book)}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="group inline-flex items-center gap-2 font-garamond text-[1.05rem] text-[#1c140d] underline decoration-[#b8473a]/60 decoration-1 underline-offset-[5px] transition-colors hover:decoration-[#b8473a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a3324]"
        >
          Find it on Amazon
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="font-garamond italic text-[0.8rem] text-[#6b5a48]">{AMAZON_DISCLOSURE}</p>
      </footer>

      {/* the punched rod hole at the foot of the card */}
      <div aria-hidden className="mx-auto mt-6 h-3.5 w-3.5 rounded-full bg-[#0e0905] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
    </div>
  );
}

function invertName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop()!;
  return `${last}, ${parts.join(" ")}`;
}

function formatYear(y: number) {
  return y < 0 ? `${-y} B.C.` : String(y);
}

function statusLabel(s: Book["status"]) {
  return s === "want_to_read" ? "on the pile" : s === "reading" ? "reading now" : "set aside";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
