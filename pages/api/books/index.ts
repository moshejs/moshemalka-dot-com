import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { books } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireUnlocked } from "@/lib/auth";
import { demoBooks, isDemoMode } from "@/lib/db/demo";

const NewBookBody = z.object({
  isbn13: z.string().length(13).optional().nullable(),
  isbn10: z.string().length(10).optional().nullable(),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  authors: z.array(z.string()).default([]),
  coverUrl: z.string().url().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishedYear: z.number().int().optional().nullable(),
  pageCount: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  subjects: z.array(z.string()).default([]),
  source: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z
    .enum(["reading", "finished", "abandoned", "want_to_read"])
    .default("finished"),
  shelfId: z.number().int().optional().nullable(),
  slotIndex: z.number().int().default(0),
  spineColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  dateStarted: z.string().datetime().optional().nullable(),
  dateFinished: z.string().datetime().optional().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Public endpoint: let the CDN absorb anonymous traffic so casual abuse
    // can't burn Neon compute. Admin reads use ?admin=1 to bypass the cache.
    if (!req.query.admin) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    }
    if (isDemoMode()) {
      res.setHeader("x-study-demo", "1");
      return res.status(200).json(demoBooks);
    }
    const rows = await db
      .select()
      .from(books)
      .orderBy(asc(books.shelfId), asc(books.slotIndex), asc(books.id));
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    if (isDemoMode()) {
      return res
        .status(503)
        .json({ error: "Demo mode — set DATABASE_URL to enable editing" });
    }
    if (!(await requireUnlocked(req, res))) return;
    const parsed = NewBookBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const [row] = await db
      .insert(books)
      .values({
        ...data,
        dateStarted: data.dateStarted ? new Date(data.dateStarted) : null,
        dateFinished: data.dateFinished ? new Date(data.dateFinished) : null,
      })
      .returning();
    return res.status(201).json(row);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
