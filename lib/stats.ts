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

/** One calendar day of Oura data. Fields are absent when the ring has no
    reading for that day (not worn, not synced), so charts can show gaps. */
export type OuraDay = {
  day: string;
  readiness?: number;
  sleepScore?: number;
  sleepHours?: number;
  hrv?: number;
  restingHr?: number;
  steps?: number;
};

export type OuraState = {
  /** Continuous calendar days, oldest first, ending at the latest day with data. */
  days: OuraDay[];
};

export const OURA_DAYS = 14;

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
  // Don't pin a miss: a provider that just got connected (or recovered from
  // an error) should show up on the next poll, not after the TTL.
  if (value != null) cache.set(key, { value, expiresAt: now + ttlMs });
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

type OuraDaily<T> = { data: T[]; next_token?: string | null };
type OuraDailyReadiness = {
  day: string;
  score: number | null;
};
type OuraDailySleep = {
  day: string;
  score: number | null;
};
type OuraDailyActivity = {
  day: string;
  steps: number | null;
};
type OuraSleep = {
  day: string;
  type?: string;
  total_sleep_duration: number | null;
  average_hrv: number | null;
  lowest_heart_rate: number | null;
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

class OuraUnauthorized extends Error {}

// Every record for [start, end], following Oura's pagination. Null on a
// non-auth failure so one bad endpoint doesn't blank the others.
async function ouraGet<T>(path: string, token: string, start: string, end: string): Promise<T[] | null> {
  const out: T[] = [];
  let next: string | null | undefined;
  do {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (next) params.set("next_token", next);
    const res = await fetch(`${OURA_BASE}/${path}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new OuraUnauthorized(await res.text());
    if (!res.ok) {
      console.error(`[oura] ${path} failed:`, res.status, await res.text());
      return null;
    }
    const page = (await res.json()) as OuraDaily<T>;
    out.push(...page.data);
    next = page.next_token;
  } while (next);
  return out;
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
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

// Retry once with a fresh token from the store if ours turns out stale
// (reconnected, or another instance rotated it).
async function withOuraAuth<T>(load: (token: string) => Promise<T | null>): Promise<T | null> {
  const attempt = async () => {
    const token = await getOuraAccessToken();
    return token ? load(token) : null;
  };
  try {
    try {
      return await attempt();
    } catch (err) {
      if (!(err instanceof OuraUnauthorized)) throw err;
      ouraTokens = null;
      return await attempt();
    }
  } catch (err) {
    console.error("[oura] fetch error:", err);
    return null;
  }
}

/** Every day from `from` to the latest day with data, oldest first. Days with
    no reading are present but empty, so charts show them as gaps. */
async function loadOuraDays(token: string, from: string): Promise<OuraDay[] | null> {
  // Oura days are the wearer's local dates, which can run a day ahead of or
  // behind UTC, so pad both ends and trim afterwards.
  const start = addDays(from, -1);
  const end = addDays(isoDay(new Date()), 1);
  const [readiness, sleepScores, sleeps, activity] = await Promise.all([
    ouraGet<OuraDailyReadiness>("daily_readiness", token, start, end),
    ouraGet<OuraDailySleep>("daily_sleep", token, start, end),
    ouraGet<OuraSleep>("sleep", token, start, end),
    ouraGet<OuraDailyActivity>("daily_activity", token, start, end),
  ]);

  const byDay = new Map<string, OuraDay>();
  const at = (day: string) => {
    let d = byDay.get(day);
    if (!d) byDay.set(day, (d = { day }));
    return d;
  };
  for (const r of readiness ?? []) if (r.score != null) at(r.day).readiness = r.score;
  for (const r of sleepScores ?? []) if (r.score != null) at(r.day).sleepScore = r.score;
  // Oura writes an activity record even on days the ring sat on the charger;
  // zero steps means "not worn", not a reading.
  for (const r of activity ?? []) if (r.steps) at(r.day).steps = r.steps;
  // Sleep periods include naps; only the main overnight sleep counts. HRV and
  // the overnight low heart rate (true resting bpm) come from it.
  for (const r of sleeps ?? []) {
    if (r.type !== "long_sleep") continue;
    const d = at(r.day);
    if (r.total_sleep_duration != null) d.sleepHours = +(r.total_sleep_duration / 3600).toFixed(1);
    if (r.average_hrv != null) d.hrv = r.average_hrv;
    if (r.lowest_heart_rate != null) d.restingHr = r.lowest_heart_rate;
  }
  const last = [...byDay.keys()].filter((d) => d >= from).sort().at(-1);
  if (!last) return null;

  const days: OuraDay[] = [];
  for (let day = from; day <= last; day = addDays(day, 1)) days.push(byDay.get(day) ?? { day });
  return days;
}

export async function fetchOuraNow(): Promise<OuraState | null> {
  if (!redisConfig()) return null;
  return cached("oura:now", 10 * 60_000, () =>
    withOuraAuth(async (token) => {
      const days = await loadOuraDays(token, addDays(isoDay(new Date()), -(OURA_DAYS + 1)));
      return days ? { days: days.slice(-OURA_DAYS) } : null;
    })
  );
}

/** Jan 1 through the latest day with data. Changes at most daily, so it's
    cached for an hour and only requested when a card is opened. */
export async function fetchOuraYtd(): Promise<OuraState | null> {
  if (!redisConfig()) return null;
  return cached("oura:ytd", 60 * 60_000, () =>
    withOuraAuth(async (token) => {
      const days = await loadOuraDays(token, `${new Date().getUTCFullYear()}-01-01`);
      return days ? { days } : null;
    })
  );
}

/* ── Demo fixtures (dev only, via /api/now?demo=…) ──────────── */

// Deterministic so screenshots are stable across runs.
function demoDays(): OuraDay[] {
  const today = isoDay(new Date());
  const steps = [9120, 11840, 7430, 13210, 6020, 10450, 15880, 8210, 4970, 12030, 17524, 12289, 5765, 3180];
  const ready = [81, 84, 77, 86, 79, undefined, 74, 83, 88, 72, 80, undefined, 73, 85];
  const sleep = [76, 82, 71, 85, 74, undefined, 66, 79, 88, 63, 69, undefined, 56, 81];
  const hrv = [52, 57, 49, 61, 55, undefined, 47, 58, 66, 51, 58, undefined, 63, 64];
  const rhr = [51, 49, 53, 48, 50, undefined, 54, 49, 46, 52, 51, undefined, 47, 48];
  const hours = [7.1, 7.8, 6.4, 8.2, 6.9, undefined, 5.9, 7.4, 8.6, 5.7, 6.6, undefined, 4.7, 7.6];
  return steps.map((s, i) => ({
    day: addDays(today, i - (steps.length - 1)),
    steps: s,
    readiness: ready[i],
    sleepScore: sleep[i],
    hrv: hrv[i],
    restingHr: rhr[i],
    sleepHours: hours[i],
  }));
}

// A plausible year: seasonal drift plus weekly rhythm, with a few unworn days.
export function demoYtd(): OuraState {
  const today = isoDay(new Date());
  const days: OuraDay[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let day = `${today.slice(0, 4)}-01-01`, i = 0; day <= today; day = addDays(day, 1), i++) {
    if (rand() < 0.04) {
      days.push({ day });
      continue;
    }
    const season = Math.sin((i / 365) * Math.PI * 2 - 1.2);
    const weekend = [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay());
    days.push({
      day,
      steps: Math.round(8200 + season * 2100 + (weekend ? 2600 : 0) + (rand() - 0.5) * 7000),
      readiness: Math.round(78 + season * 4 + (rand() - 0.5) * 18),
      sleepScore: Math.round(75 + season * 3 + (rand() - 0.5) * 22),
      hrv: Math.round(56 + season * 5 + (rand() - 0.5) * 20),
      restingHr: Math.round(50 - season * 2 + (rand() - 0.5) * 6),
      sleepHours: +(7 + (rand() - 0.5) * 2.4).toFixed(1),
    });
  }
  return { days };
}

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
  const oura: OuraState | null = state === "spotify" ? null : { days: demoDays() };
  return { spotify, oura, generatedAt: now };
}
