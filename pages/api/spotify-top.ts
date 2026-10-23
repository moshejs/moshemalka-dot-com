import type { NextApiRequest, NextApiResponse } from "next";
import {
  SPOTIFY_RANGES,
  demoSpotifyTop,
  fetchSpotifyTop,
  type SpotifyRange,
  type SpotifyTop,
} from "@/lib/stats";

export default async function handler(req: NextApiRequest, res: NextApiResponse<SpotifyTop | null>) {
  const range = (SPOTIFY_RANGES as string[]).includes(req.query.range as string)
    ? (req.query.range as SpotifyRange)
    : "long_term";

  // ?demo serves fixtures for local design work; never in production.
  if (process.env.NODE_ENV !== "production" && req.query.demo !== undefined) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(demoSpotifyTop(range));
  }

  const top = await fetchSpotifyTop(range);
  // Spotify recomputes these windows roughly daily.
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
  res.status(200).json(top);
}
