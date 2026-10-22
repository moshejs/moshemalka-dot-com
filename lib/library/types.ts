// The study's whole data model: one JSON file, data/library.json.
// Book order within the file is shelf order.

export type BookStatus = "reading" | "finished" | "abandoned" | "want_to_read";

export type Book = {
  id: string; // stable key — the ASIN for Amazon imports, a slug otherwise
  asin?: string; // Amazon ASIN (== ISBN-10 for print books)
  isbn10?: string;
  isbn13?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  coverUrl?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  description?: string;
  subjects: string[];
  status: BookStatus;
  rating?: number; // 1–10
  notes?: string;
  dateStarted?: string; // ISO date
  dateFinished?: string; // ISO date
  shelf?: string; // Shelf.id — omitted means "the stacks"
  spineColor?: string; // #rrggbb, sampled from the cover at import time
};

export type Shelf = { id: string; label: string };

export type Library = { shelves: Shelf[]; books: Book[] };
