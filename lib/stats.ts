/**
 * Live-stats providers for the homepage "Right now" section.
 *
 * Each provider returns null when its env vars aren't configured, when the
 * upstream call fails, or when the user has nothing to show. The API routes
 * surface that null directly so the UI can gracefully render "—".
 *
 * Both providers cache responses in module-level memory with a short TTL.
 * Vercel warm-instance reuse keeps these caches effective; cold starts pay
 * one extra upstream call.
 *
 * Oura refresh tokens are single-use, so its token pair lives in Upstash
 * Redis (REST, no SDK). Seed it with `node scripts/connect.mjs oura`.
 */

export type SpotifyState =
  | {
      kind: "playing" | "paused";
      track: string;
      artist: string;
      album?: string;
      albumArt?: string;
      url?: string;
      progressMs: number;
      durationMs: number;
    }
  | {
      kind: "recent";
      track: string;
      artist: string;
      album?: string;
      albumArt?: string;
      url?: string;
      playedAt: string;
    };

export type OuraState = {
  readiness?: number;
  sleepScore?: number;
  sleepHours?: number;
  restingHr?: number;
  hrv?: number;
  day?: string;
};

export type NowSnapshot = {
  spotify: SpotifyState | null;
  oura: OuraState | null;
  generatedAt: number;
};

/* ── tiny TTL cache ─────────────────────────────────────────── */

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/* ── Spotify ────────────────────────────────────────────────── */

const SPOTIFY_NOW_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const SPOTIFY_RECENT_URL =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

let spotifyAccessToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const now = Date.now();
  if (spotifyAccessToken && spotifyAccessToken.expiresAt > now) {
    return spotifyAccessToken.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    console.error("[spotify] token refresh failed:", res.status);
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  spotifyAccessToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };
  return spotifyAccessToken.token;
}

type SpotifyTrack = {
  name: string;
  album?: { name?: string; images?: { url: string }[] };
  artists?: { name: string }[];
  external_urls?: { spotify?: string };
  duration_ms: number;
};

type TrackBase = {
  track: string;
  artist: string;
  album?: string;
  albumArt?: string;
  url?: string;
};

function trackBase(item: SpotifyTrack): TrackBase {
  return {
    track: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    album: item.album?.name,
    albumArt: item.album?.images?.[0]?.url,
    url: item.external_urls?.spotify,
  };
}

