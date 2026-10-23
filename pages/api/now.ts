import type { NextApiRequest, NextApiResponse } from "next";
import {
  demoSnapshot,
  fetchOuraNow,
  fetchSpotifyNow,
  type NowSnapshot,
} from "@/lib/stats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NowSnapshot>
) {
  // ?demo=<state> serves fixtures for local design work; never in production.
  if (process.env.NODE_ENV !== "production" && typeof req.query.demo === "string") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(demoSnapshot(req.query.demo));
  }

  const [spotify, oura] = await Promise.all([
    fetchSpotifyNow(),
    fetchOuraNow(),
  ]);

  // Edge cache: serve fresh up to 20s, allow stale-while-revalidate beyond.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=20, stale-while-revalidate=60"
  );
  res.status(200).json({ spotify, oura, generatedAt: Date.now() });
}
