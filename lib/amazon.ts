// Amazon Associates links for books on the shelf.
export const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "quentincode-20";

// Required by the Associates Operating Agreement wherever tagged links appear.
export const AMAZON_DISCLOSURE =
  "As an Amazon Associate I earn from qualifying purchases.";

// 978-prefixed ISBN-13s have an ISBN-10 equivalent, which is also the
// Amazon ASIN for the physical edition.
export function isbn13to10(isbn13: string): string | null {
  const d = isbn13.replace(/[^0-9]/g, "");
  if (d.length !== 13 || !d.startsWith("978")) return null;
  const core = d.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(core[i]);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
}

type Linkable = {
  asin?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  title: string;
  authors: string[];
};

export function amazonUrl(book: Linkable): string {
  const asin =
    book.asin ||
    book.isbn10 ||
    (book.isbn13 ? isbn13to10(book.isbn13) : null);
  if (asin) {
    return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
  }
  const q = [book.title, book.authors[0]].filter(Boolean).join(" ");
  return `https://www.amazon.com/s?k=${encodeURIComponent(q)}&i=stripbooks&tag=${AMAZON_TAG}`;
}
