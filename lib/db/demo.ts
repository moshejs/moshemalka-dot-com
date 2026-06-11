import type { Book, Shelf } from "./schema";

// When DATABASE_URL is unset the study serves this read-only sample library,
// so the room renders in local dev and on a fresh deploy before Neon is wired up.
export const isDemoMode = () => !process.env.DATABASE_URL;

const T0 = new Date("2026-01-01T00:00:00Z");

export const demoShelves: Shelf[] = [
  { id: 9001, label: "Philosophy", sortOrder: 0, createdAt: T0 },
  { id: 9002, label: "Fiction", sortOrder: 1, createdAt: T0 },
  { id: 9003, label: "Science & Systems", sortOrder: 2, createdAt: T0 },
];

type DemoSeed = {
  id: number;
  title: string;
  authors: string[];
  isbn13: string;
  publishedYear: number;
  pageCount: number;
  publisher: string;
  shelfId: number;
  slotIndex: number;
  rating?: number;
  status?: Book["status"];
  notes?: string;
  subjects?: string[];
};

function demoBook(s: DemoSeed): Book {
  return {
    id: s.id,
    isbn13: s.isbn13,
    isbn10: null,
    title: s.title,
    subtitle: null,
    authors: s.authors,
    coverUrl: `https://covers.openlibrary.org/b/isbn/${s.isbn13}-L.jpg`,
    publisher: s.publisher,
    publishedYear: s.publishedYear,
    pageCount: s.pageCount,
    description: null,
    subjects: s.subjects ?? [],
    source: "demo",
    sourceId: null,
    dateStarted: null,
    dateFinished: null,
    rating: s.rating ?? null,
    notes:
      s.notes ??
      "Sample entry — connect a database and add your own library at /study/admin.",
    status: s.status ?? "finished",
    shelfId: s.shelfId,
    slotIndex: s.slotIndex,
    spineColor: null,
    createdAt: T0,
    updatedAt: T0,
  };
}

export const demoBooks: Book[] = [
  demoBook({
    id: 9101,
    title: "Meditations",
    authors: ["Marcus Aurelius"],
    isbn13: "9780140449334",
    publishedYear: 180,
    pageCount: 304,
    publisher: "Penguin Classics",
    shelfId: 9001,
    slotIndex: 0,
    rating: 9,
    subjects: ["Stoicism", "Ethics"],
    notes:
      "Demo marginalia: an emperor's private notebook, never meant for us. Book 4 alone is worth the shelf space.",
  }),
  demoBook({
    id: 9102,
    title: "Letters from a Stoic",
    authors: ["Seneca"],
    isbn13: "9780140442106",
    publishedYear: 65,
    pageCount: 254,
    publisher: "Penguin Classics",
    shelfId: 9001,
    slotIndex: 1,
    rating: 8,
    subjects: ["Stoicism"],
  }),
  demoBook({
    id: 9103,
    title: "The Republic",
    authors: ["Plato"],
    isbn13: "9780140455113",
    publishedYear: -375,
    pageCount: 416,
    publisher: "Penguin Classics",
    shelfId: 9001,
    slotIndex: 2,
    rating: 8,
    subjects: ["Political philosophy"],
  }),
  demoBook({
    id: 9104,
    title: "Beyond Good and Evil",
    authors: ["Friedrich Nietzsche"],
    isbn13: "9780140449235",
    publishedYear: 1886,
    pageCount: 240,
    publisher: "Penguin Classics",
    shelfId: 9001,
    slotIndex: 3,
    rating: 7,
    subjects: ["Philosophy"],
  }),
  demoBook({
    id: 9201,
    title: "Crime and Punishment",
    authors: ["Fyodor Dostoevsky"],
    isbn13: "9780140449136",
    publishedYear: 1866,
    pageCount: 720,
    publisher: "Penguin Classics",
    shelfId: 9002,
    slotIndex: 0,
    rating: 10,
    subjects: ["Russian literature"],
  }),
  demoBook({
    id: 9202,
    title: "Moby-Dick",
    authors: ["Herman Melville"],
    isbn13: "9780142437247",
    publishedYear: 1851,
    pageCount: 720,
    publisher: "Penguin Classics",
    shelfId: 9002,
    slotIndex: 1,
    rating: 8,
    subjects: ["American literature", "The sea"],
  }),
  demoBook({
    id: 9203,
    title: "East of Eden",
    authors: ["John Steinbeck"],
    isbn13: "9780142004234",
    publishedYear: 1952,
    pageCount: 601,
    publisher: "Penguin",
    shelfId: 9002,
    slotIndex: 2,
    rating: 9,
    subjects: ["American literature"],
  }),
  demoBook({
    id: 9204,
    title: "The Master and Margarita",
    authors: ["Mikhail Bulgakov"],
    isbn13: "9780141180144",
    publishedYear: 1967,
    pageCount: 432,
    publisher: "Penguin Classics",
    shelfId: 9002,
    slotIndex: 3,
    rating: 9,
    subjects: ["Russian literature", "Satire"],
  }),
  demoBook({
    id: 9301,
    title: "Gödel, Escher, Bach",
    authors: ["Douglas Hofstadter"],
    isbn13: "9780465026562",
    publishedYear: 1979,
    pageCount: 777,
    publisher: "Basic Books",
    shelfId: 9003,
    slotIndex: 0,
    rating: 9,
    status: "reading",
    subjects: ["Mathematics", "Consciousness", "Music"],
    notes:
      "Demo marginalia: the canonical 'perpetually reading' book. The dialogues are the dessert; read them twice.",
  }),
  demoBook({
    id: 9302,
    title: "Structure and Interpretation of Computer Programs",
    authors: ["Harold Abelson", "Gerald Jay Sussman"],
    isbn13: "9780262510875",
    publishedYear: 1996,
    pageCount: 657,
    publisher: "MIT Press",
    shelfId: 9003,
    slotIndex: 1,
    rating: 10,
    subjects: ["Computer science", "Lisp"],
  }),
  demoBook({
    id: 9303,
    title: "The Pragmatic Programmer",
    authors: ["David Thomas", "Andrew Hunt"],
    isbn13: "9780135957059",
    publishedYear: 2019,
    pageCount: 352,
    publisher: "Addison-Wesley",
    shelfId: 9003,
    slotIndex: 2,
    rating: 8,
    subjects: ["Software engineering"],
  }),
  demoBook({
    id: 9304,
    title: "Thinking, Fast and Slow",
    authors: ["Daniel Kahneman"],
    isbn13: "9780374533557",
    publishedYear: 2011,
    pageCount: 499,
    publisher: "Farrar, Straus and Giroux",
    shelfId: 9003,
    slotIndex: 3,
    rating: 8,
    subjects: ["Psychology", "Decision-making"],
  }),
];
