export type LookupResult = {
  isbn13?: string;
  isbn10?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  coverUrl?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  description?: string;
  subjects: string[];
  source: "openlibrary" | "googlebooks";
  sourceId: string;
};

const cleanIsbn = (raw: string) => raw.replace(/[^0-9Xx]/g, "");

const yearFromString = (s?: string | null) => {
  if (!s) return undefined;
  const m = String(s).match(/\d{4}/);
  return m ? Number(m[0]) : undefined;
};

async function lookupOpenLibraryByIsbn(
  isbn: string
): Promise<LookupResult | null> {
  const key = `ISBN:${isbn}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(
    key
  )}&format=json&jscmd=data`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, any>;
  const entry = json[key];
  if (!entry) return null;

  const identifiers = entry.identifiers || {};
  const isbn13 =
    identifiers.isbn_13?.[0] ?? (isbn.length === 13 ? isbn : undefined);
  const isbn10 =
    identifiers.isbn_10?.[0] ?? (isbn.length === 10 ? isbn : undefined);

  return {
    isbn13,
    isbn10,
    title: entry.title,
    subtitle: entry.subtitle,
    authors: (entry.authors ?? []).map((a: any) => a.name).filter(Boolean),
    coverUrl: entry.cover?.large ?? entry.cover?.medium ?? entry.cover?.small,
    publisher: entry.publishers?.[0]?.name,
    publishedYear: yearFromString(entry.publish_date),
    pageCount: entry.number_of_pages,
    description:
      typeof entry.notes === "string"
        ? entry.notes
        : entry.notes?.value ?? undefined,
    subjects: (entry.subjects ?? []).map((s: any) => s.name).filter(Boolean),
    source: "openlibrary",
    sourceId: entry.key ?? `/books/${isbn}`,
  };
}

async function lookupGoogleBooksByIsbn(
  isbn: string
): Promise<LookupResult | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(
    isbn
  )}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const item = json.items?.[0];
  if (!item) return null;
  const v = item.volumeInfo ?? {};

  const ids: Array<{ type: string; identifier: string }> =
    v.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;

  const cover =
    v.imageLinks?.extraLarge ??
    v.imageLinks?.large ??
    v.imageLinks?.medium ??
    v.imageLinks?.thumbnail ??
    v.imageLinks?.smallThumbnail;

  return {
    isbn13,
    isbn10,
    title: v.title,
    subtitle: v.subtitle,
    authors: v.authors ?? [],
    coverUrl: cover?.replace(/^http:\/\//, "https://"),
    publisher: v.publisher,
    publishedYear: yearFromString(v.publishedDate),
    pageCount: v.pageCount,
    description: v.description,
    subjects: v.categories ?? [],
    source: "googlebooks",
    sourceId: item.id,
  };
}

async function searchOpenLibraryByTitle(
  title: string,
  author?: string
): Promise<LookupResult | null> {
  const params = new URLSearchParams();
  params.set("title", title);
  if (author) params.set("author", author);
  params.set("limit", "1");
  const url = `https://openlibrary.org/search.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const doc = json.docs?.[0];
  if (!doc) return null;

  const isbn = doc.isbn?.[0];
  if (isbn) {
    const byIsbn = await lookupOpenLibraryByIsbn(isbn);
    if (byIsbn) return byIsbn;
  }

  return {
    isbn13: isbn && isbn.length === 13 ? isbn : undefined,
    isbn10: isbn && isbn.length === 10 ? isbn : undefined,
    title: doc.title,
    subtitle: undefined,
    authors: doc.author_name ?? [],
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    publisher: doc.publisher?.[0],
    publishedYear: doc.first_publish_year,
    pageCount: doc.number_of_pages_median,
    description: undefined,
    subjects: doc.subject?.slice(0, 10) ?? [],
    source: "openlibrary",
    sourceId: doc.key,
  };
}

export async function lookupByIsbn(rawIsbn: string) {
  const isbn = cleanIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) {
    throw new Error("ISBN must be 10 or 13 digits");
  }
  const ol = await lookupOpenLibraryByIsbn(isbn);
  if (ol) return ol;
  const gb = await lookupGoogleBooksByIsbn(isbn);
  if (gb) return gb;
  return null;
}

export async function lookupByTitle(title: string, author?: string) {
  const ol = await searchOpenLibraryByTitle(title, author);
  if (ol) return ol;
  const q = author ? `${title} ${author}` : title;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    q
  )}&maxResults=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const item = json.items?.[0];
  if (!item) return null;
  const v = item.volumeInfo ?? {};
  const ids: Array<{ type: string; identifier: string }> =
    v.industryIdentifiers ?? [];
  return {
    isbn13: ids.find((i) => i.type === "ISBN_13")?.identifier,
    isbn10: ids.find((i) => i.type === "ISBN_10")?.identifier,
    title: v.title,
    subtitle: v.subtitle,
    authors: v.authors ?? [],
    coverUrl:
      v.imageLinks?.large ??
      v.imageLinks?.thumbnail?.replace(/^http:\/\//, "https://"),
    publisher: v.publisher,
    publishedYear: yearFromString(v.publishedDate),
    pageCount: v.pageCount,
    description: v.description,
    subjects: v.categories ?? [],
    source: "googlebooks" as const,
    sourceId: item.id,
  };
}
