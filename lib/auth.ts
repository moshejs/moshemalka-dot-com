import type { SessionOptions } from "iron-session";
import { getIronSession, type IronSession } from "iron-session";
import type { NextApiRequest, NextApiResponse } from "next";

export type StudySession = {
  unlocked?: boolean;
};

const COOKIE_PASSWORD = process.env.SESSION_SECRET;
const STUDY_PASSWORD = process.env.STUDY_PASSWORD;

if (!COOKIE_PASSWORD || COOKIE_PASSWORD.length < 32) {
  // Don't throw at import time so build doesn't blow up — throw on use.
}

export const sessionOptions: SessionOptions = {
  password: COOKIE_PASSWORD ?? "this-is-a-fallback-please-set-SESSION_SECRET-32+chars",
  cookieName: "study_session",
  // ttl governs the encrypted seal's lifetime; iron-session derives the cookie
  // maxAge from it (minus clock skew). Without it the seal dies at the 14-day
  // default while the cookie lives on.
  ttl: 60 * 60 * 24 * 30, // 30 days
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<IronSession<StudySession>> {
  if (!COOKIE_PASSWORD || COOKIE_PASSWORD.length < 32) {
    throw new Error(
      "SESSION_SECRET is not set or is shorter than 32 chars. Add it to .env.local."
    );
  }
  return getIronSession<StudySession>(req, res, sessionOptions);
}

export function checkPassword(input: string) {
  if (!STUDY_PASSWORD) {
    throw new Error("STUDY_PASSWORD is not set. Add it to .env.local.");
  }
  if (input.length !== STUDY_PASSWORD.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ STUDY_PASSWORD.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function requireUnlocked(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session.unlocked) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}
