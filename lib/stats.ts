/**
 * Live-stats providers for the homepage Signal strip.
 *
 * Each provider returns null when its env vars aren't configured, when the
 * upstream call fails, or when the user has nothing to show. The API routes
 * surface that null directly so the UI can gracefully render "—".
 *
 * Both providers cache responses in module-level memory with a short TTL.
 * Vercel warm-instance reuse keeps these caches effective; cold starts pay
 * one extra upstream call. We intentionally avoid an external KV.
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

export async function fetchOuraNow(): Promise<OuraState | null> {
  const token = process.env.OURA_PAT;
  if (!token) return null;

  return cached("oura:now", 10 * 60_000, async () => {
    try {
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
