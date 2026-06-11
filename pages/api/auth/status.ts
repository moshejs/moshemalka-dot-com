import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req, res);
    return res.status(200).json({ unlocked: !!session.unlocked });
  } catch {
    // SESSION_SECRET not configured yet — treat as locked rather than 500.
    return res.status(200).json({ unlocked: false, configured: false });
  }
}