export async function fetchSpotifyNow(): Promise<SpotifyState | null> {
  return cached("spotify:now", 25_000, async () => {
    const token = await getSpotifyAccessToken();
    if (!token) return null;

    try {
      const live = await fetch(SPOTIFY_NOW_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (live.status === 200) {
        const data = (await live.json()) as {
          is_playing: boolean;
          progress_ms: number;
          item: SpotifyTrack | null;
        };
        if (data.item) {
          return {
            kind: data.is_playing ? "playing" : "paused",
            ...trackBase(data.item),
            progressMs: data.progress_ms,
            durationMs: data.item.duration_ms,
          };
        }
      } else if (live.status !== 204 && live.status !== 401) {
        console.error("[spotify] now-playing failed:", live.status);
      }

      const recent = await fetch(SPOTIFY_RECENT_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!recent.ok) {
        console.error("[spotify] recently-played failed:", recent.status);
        return null;
      }
      const recentData = (await recent.json()) as {
        items: { track: SpotifyTrack; played_at: string }[];
      };
      const first = recentData.items?.[0];
      if (!first) return null;
      return {
        kind: "recent",
        ...trackBase(first.track),
        playedAt: first.played_at,
      };
    } catch (err) {
      console.error("[spotify] fetch error:", err);
      return null;
    }
  });
}

/* ── Oura ───────────────────────────────────────────────────── */

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

type OuraDaily<T> = { data: T[] };
type OuraDailyReadiness = {
  day: string;
  score: number | null;
  contributors?: { resting_heart_rate?: number };
};
type OuraDailySleep = {
  day: string;
  score: number | null;
};
type OuraSleep = {
  day: string;
  total_sleep_duration: number | null;
  average_hrv: number | null;
  lowest_heart_rate: number | null;
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function ouraGet<T>(
  path: string,
  token: string
): Promise<OuraDaily<T> | null> {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 3);
  const url = `${OURA_BASE}/${path}?start_date=${isoDay(start)}&end_date=${isoDay(today)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`[oura] ${path} failed:`, res.status);
    return null;
  }
  return (await res.json()) as OuraDaily<T>;
}

function latestByDay<T extends { day: string }>(items: T[] | undefined): T | null {
  if (!items || items.length === 0) return null;
  return [...items].sort((a, b) => (a.day < b.day ? 1 : -1))[0];
}

/* Upstash Redis over REST. The Vercel Marketplace integration sets either
   the KV_* or UPSTASH_* names depending on how it was added. */
function redisConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(command: string[]): Promise<string | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`redis ${command[0]} failed: ${res.status}`);
  return ((await res.json()) as { result: string | null }).result;
}

export const OURA_TOKEN_KEY = "oura:tokens";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";

type OuraTokens = { accessToken: string; refreshToken: string; expiresAt: number };

let ouraTokens: OuraTokens | null = null;

async function loadOuraTokens(): Promise<OuraTokens | null> {
  const raw = await redis(["GET", OURA_TOKEN_KEY]);
  return raw ? (JSON.parse(raw) as OuraTokens) : null;
}

async function refreshOura(refreshToken: string): Promise<OuraTokens | null> {
  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const res = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    console.error("[oura] token refresh failed:", res.status);
    return null;
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const next: OuraTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 3600) * 1000,
  };
  await redis(["SET", OURA_TOKEN_KEY, JSON.stringify(next)]);
  return next;
}

async function getOuraAccessToken(): Promise<string | null> {
  if (ouraTokens && ouraTokens.expiresAt > Date.now()) return ouraTokens.accessToken;
  ouraTokens = await loadOuraTokens();
  if (!ouraTokens) return null;
  if (ouraTokens.expiresAt > Date.now()) return ouraTokens.accessToken;

  // Expired: rotate. If another instance rotated first, our refresh token is
  // spent, so re-read the store once before giving up.
  const rotated = await refreshOura(ouraTokens.refreshToken);
  if (rotated) {
    ouraTokens = rotated;
    return rotated.accessToken;
  }
  ouraTokens = await loadOuraTokens();
  return ouraTokens && ouraTokens.expiresAt > Date.now() ? ouraTokens.accessToken : null;
}

export async function fetchOuraNow(): Promise<OuraState | null> {
  if (!redisConfig()) return null;

  return cached("oura:now", 10 * 60_000, async () => {
    try {
      const token = await getOuraAccessToken();
      if (!token) return null;
      const [readinessRes, sleepScoreRes, sleepRes] = await Promise.all([
        ouraGet<OuraDailyReadiness>("daily_readiness", token),
        ouraGet<OuraDailySleep>("daily_sleep", token),
        ouraGet<OuraSleep>("sleep", token),
      ]);

      const readiness = latestByDay(readinessRes?.data);
      const sleepScore = latestByDay(sleepScoreRes?.data);
      const sleep = latestByDay(sleepRes?.data);

      if (!readiness && !sleepScore && !sleep) return null;

      const out: OuraState = {};
      if (readiness?.score != null) out.readiness = readiness.score;
      if (readiness?.contributors?.resting_heart_rate != null) {
        out.restingHr = readiness.contributors.resting_heart_rate;
      }
      if (sleepScore?.score != null) out.sleepScore = sleepScore.score;
      if (sleep?.total_sleep_duration != null) {
        out.sleepHours = +(sleep.total_sleep_duration / 3600).toFixed(1);
      }
      if (sleep?.average_hrv != null) out.hrv = sleep.average_hrv;
      if (sleep?.lowest_heart_rate != null && out.restingHr == null) {
        out.restingHr = sleep.lowest_heart_rate;
      }
      const day = readiness?.day || sleepScore?.day || sleep?.day;
      if (day) out.day = day;
      return out;
    } catch (err) {
      console.error("[oura] fetch error:", err);
      return null;
    }
  });
}

/* ── Demo fixtures (dev only, via /api/now?demo=…) ──────────── */

export function demoSnapshot(state: string): NowSnapshot {
  const now = Date.now();
  const track = {
    track: "Teardrop",
    artist: "Massive Attack",
    album: "Mezzanine",
    url: "https://open.spotify.com/",
  };
  const spotify: SpotifyState | null =
    state === "oura"
      ? null
      : state === "recent"
        ? { kind: "recent", ...track, playedAt: new Date(now - 47 * 60_000).toISOString() }
        : { kind: state === "paused" ? "paused" : "playing", ...track, progressMs: 118_000, durationMs: 330_000 };
  const oura: OuraState | null =
    state === "spotify"
      ? null
      : { readiness: 87, restingHr: 52, sleepScore: 78, sleepHours: 7.2, hrv: 64, day: new Date(now).toISOString().slice(0, 10) };
  return { spotify, oura, generatedAt: now };
}
