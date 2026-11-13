import { useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import type { OuraPublic, OuraWeek } from "@/lib/ouraPublic";
import type { NowSnapshot, SpotifyRange, SpotifyState, SpotifyTop } from "@/lib/stats";
import {
  METRICS,
  latestWeekIndex,
  metricSpec,
  notableStanding,
  standing,
  type Standing,
  type WeekMetric,
} from "@/lib/insights";
import { LiveProvidersContext, NowSlot } from "@/components/NowSlot";
import { BAR_MAX, RADIUS, barPath, dayLabel, fmt, useWidth } from "@/components/viz";

const POLL_MS = 30_000;

// Dev-only: ?signal=playing|paused|recent|oura|spotify renders fixtures.
function demoParam(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return new URLSearchParams(window.location.search).get("signal");
}

/* ── Formatting ─────────────────────────────────────────────── */

function timeAgo(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"} ago`;
  if (m < 60) return unit(m, "minute");
  const h = Math.floor(m / 60);
  if (h < 24) return unit(h, "hour");
  return unit(Math.floor(h / 24), "day");
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Oct 26 – Nov 1": a published week, Monday to Sunday. */
const weekRange = (start: string) => `${dayLabel(start, "short")} – ${dayLabel(addDays(start, 6), "short")}`;
// The chart spans a year, so its end labels need one.
const monthYear = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const signedPct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v)}%`;

/** The figure as it's published: steps a day, a score, or ± percent. */
function valueText(metric: WeekMetric, v: number): string {
  return metricSpec(metric).relative ? signedPct(v) : fmt(v);
}

const UNIT: Record<WeekMetric, string> = {
  steps: "steps a day",
  readiness: "/100",
  sleepScore: "/100",
  hrvRel: "vs my avg",
  restingHrRel: "vs my avg",
};

/** How a week sits against the 12-month average, in words. */
function deltaText(metric: WeekMetric, diff: number, base: number, short = false): string {
  return short ? longDelta(metric, diff, base).replace("my average", "avg") : longDelta(metric, diff, base);
}

function longDelta(metric: WeekMetric, diff: number, base: number): string {
  const spec = metricSpec(metric);
  const side = diff > 0 ? "above" : "below";
  if (metric === "steps") {
    const pct = Math.round((Math.abs(diff) / base) * 100);
    return pct < 3 ? "about my average" : `${pct}% ${side} my average`;
  }
  if (spec.relative) return Math.abs(diff) < 1 ? "level with my average" : `${Math.abs(diff)}% ${side} my average`;
  const pts = Math.round(Math.abs(diff));
  return pts < 1 ? "level with my average" : `${pts} point${pts === 1 ? "" : "s"} ${side} my average`;
}

function sinceText(s: Standing, weeks: OuraWeek[]): string | null {
  const word = s.dir === "up" ? "highest" : "lowest";
  if (s.since === "year") return `${word} in ${s.count} weeks`;
  // "Highest since the week before" says nothing.
  if (s.since && s.at - s.since.at >= 4) return `${word} since the week of ${dayLabel(weeks[s.since.at].start, "short")}`;
  return null;
}

/** The standout figure as a phrase: "13,400 steps a day, 37% above my average". */
function standoutPhrase(s: Standing): string {
  const delta = deltaText(s.metric, s.diff, s.base);
  switch (s.metric) {
    case "steps":
      return `${fmt(s.value)} steps a day, ${delta}`;
    case "readiness":
      return `a readiness of ${s.value}, ${delta}`;
    case "sleepScore":
      return `a sleep score of ${s.value}, ${delta}`;
    case "hrvRel":
      return `HRV ${delta}`;
    case "restingHrRel":
      return `resting heart rate ${delta}`;
  }
}

/* ── Shared state ───────────────────────────────────────────── */

// The page renders three bands from one snapshot and one poll. The selected
// metric is shared too: a row in "Last full week" opens it on the year chart.
type NowState = { snap: NowSnapshot | null; failed: boolean };
let state: NowState = { snap: null, failed: false };
const listeners = new Set<() => void>();
const SERVER_STATE: NowState = { snap: null, failed: false };
let poller: { stop: () => void; poll: () => void } | null = null;

function publish(next: NowState) {
  state = next;
  listeners.forEach((l) => l());
}

function startPolling() {
  let ctl: AbortController | null = null;
  const demo = demoParam();
  const url = demo ? `/api/now?demo=${encodeURIComponent(demo)}` : "/api/now";

  async function poll() {
    ctl?.abort();
    ctl = new AbortController();
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      publish({ snap: (await res.json()) as NowSnapshot, failed: false });
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      console.warn("[live-stats] poll failed", err);
      // Keep showing the last good snapshot; only an empty page says so.
      if (!state.snap) publish({ snap: null, failed: true });
    }
  }

  poll();
  let interval = window.setInterval(poll, POLL_MS);
  const onVis = () => {
    window.clearInterval(interval);
    if (!document.hidden) {
      poll();
      interval = window.setInterval(poll, POLL_MS);
    }
  };
  document.addEventListener("visibilitychange", onVis);
  return {
    poll,
    stop() {
      ctl?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    },
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!poller) poller = startPolling();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && poller) {
      poller.stop();
      poller = null;
    }
  };
}

export function useNowState(): NowState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export function useNowSnapshot(): NowSnapshot | null {
  return useNowState().snap;
}

let selected: WeekMetric = "steps";
const metricListeners = new Set<() => void>();
function selectMetric(m: WeekMetric) {
  selected = m;
  metricListeners.forEach((l) => l());
}
function subscribeMetric(listener: () => void) {
  metricListeners.add(listener);
  return () => {
    metricListeners.delete(listener);
  };
}
function useSelectedMetric(): WeekMetric {
  return useSyncExternalStore(
    subscribeMetric,
    () => selected,
    () => "steps" as WeekMetric,
  );
}

const YEAR_ID = "now-year";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Open a metric on the year chart and take keyboard focus there. */
function showOnYearChart(m: WeekMetric) {
  selectMetric(m);
  const card = document.getElementById(YEAR_ID);
  if (!card) return;
  card.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  card.querySelector<SVGElement>("[role='slider']")?.focus({ preventScroll: true });
}

/* ── Spotify ────────────────────────────────────────────────── */

const RANGES: { id: SpotifyRange; label: string }[] = [
  { id: "short_term", label: "4 weeks" },
  { id: "medium_term", label: "6 months" },
  { id: "long_term", label: "12 months" },
];

const topRequests = new Map<SpotifyRange, Promise<SpotifyTop | null>>();

function loadTop(range: SpotifyRange): Promise<SpotifyTop | null> {
  let req = topRequests.get(range);
  if (!req) {
    const url = `/api/spotify-top?range=${range}${demoParam() ? "&demo" : ""}`;
    req = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<SpotifyTop | null>) : null))
      .catch(() => null);
    topRequests.set(range, req);
    req.then((top) => {
      if (!top) topRequests.delete(range);
    });
  }
  return req;
}

const NoteIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

// Spotify only offers its own rolling windows; there is no calendar-year view.
function OnRepeat() {
  const [range, setRange] = useState<SpotifyRange>("short_term");
  const [top, setTop] = useState<SpotifyTop | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const headId = useId();

  useEffect(() => {
    let live = true;
    loadTop(range).then((t) => {
      if (!live) return;
      setFailed(!t);
      if (t) setTop(t);
    });
    return () => {
      live = false;
    };
  }, [range, attempt]);

  // Keep the previous range on screen, dimmed, while the next one loads.
  const stale = top != null && top.range !== range;
  const rangeLabel = RANGES.find((r) => r.id === range)?.label;

  return (
    <div className="c-repeat" role="group" aria-labelledby={headId}>
      <div className="c-repeat__head">
        <p className="c-now__label" id={headId}>
          Most played · last {rangeLabel}
        </p>
        <div className="c-seg" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" aria-pressed={r.id === range} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {top ? (
        <div className={`c-repeat__body${stale ? " is-stale" : ""}`} aria-busy={stale}>
          <ol className="c-repeat__list">
            {top.tracks.map((t, i) => {
              const body = (
                <>
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="c-repeat__cover"
                      src={t.image}
                      alt=""
                      width="96"
                      height="96"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="c-repeat__cover">
                      <NoteIcon size={18} />
                    </span>
                  )}
                  <span className="c-repeat__text">
                    <span className="c-repeat__name">
                      <span className="c-repeat__rank">{i + 1}</span> <span dir="auto">{t.name}</span>
                    </span>
                    <span className="c-repeat__artist" dir="auto">
                      {t.artist}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={`${t.name}-${t.artist}`}>
                  {t.url ? (
                    <a className="c-repeat__item" href={t.url} target="_blank" rel="noopener noreferrer">
                      {body}
                      <span className="c-sr"> (opens Spotify)</span>
                    </a>
                  ) : (
                    <span className="c-repeat__item">{body}</span>
                  )}
                </li>
              );
            })}
          </ol>
          {top.artists.length ? (
            <p className="c-repeat__artists">
              <span className="c-repeat__artists-k">Top artists</span>{" "}
              {top.artists.map((a, i) => (
                <span key={a.name}>
                  {i ? <span aria-hidden="true"> · </span> : null}
                  {i ? <span className="c-sr">, </span> : null}
                  <span dir="auto">{a.name}</span>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : failed ? (
        <div className="c-repeat__msg">
          <p>Spotify didn’t send the most-played list this time.</p>
          <button type="button" className="c-retry" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <div className="c-repeat__body" aria-busy="true">
          <p className="c-sr">Loading most played…</p>
          <ol className="c-repeat__list" aria-hidden="true">
            {RANGES.concat(RANGES.slice(0, 2)).map((_, i) => (
              <li key={i}>
                <span className="c-repeat__item">
                  <span className="c-repeat__cover" />
                  <span className="c-repeat__text">
                    <span className="c-repeat__ghost" />
                    <span className="c-repeat__ghost c-repeat__ghost--short" />
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Listening({
  s,
  fetchedAt,
  now,
  solo,
}: {
  s: SpotifyState;
  fetchedAt: number;
  now: number;
  solo: boolean;
}) {
  const playing = s.kind === "playing";
  const progress =
    s.kind === "recent" ? 0 : Math.min(s.durationMs, s.progressMs + (playing ? now - fetchedAt : 0));
  const status =
    s.kind === "recent" ? `Last played · ${timeAgo(now - Date.parse(s.playedAt))}` : playing ? "Listening now" : "Paused";

  const song = (
    <>
      {s.albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="c-listen__art" src={s.albumArt} alt="" width="112" height="112" decoding="async" />
      ) : (
        <span className="c-listen__art">
          <NoteIcon />
        </span>
      )}
      <span className="c-listen__text">
        <span className="c-listen__track" dir="auto">
          {s.track}
        </span>
        <span className="c-listen__artist" dir="auto">
          {s.artist}
        </span>
        {s.album && s.album !== s.track && s.album !== s.artist ? (
          <span className="c-listen__album" dir="auto">
            {s.album}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className={`c-panel c-now__card c-listen${solo ? " c-listen--solo" : ""}`}>
      {s.albumArt ? (
        // The cover, blurred, lights the card. Decorative.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="c-listen__glow" src={s.albumArt} alt="" aria-hidden="true" width="64" height="64" />
      ) : null}
      <p className="c-now__label c-listen__status">
        <span className={`c-live${playing ? "" : " c-live--idle"}`} aria-hidden="true" />
        {status}
      </p>
      {s.url ? (
        <a className="c-listen__song" href={s.url} target="_blank" rel="noopener noreferrer">
          {song}
          <span className="c-sr"> (opens Spotify)</span>
        </a>
      ) : (
        <div className="c-listen__song">{song}</div>
      )}
      {s.kind !== "recent" ? (
        <div className="c-now__progress">
          <span>{clock(progress)}</span>
          <span
            className="c-now__bar"
            role="progressbar"
            aria-label="Song progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(s.durationMs / 1000)}
            aria-valuenow={Math.round(progress / 1000)}
            aria-valuetext={`${clock(progress)} of ${clock(s.durationMs)}`}
          >
            <span style={{ transform: `scaleX(${progress / s.durationMs})` }} />
          </span>
          <span>{clock(s.durationMs)}</span>
        </div>
      ) : null}
      <OnRepeat />
    </li>
  );
}

/* ── The state of the week, in a sentence ───────────────────── */

function Story({ spotify, oura, now }: { spotify: SpotifyState | null; oura: OuraPublic | null; now: number }) {
  let music = null;
  if (spotify) {
    const t = <strong dir="auto">{spotify.track}</strong>;
    const a = <strong dir="auto">{spotify.artist}</strong>;
    music =
      spotify.kind === "recent" ? (
        <>
          The last thing I played was {t} by {a}, {timeAgo(now - Date.parse(spotify.playedAt))}.
        </>
      ) : spotify.kind === "playing" ? (
        <>
          Right now I’m listening to {t} by {a}.
        </>
      ) : (
        <>
          I’ve paused {t} by {a}.
        </>
      );
  }

  let body = null;
  const at = oura ? latestWeekIndex(oura.weeks) : -1;
  if (oura && at >= 0) {
    const range = weekRange(oura.weeks[at].start);
    const n = notableStanding(oura);
    if (n) {
      const since = sinceText(n, oura.weeks);
      body = (
        <>
          My last full week ({range}) stood out for <strong>{standoutPhrase(n)}</strong>
          {since ? `, my ${since}` : ""}.
        </>
      );
    } else {
      const parts = (["readiness", "sleepScore", "steps"] as const).flatMap((m) => {
        const v = oura.weeks[at][m];
        if (v == null) return [];
        return [m === "steps" ? `${fmt(v)} steps a day` : `${metricSpec(m).label.toLowerCase()} ${v}`];
      });
      body = (
        <>
          My last full week ({range}) was close to my usual
          {parts.length ? (
            <>
              : <strong>{parts.join(", ")}</strong>
            </>
          ) : null}
          .
        </>
      );
    }
  }

  if (!music && !body) return null;
  return (
    <p className="c-story">
      {music}
      {music && body ? " " : null}
      {body}
    </p>
  );
}

/* ── Last full week, against the year ───────────────────────── */

/** One line per metric: every published week as a faint tick on the year's
    own range, the 12-month average as a taller tick, last week as the dot. */
function Strip({ values, s }: { values: (number | undefined)[]; s: Standing }) {
  const lo = Math.min(s.lo.value, s.base);
  const hi = Math.max(s.hi.value, s.base);
  const span = hi - lo || 1;
  const pos = (v: number) => `${(((v - lo) / span) * 100).toFixed(2)}%`;
  return (
    <span className="c-strip" aria-hidden="true" dir="ltr">
      {values.map((v, i) => (v == null ? null : <span key={i} className="c-strip__tick" style={{ left: pos(v) }} />))}
      <span className="c-strip__avg" style={{ left: pos(s.base) }} />
      <span className="c-strip__dot" style={{ left: pos(s.value) }} />
    </span>
  );
}

function WeekCard({ oura, solo }: { oura: OuraPublic; solo: boolean }) {
  const at = latestWeekIndex(oura.weeks);
  if (at < 0) return null;
  const rows = METRICS.flatMap((m) => {
    const s = standing(oura, m.id, at);
    return s ? [{ m, s }] : [];
  });
  if (!rows.length) return null;

  return (
    <li className={`c-panel c-now__card c-weekcard${solo ? " c-weekcard--solo" : ""}`}>
      <div className="c-weekcard__head">
        <p className="c-now__label">Last full week</p>
        <p className="c-weekcard__range">{weekRange(oura.weeks[at].start)}</p>
      </div>
      <p className="c-weekcard__key">
        <span className="c-weekcard__k">
          <span className="c-strip__dot c-strip__dot--key" aria-hidden="true" /> that week
        </span>
        <span className="c-weekcard__k">
          <span className="c-strip__avg c-strip__avg--key" aria-hidden="true" /> my 12-month avg
        </span>
        <span className="c-weekcard__k">
          <span className="c-strip__tick c-strip__tick--key" aria-hidden="true" /> my other weeks
        </span>
      </p>
      <ul className="c-weekcard__rows">
        {rows.map(({ m, s }) => {
          const good = s.dir !== "level" && (s.dir === "up") === m.upIsGood;
          return (
            <li key={m.id}>
              <button type="button" className="c-weekcard__row" onClick={() => showOnYearChart(m.id)}>
                <span className="c-weekcard__name">{m.label}</span>
                <span className="c-weekcard__value">
                  {valueText(m.id, s.value)}
                  {m.relative ? null : <span className="c-now__of">{m.id === "steps" ? "/day" : "/100"}</span>}
                </span>
                <Strip values={oura.weeks.map((w) => w[m.id])} s={s} />
                <span className={`c-weekcard__delta${good ? " is-good" : ""}`}>
                  {s.dir === "level" ? null : <span aria-hidden="true">{s.dir === "up" ? "▲ " : "▼ "}</span>}
                  {deltaText(m.id, s.diff, s.base, true)}
                </span>
                <span className="c-sr">
                  . Weekly range this year {valueText(m.id, s.lo.value)} to {valueText(m.id, s.hi.value)}. Show on
                  the 52-week chart.
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="c-weekcard__hint">Pick a row to see all {oura.weeks.length} weeks of it below.</p>
    </li>
  );
}

/* ── The year, one metric at a time ─────────────────────────── */

// The smallest half-range the chart zooms to, so an ordinary wobble never
// looks like a cliff.
const MIN_HALF: Record<WeekMetric, (base: number) => number> = {
  steps: (b) => b * 0.25,
  readiness: () => 6,
  sleepScore: () => 6,
  hrvRel: () => 10,
  restingHrRel: () => 10,
};

/** A bar from the average line to the value, rounded only at the data end. */
function devBar(x0: number, yv: number, bar: number, yb: number): string {
  if (yv <= yb) return barPath(x0, yv, bar, yb);
  const r = Math.min(RADIUS, yv - yb, bar / 2);
  return (
    `M${x0},${yb}V${yv - r}Q${x0},${yv} ${x0 + r},${yv}` +
    `H${x0 + bar - r}Q${x0 + bar},${yv} ${x0 + bar},${yv - r}V${yb}Z`
  );
}

function YearCard({ oura }: { oura: OuraPublic }) {
  const metric = useSelectedMetric();
  const spec = metricSpec(metric);
  const { weeks } = oura;
  const latest = latestWeekIndex(weeks);
  const s = standing(oura, metric, latest);
  const values = weeks.map((w) => w[metric]);
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const descId = useId();
  const n = weeks.length;

  const options = METRICS.filter((m) => weeks.some((w) => w[m.id] != null));
  // The chosen metric has no figures (a provider gap): fall back quietly.
  const fallback = s ? null : (options[0]?.id ?? null);
  useEffect(() => {
    if (fallback) selectMetric(fallback);
  }, [fallback]);
  if (!s) return null;

  const active = hover ?? pinned;
  const shown = active ?? s.at;
  const sv = values[shown];

  const H = width && width < 520 ? 156 : 196;
  const TOP = 8;
  const BOTTOM = 8;
  const half = MIN_HALF[metric](s.base);
  let lo = Math.min(s.lo.value, s.base);
  let hi = Math.max(s.hi.value, s.base);
  const pad = Math.max(0, half * 2 - (hi - lo)) / 2;
  lo -= pad;
  hi += pad;
  const span = (hi - lo) * 1.06 || 1;
  const min = lo - (hi - lo) * 0.03;
  const y = (v: number) => TOP + (1 - (v - min) / span) * (H - TOP - BOTTOM);
  const slot = width / n;
  const bar = Math.max(2, Math.min(BAR_MAX, slot - 2));
  const yb = y(s.base);

  const readout =
    sv == null
      ? `Week of ${weekRange(weeks[shown].start)}: not enough readings`
      : spec.relative
        ? `Week of ${weekRange(weeks[shown].start)}: ${spec.label} ${deltaText(metric, sv, 0)}`
        : `Week of ${weekRange(weeks[shown].start)}: ${valueText(metric, sv)}${
            metric === "steps" ? " steps a day" : " out of 100"
          }, ${deltaText(metric, sv - s.base, s.base)}`;

  const at = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - rect.left) / rect.width) * n)));
  };
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const from = pinned ?? s.at;
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? from - 1
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? from + 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : e.key === "Escape"
                ? null
                : undefined;
    if (next === undefined) return;
    e.preventDefault();
    setHover(null);
    setPinned(next == null ? null : Math.max(0, Math.min(n - 1, next)));
  };

  // The tip sits beside the crosshair, on whichever side has room, so it
  // never covers the week it describes.
  const crossX = shown * slot + slot / 2;
  const tipRight = crossX < width / 2;
  const pick = (i: number) => setPinned((p) => (p === i ? null : i));

  return (
    <li className="c-panel c-now__card c-year" id={YEAR_ID}>
      <div className="c-year__head">
        <div className="c-year__title">
          <p className="c-now__label">{spec.label}, week by week</p>
          <p className="c-year__sub">
            {spec.relative
              ? `Each bar is a week’s ${spec.label} as a percentage above or below my 12-month average. Absolute figures stay private.`
              : `Each bar is a week’s daily average, measured from my 12-month average of ${fmt(s.base)}${
                  metric === "steps" ? " steps" : ""
                }.`}
          </p>
        </div>
        <div className="c-seg c-seg--wrap" role="group" aria-label="Metric">
          {options.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === metric}
              onClick={() => {
                setHover(null);
                selectMetric(m.id);
              }}
            >
              {m.short}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="c-year__plot" dir="ltr">
        {width ? (
          <>
            <svg
              className="c-year__svg"
              width={width}
              height={H}
              role="slider"
              tabIndex={0}
              aria-label={`${spec.label}, ${n} weeks`}
              aria-describedby={descId}
              aria-valuemin={1}
              aria-valuemax={n}
              aria-valuenow={shown + 1}
              aria-valuetext={readout}
              onPointerMove={(e) => setHover(at(e))}
              onPointerLeave={() => setHover(null)}
              onPointerDown={(e) => pick(at(e))}
              onKeyDown={onKeyDown}
              onBlur={() => setHover(null)}
            >
              <g key={metric} className="c-year__bars">
                {values.map((v, i) =>
                  v == null ? null : (
                    <path
                      key={weeks[i].start}
                      d={devBar(i * slot + (slot - bar) / 2, Math.abs(y(v) - yb) < 1 ? yb - 1 : y(v), bar, yb)}
                      className={`c-year__bar${v < s.base ? " is-below" : ""}${i === s.at ? " is-latest" : ""}${
                        i === active ? " is-active" : ""
                      }`}
                      style={{ animationDelay: `${Math.round(i * 6)}ms` }}
                    />
                  ),
                )}
              </g>
              <line className="c-year__avg" x1={0} x2={width} y1={yb} y2={yb} />
              {active != null ? (
                <line className="c-year__cross" x1={shown * slot + slot / 2} x2={shown * slot + slot / 2} y1={0} y2={H} />
              ) : null}
            </svg>
            {active != null ? (
              <div
                className={`c-tip${tipRight ? "" : " c-tip--left"}`}
                style={{ left: tipRight ? crossX + 10 : crossX - 10 }}
                aria-hidden="true"
              >
                <span className="c-tip__value">
                  {sv == null ? "No data" : valueText(metric, sv)}
                  {sv != null && !spec.relative ? (
                    <span className="c-now__of">{metric === "steps" ? "/day" : "/100"}</span>
                  ) : null}
                </span>
                <span className="c-tip__when">Week of {dayLabel(weeks[shown].start, "short")}</span>
                {sv != null && !spec.relative ? (
                  <span className="c-tip__delta">{deltaText(metric, sv - s.base, s.base, true)}</span>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ height: H }} />
        )}
      </div>
      <div className="c-year__axis" aria-hidden="true" dir="ltr">
        <span>{monthYear(weeks[0].start)}</span>
        <span className="c-year__avgkey">
          <span className="c-year__avgline" /> my 12-month avg
        </span>
        <span>{monthYear(weeks[n - 1].start)}</span>
      </div>
      <p className="c-year__readout">{readout}</p>
      <p className="c-sr" id={descId}>
        Arrow keys step through the weeks; Home and End jump to the first and last; Escape returns to the latest.
      </p>

      <dl className="c-year__facts">
        <div>
          <dt>Highest week</dt>
          <dd>
            <button type="button" className="c-fact" aria-pressed={pinned === s.hi.at} onClick={() => pick(s.hi.at)}>
              {valueText(metric, s.hi.value)}
              <span>week of {dayLabel(weeks[s.hi.at].start, "short")}</span>
            </button>
          </dd>
        </div>
        <div>
          <dt>Lowest week</dt>
          <dd>
            <button type="button" className="c-fact" aria-pressed={pinned === s.lo.at} onClick={() => pick(s.lo.at)}>
              {valueText(metric, s.lo.value)}
              <span>week of {dayLabel(weeks[s.lo.at].start, "short")}</span>
            </button>
          </dd>
        </div>
        <div>
          <dt>Above my average</dt>
          <dd className="c-fact c-fact--static">
            {s.above} of {s.count}
            <span>weeks with readings</span>
          </dd>
        </div>
        {metric === "steps" && oura.stepsTotal ? (
          <div>
            <dt>In {n} weeks</dt>
            <dd className="c-fact c-fact--static">
              {(oura.stepsTotal / 1e6).toFixed(2)}M<span>steps in all</span>
            </dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

// Every plotted value, reachable without hovering.
function OuraTable({ weeks }: { weeks: OuraWeek[] }) {
  const cell = (v: number | undefined) => (v == null ? "—" : fmt(v));
  const pct = (v: number | undefined) => (v == null ? "—" : signedPct(v));
  // .c-sr on the table itself doesn't clip its rows (tables ignore the 1px
  // box), so the wrapper does the hiding.
  return (
    <div className="c-sr">
      <table>
        <caption>Oura weekly averages, published a week behind</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Steps a day</th>
            <th scope="col">Readiness</th>
            <th scope="col">Sleep score</th>
            <th scope="col">HRV vs 12-month average</th>
            <th scope="col">Resting heart rate vs 12-month average</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start}>
              <th scope="row">{dayLabel(w.start, "short")}</th>
              <td>{cell(w.steps)}</td>
              <td>{cell(w.readiness)}</td>
              <td>{cell(w.sleepScore)}</td>
              <td>{pct(w.hrvRel)}</td>
              <td>{pct(w.restingHrRel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Sections ───────────────────────────────────────────────── */

/** Under the hero: a sentence on the state of things, what's playing, and
    the latest published week against the year. */
export function NowStrip() {
  const { snap, failed } = useNowState();
  const providers = useContext(LiveProvidersContext);
  const [now, setNow] = useState(() => Date.now());

  // Fetch most-played alongside the first poll rather than after it.
  const warmed = useRef(false);
  useEffect(() => {
    if (warmed.current || !(providers.spotify || demoParam())) return;
    warmed.current = true;
    loadTop("short_term");
  }, [providers.spotify]);

  // Advance the song's progress between polls, and keep "x minutes ago" true.
  const kind = snap?.spotify?.kind;
  useEffect(() => {
    if (!kind) return;
    const id = window.setInterval(() => setNow(Date.now()), kind === "playing" ? 1000 : 30_000);
    return () => window.clearInterval(id);
  }, [kind]);

  if (!snap) {
    if (!failed) return <NowSlot band="live" />;
    return (
      <div className="c-now c-now--live" role="group" aria-labelledby="now-h">
        <p className="c-now__head">
          <span id="now-h">Right now</span>
        </p>
        <div className="c-panel c-now__error" role="status">
          <p>Spotify and Oura aren’t answering at the moment, so there’s nothing live to show. It’ll try again shortly.</p>
          <button type="button" className="c-retry" onClick={() => poller?.poll()}>
            Try again now
          </button>
        </div>
      </div>
    );
  }
  // Nothing connected (or every provider came back empty): render nothing.
  if (!snap.spotify && !snap.oura) return null;
  const { spotify, oura } = snap;
  const clockNow = Math.max(now, snap.generatedAt);
  const hasWeek = !!oura && latestWeekIndex(oura.weeks) >= 0;

  return (
    <div className="c-now c-now--live" role="group" aria-labelledby="now-h">
      <p className="c-now__head">
        <span id="now-h">Right now</span>
        <span className="c-now__source">
          {[spotify && "Live from Spotify", oura && "Oura weekly averages, a week behind"].filter(Boolean).join(" · ")}
        </span>
      </p>
      <Story spotify={spotify} oura={oura} now={clockNow} />
      <ul className="c-now__grid">
        {spotify ? <Listening s={spotify} fetchedAt={snap.generatedAt} now={clockNow} solo={!hasWeek} /> : null}
        {oura && hasWeek ? <WeekCard oura={oura} solo={!spotify} /> : null}
      </ul>
    </div>
  );
}

/** Under the strip: the last 52 weeks, one metric at a time. */
export function NowTrends() {
  const { snap, failed } = useNowState();
  if (!snap) return failed ? null : <NowSlot band="trends" />;
  const oura = snap.oura;
  if (!oura || latestWeekIndex(oura.weeks) < 0) return null;
  const { weeks } = oura;

  return (
    <div className="c-now c-now--trends" role="group" aria-labelledby="trends-h">
      <p className="c-now__head">
        <span id="trends-h">The last {weeks.length} weeks</span>
        <span className="c-now__source">Oura · weekly averages through {dayLabel(oura.through, "short")}</span>
      </p>
      <ul className="c-now__grid">
        <YearCard oura={oura} />
      </ul>
      <OuraTable weeks={weeks} />
    </div>
  );
}
