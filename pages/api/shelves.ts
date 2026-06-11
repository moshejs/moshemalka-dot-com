import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shelves } from "@/lib/db/schema";
import { requireUnlocked } from "@/lib/auth";
import { demoShelves, isDemoMode } from "@/lib/db/demo";

const NewShelfBody = z.object({
  label: z.string().min(1).max(120),
  sortOrder: z.number().int().default(0),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    if (!req.query.admin) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    }
    if (isDemoMode()) {
      res.setHeader("x-study-demo", "1");
      return res.status(200).json(demoShelves);
    }
    const rows = await db
      .select()
      .from(shelves)
      .orderBy(asc(shelves.sortOrder), asc(shelves.id));
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    if (isDemoMode()) {
      return res
        .status(503)
        .json({ error: "Demo mode — set DATABASE_URL to enable editing" });
    }
    if (!(await requireUnlocked(req, res))) return;
    const parsed = NewShelfBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const [row] = await db.insert(shelves).values(parsed.data).returning();
    return res.status(201).json(row);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
