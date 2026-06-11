import { useEffect } from "react";
import type { Book } from "@/lib/db/schema";

export default function BookDetail({
  book,
  onClose,
}: {
  book: Book | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      aria-hidden={!book}
      className={`pointer-events-none fixed inset-0 z-30 flex justify-end p-4 md:p-8 transition-opacity duration-300 ${
        book ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`relative w-full md:w-[460px] max-h-full overflow-y-auto bg-[#1a120bee] backdrop-blur-md border border-[#5b3a29] text-[#e8d9b8] shadow-2xl transition-transform duration-500 ease-out ${
          book
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-12 invisible"
        }`}
      >
        {book && (
          <div className="p-6 md:p-7 font-mono">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
            >
              close ✕
            </button>
            {book.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt=""
                className="w-32 md:w-40 h-auto mb-4 shadow-lg"
              />
            )}
            <h2 className="text-xl md:text-2xl font-serif leading-snug">
              {book.title}
            </h2>
            {book.subtitle && (
              <p className="opacity-70 text-sm font-serif italic mt-1">
                {book.subtitle}
              </p>
            )}
            <p className="text-sm opacity-80 mt-2">
              {book.authors.join(", ")}
              {book.publishedYear ? ` · ${book.publishedYear}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70">
              {book.publisher && <span>{book.publisher}</span>}
              {book.pageCount && <span>{book.pageCount} pp</span>}
              {book.rating && (
                <span className="text-[#c9a36a]">★ {book.rating}/10</span>
              )}
              <span>· {readableStatus(book.status)}</span>
            </div>

            {(book.dateStarted || book.dateFinished) && (
              <p className="mt-2 text-xs opacity-60">
                {book.dateStarted && `started ${fmt(book.dateStarted)}`}
                {book.dateStarted && book.dateFinished && " · "}
                {book.dateFinished && `finished ${fmt(book.dateFinished)}`}
              </p>
            )}

            {book.subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {book.subjects.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="text-[10px] uppercase tracking-widest border border-[#5b3a29] px-2 py-0.5 opacity-70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {book.notes && (
              <div className="mt-5 border-t border-[#5b3a29] pt-4">
                <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
                  Marginalia
                </h3>
                <p className="text-sm font-serif whitespace-pre-wrap leading-relaxed">
                  {book.notes}
                </p>
              </div>
            )}

            {book.description && !book.notes && (
              <div className="mt-5 border-t border-[#5b3a29] pt-4">
                <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
                  From the publisher
                </h3>
                <p className="text-sm font-serif leading-relaxed opacity-90">
                  {book.description.length > 700
                    ? book.description.slice(0, 700) + "…"
                    : book.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function readableStatus(s: string) {
  if (s === "want_to_read") return "to read";
  return s;
}

function fmt(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
