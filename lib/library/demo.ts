import type { Book, Library } from "./types";

// Shown when data/library.json doesn't exist — fresh clones, CI, and the
// public branch until the real library is published.

type Seed = [
  isbn13: string,
  title: string,
  author: string,
  year: number,
  pages: number,
  shelf: string,
  rating: number,
  subjects: string[],
  status?: Book["status"]
];

const SEEDS: Seed[] = [
  ["9780140449334", "Meditations", "Marcus Aurelius", 180, 304, "philosophy", 9, ["Stoicism", "Ethics"]],
  ["9780140442106", "Letters from a Stoic", "Seneca", 65, 254, "philosophy", 8, ["Stoicism"]],
  ["9780140455113", "The Republic", "Plato", -375, 416, "philosophy", 8, ["Political philosophy"]],
  ["9780140449235", "Beyond Good and Evil", "Friedrich Nietzsche", 1886, 240, "philosophy", 7, ["Philosophy"]],
  ["9780140449136", "Crime and Punishment", "Fyodor Dostoevsky", 1866, 720, "fiction", 10, ["Russian literature"]],
  ["9780142437247", "Moby-Dick", "Herman Melville", 1851, 720, "fiction", 8, ["American literature"]],
  ["9780142004234", "East of Eden", "John Steinbeck", 1952, 601, "fiction", 9, ["American literature"]],
  ["9780141180144", "The Master and Margarita", "Mikhail Bulgakov", 1967, 432, "fiction", 9, ["Russian literature", "Satire"]],
  ["9780465026562", "Gödel, Escher, Bach", "Douglas Hofstadter", 1979, 777, "systems", 9, ["Mathematics", "Consciousness"], "reading"],
  ["9780262510875", "Structure and Interpretation of Computer Programs", "Harold Abelson", 1996, 657, "systems", 10, ["Computer science"]],
  ["9780135957059", "The Pragmatic Programmer", "David Thomas", 2019, 352, "systems", 8, ["Software engineering"]],
  ["9780374533557", "Thinking, Fast and Slow", "Daniel Kahneman", 2011, 499, "systems", 8, ["Psychology"]],
];

export const demoLibrary: Library = {
  shelves: [
    { id: "philosophy", label: "Philosophy" },
    { id: "fiction", label: "Fiction" },
    { id: "systems", label: "Science & Systems" },
  ],
  books: SEEDS.map(
    ([isbn13, title, author, year, pages, shelf, rating, subjects, status]) => ({
      id: isbn13,
      isbn13,
      title,
      authors: [author],
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`,
      publishedYear: year,
      pageCount: pages,
      subjects,
      status: status ?? "finished",
      rating,
      shelf,
      notes:
        "Sample entry — run the Amazon import (see README) to fill the shelves with your own books.",
    })
  ),
};
