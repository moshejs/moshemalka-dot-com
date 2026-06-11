import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { checkPassword, getSession } from "@/lib/auth";

const Body = z.object({ password: z.string().min(1) });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  try {
    if (!checkPassword(parsed.data.password)) {
      // Flat-rate delay to blunt online guessing against the single passphrase.
      await new Promise((r) => setTimeout(r, 500));
      return res.status(401).json({ error: "Wrong password" });
    }
    const session = await getSession(req, res);
    session.unlocked = true;
    await session.save();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("login misconfiguration:", err);
    return res.status(500).json({ error: "Auth not configured" });
  }
}
