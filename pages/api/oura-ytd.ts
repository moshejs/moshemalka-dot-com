import type { NextApiRequest, NextApiResponse } from "next";
import { demoYtd, fetchOuraYtd, type OuraState } from "@/lib/stats";

export default async function handler(req: NextApiRequest, res: NextApiResponse<OuraState | null>) {
  // ?demo serves a fixture year for local design work; never in production.
  if (process.env.NODE_ENV !== "production" && req.query.demo !== undefined) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(demoYtd());
  }

  const ytd = await fetchOuraYtd();
  // Year-to-date only moves once a day; let the edge hold it for an hour.
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json(ytd);
}
