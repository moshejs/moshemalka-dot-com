import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { books } from "@/lib/db/schema";
import { requireUnlocked } from "@/lib/auth";
import { demoBooks, isDemoMode } from "@/lib/db/demo";

const PatchBody = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  authors: z.array(z.string()).optional(),
  coverUrl: z.string().url().nullable().optional(),
  publisher: z.string().nullable().optional(),
  publishedYear: z.number().int().nullable().optional(),
  pageCount: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  subjects: z.array(z.string()).optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z
    .enum(["reading", "finished", "abandoned", "want_to_read"])
    .optional(),
  shelfId: z.number().int().nullable().optional(),
  slotIndex: z.number().int().optional(),
  spineColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  dateStarted: z.string().datetime().nullable().optional(),
  dateFinished: z.string().datetime().nullable().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (req.method === "GET" && !req.query.admin) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  }

  if (isDemoMode()) {
    if (req.method === "GET") {
      const row = demoBooks.find((b) => b.id === id);
      if (!row) return res.status(404).json({ error: "Not found" });
      res.setHeader("x-study-demo", "1");
      return res.status(200).json(row);
    }
    return res
      .status(503)
      .json({ error: "Demo mode — set DATABASE_URL to enable editing" });
  }

  if (req.method === "GET") {
    const [row] = await db.select().from(books).where(eq(books.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(row);
  }

  if (req.method === "PATCH") {
    if (!(await requireUnlocked(req, res))) return;
    const parsed = PatchBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const [row] = await db
      .update(books)
      .set({
        ...data,
        dateStarted:
          data.dateStarted === undefined
            ? undefined
            : data.dateStarted === null
            ? null
            : new Date(data.dateStarted),
        dateFinished:
          data.dateFinished === undefined
            ? undefined
            : data.dateFinished === null
            ? null
            : new Date(data.dateFinished),
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(row);
  }

  if (req.method === "DELETE") {
    if (!(await requireUnlocked(req, res))) return;
    const deleted = await db.delete(books).where(eq(books.id, id)).returning();
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
