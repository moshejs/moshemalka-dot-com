import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const bookStatus = pgEnum("book_status", [
  "reading",
  "finished",
  "abandoned",
  "want_to_read",
]);

export const shelves = pgTable("shelves", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  isbn13: varchar("isbn13", { length: 13 }),
  isbn10: varchar("isbn10", { length: 10 }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authors: text("authors").array().notNull().default([]),
  coverUrl: text("cover_url"),
  publisher: text("publisher"),
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  description: text("description"),
  subjects: text("subjects").array().notNull().default([]),
  source: varchar("source", { length: 32 }),
  sourceId: text("source_id"),
  dateStarted: timestamp("date_started"),
  dateFinished: timestamp("date_finished"),
  rating: integer("rating"),
  notes: text("notes"),
  status: bookStatus("status").notNull().default("finished"),
  shelfId: integer("shelf_id").references(() => shelves.id, {
    onDelete: "set null",
  }),
  slotIndex: integer("slot_index").notNull().default(0),
  spineColor: varchar("spine_color", { length: 7 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type Shelf = typeof shelves.$inferSelect;
export type NewShelf = typeof shelves.$inferInsert;
