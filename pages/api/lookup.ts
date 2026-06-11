import type { NextApiRequest, NextApiResponse } from "next";
import { lookupByIsbn, lookupByTitle } from "@/lib/openLibrary";
import { requireUnlocked } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await requireUnlocked(req, res))) return;

  const isbn = typeof req.query.isbn === "string" ? req.query.isbn : undefined;
  const title =
    typeof req.query.title === "string" ? req.query.title : undefined;
  const author =
    typeof req.query.author === "string" ? req.query.author : undefined;

  try {
    if (isbn) {
      const result = await lookupByIsbn(isbn);
      if (!result) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(result);
    }
    if (title) {
      const result = await lookupByTitle(title, author);
      if (!result) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(result);
    }
    return res
      .status(400)
      .json({ error: "Provide ?isbn= or ?title= (optional &author=)" });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Lookup failed" });
  }
}
