import { useEffect, useId, useState } from "react";
import type { OuraPublic, OuraWeek } from "@/lib/ouraPublic";
import type { NowSnapshot, SpotifyRange, SpotifyState, SpotifyTop } from "@/lib/stats";
import { NowSlot } from "@/components/NowSlot";
import {
  BAR_MAX,
  PAD,
  barPath,
  dayLabel,
  fmt,
  mean,
  useScrub,
  useSize,
  useWidth,
  type ScrubHandlers,
} from "@/components/viz";

const POLL_MS = 30_000;

function timeAgo(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Dev-only: ?signal=playing|paused|recent|oura|spotify renders fixtures.
function demoParam(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return new URLSearchParams(window.location.search).get("signal");
}

/* ── Formatting ─────────────────────────────────────────────── */

/* Oura figures are weekly averages that end a week ago; HRV and resting
   heart rate arrive only as a percentage of the 12-month average. The rules
   live in lib/ouraPublic.ts: nothing daily ever reaches the browser. */
type Metric = "readiness" | "sleepScore" | "steps" | "hrvRel" | "restingHrRel";

function series(weeks: OuraWeek[], key: Metric): (number | undefined)[] {
  return weeks.map((w) => w[key]);
}

function lastIndex(values: (number | undefined)[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return i;
  return -1;
}

const weekOf = (start: string) => `Week of ${dayLabel(start, "short")}`;
// The chart spans a year, so its end labels need one.
const monthYear = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const signedPct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v)}%`;

function Delta({
  value,
  base,
  upIsGood,
  format,
}: {
  value: number;
  base: number | undefined;
  upIsGood: boolean;
  format: (diff: number, base: number) => string;
}) {
  if (base == null) return <span className="c-delta">&nbsp;</span>;
  const diff = value - base;
  if (Math.abs(diff) < 0.5) return <span className="c-delta">level with 12-month avg</span>;
  const up = diff > 0;
  return (
    <span className={`c-delta${up === upIsGood ? " is-good" : ""}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="c-sr">{up ? "up" : "down"}</span> {format(Math.abs(diff), base)} vs 12-month
      avg
    </span>
  );
}

/* ── Chart plumbing ─────────────────────────────────────────── */

// Fills its container's height when the card has room (a tile stretched to
// match a taller neighbour), never less than SPARK_H.
const SPARK_MAX = 96;

function Sparkline({
  values,
  width,
  height,
  active,
  label,
  handlers,
  base,
  minSpan,
}: {
  values: (number | undefined)[];
  width: number;
  height: number;
  active: number | null;
  label: string;
  handlers: ScrubHandlers;
  /** The average the weeks are read against, drawn as a hairline. */
  base?: number;
  /** Smallest value range the chart will zoom in to. */
  minSpan?: number;
}) {
  const defined = values.filter((v): v is number => v != null);
  if (!width || defined.length < 2) return null;
  const SPARK_H = Math.round(Math.min(SPARK_MAX, Math.max(height, 34)));
  // Never zoom in tighter than ±10% of the average, so a small wobble
  // doesn't read as a dramatic swing when the chart is tall.
  const lo = Math.min(...defined, base ?? Infinity);
  const hi = Math.max(...defined, base ?? -Infinity);
  const floor = minSpan ?? Math.abs(mean(defined)) * 0.2;
  const pad = Math.max(0, floor - (hi - lo)) / 2;
  const min = lo - pad;
  const span = hi - lo + pad * 2 || 1;
  const step = (width - PAD * 2) / (values.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => PAD + (1 - (v - min) / span) * (SPARK_H - PAD * 2);

  // Break the line at missing weeks instead of bridging them.
  const runs: string[] = [];
  let run = "";
  values.forEach((v, i) => {
    if (v == null) {
      if (run.includes("L")) runs.push(run);
      run = "";
      return;
    }
    run += `${run ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (run.includes("L")) runs.push(run);

  const last = lastIndex(values);
  const marker = active != null && values[active] != null ? active : last;

  return (
    <svg className="c-spark" width={width} height={SPARK_H} aria-label={label} {...handlers}>
      {base != null ? (
        <line className="c-steps__avgline" x1={0} x2={width} y1={y(base)} y2={y(base)} />
      ) : null}
      {runs.map((d) => (
        <path key={d} d={d} className="c-spark__line" />
      ))}
      {/* A week isolated between two gaps still gets a mark. */}
      {values.map((v, i) =>
        v != null && values[i - 1] == null && values[i + 1] == null ? (
          <circle key={i} cx={x(i)} cy={y(v)} r={2} className="c-spark__lone" />
        ) : null,
      )}
      {active != null ? (
        <line className="c-spark__cross" x1={x(active)} x2={x(active)} y1={0} y2={SPARK_H} />
      ) : null}
      <circle cx={x(marker)} cy={y(values[marker] as number)} r={4} className="c-spark__end" />
    </svg>
  );
}

function useToggle() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return { open, panelId: `ytd-${id.replace(/:/g, "")}`, toggle: () => setOpen((o) => !o) };
}

function YtdToggle({
  open,
  panelId,
  label,
  onClick,
  text = "YTD",
}: {
  open: boolean;
  panelId: string;
  label: string;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      type="button"
      className="c-ytd-toggle"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onClick}
    >
      {text}
      <span className="c-sr"> {label}</span>
      <svg className="c-chevron" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m6 9 6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

/* ── Oura tiles ─────────────────────────────────────────────── */

/** One weekly metric: the latest published week, how it sits against the
    12-month average, and the year of weeks behind it. `relative` metrics are
    already a percentage of that average, so the figure is the comparison. */
function TrendTile({
  label,
  weeks,
  metric,
  unit = "",
  upIsGood,
  average,
  relative = false,
}: {
  label: string;
  weeks: OuraWeek[];
  metric: Metric;
  unit?: string;
  upIsGood: boolean;
  average?: number;
  relative?: boolean;
}) {
  const values = series(weeks, metric);
  const last = lastIndex(values);
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  if (last < 0) return null;

  const shown = active ?? last;
  const v = values[shown];
  const latest = values[last] as number;

  return (
    <li className="c-panel c-now__card">
      <div className="c-now__top">
        <p className="c-now__label">{label}</p>
      </div>
      <p className="c-now__score">
        {v == null ? "—" : relative ? signedPct(v) : fmt(v)}
        <span className="c-now__of">{unit}</span>
      </p>
      {active != null ? (
        <span className="c-delta" aria-hidden="true">
          &nbsp;
        </span>
      ) : relative ? (
        <span className={`c-delta${latest !== 0 && latest > 0 === upIsGood ? " is-good" : ""}`}>
          {latest === 0 ? "level with" : latest > 0 ? "above" : "below"} my 12-month avg
        </span>
      ) : (
        <Delta value={latest} base={average} upIsGood={upIsGood} format={(d) => `${Math.round(d)}`} />
      )}
      <div ref={ref} className="c-now__plot c-now__plot--fill">
        <Sparkline
          values={values}
          width={width}
          height={height}
          active={active}
          label={`${label}, weekly average, last ${weeks.length} weeks`}
          handlers={handlers}
          base={relative ? 0 : average}
          minSpan={relative ? 20 : 10}
        />
      </div>
      <p className="c-now__detail" aria-live="polite">
        {weekOf(weeks[shown].start)}
        {v == null ? " · not enough readings" : ""}
      </p>
    </li>
  );
}

const STEPS_H = 92;

function StepsCard({ oura }: { oura: OuraPublic }) {
  const { weeks } = oura;
  const values = series(weeks, "steps");
  const last = lastIndex(values);
  const [ref, width] = useWidth<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  if (last < 0) return null;

  const defined = values.filter((v): v is number => v != null);
  const avg = oura.average.steps ?? mean(defined);
  const max = Math.max(...defined, avg) * 1.08;
  const slot = width / values.length;
  const bar = Math.max(2, Math.min(BAR_MAX, slot - 2));
  const top = (v: number) => STEPS_H - (v / max) * STEPS_H;

  const shown = active ?? last;
  const sv = values[shown];
  const total = oura.stepsTotal;

  return (
    <li className="c-panel c-now__card c-now__card--wide">
      <div className="c-now__top">
        <p className="c-now__label">Steps</p>
      </div>
      <div className="c-steps__head">
        <div className="c-steps__figure">
          <p className="c-now__score">
            {fmt(values[last] as number)}
            <span className="c-now__of">a day</span>
          </p>
          <Delta
            value={values[last] as number}
            base={avg}
            upIsGood
            format={(d, base) => `${Math.round((d / base) * 100)}%`}
          />
        </div>
        <p className="c-steps__avg">
          <span className="c-steps__key" aria-hidden="true" />
          12-month avg {fmt(avg)}/day
        </p>
      </div>
      <div ref={ref} className="c-now__plot">
        {width ? (
          <svg
            className="c-steps"
            width={width}
            height={STEPS_H}
            aria-label={`Steps, daily average by week, last ${weeks.length} weeks`}
            {...handlers}
          >
            {values.map((v, i) =>
              v == null ? null : (
                <path
                  key={weeks[i].start}
                  d={barPath(i * slot + (slot - bar) / 2, top(v), bar, STEPS_H)}
                  className={`c-steps__bar${i === last ? " is-latest" : ""}${i === active ? " is-active" : ""}`}
                />
              ),
            )}
            <line className="c-steps__avgline" x1={0} x2={width} y1={top(avg)} y2={top(avg)} />
          </svg>
        ) : (
          <div style={{ height: STEPS_H }} />
        )}
      </div>
      <div className="c-steps__axis" aria-hidden="true">
        <span>{monthYear(weeks[0].start)}</span>
        {total ? <span>about {(total / 1e6).toFixed(2)}M steps</span> : null}
        <span>{monthYear(weeks[weeks.length - 1].start)}</span>
      </div>
      <p className="c-now__detail" aria-live="polite">
        {weekOf(weeks[shown].start)} ·{" "}
        {sv == null ? "not enough readings" : `${fmt(sv)} steps a day`}
      </p>
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

// Spotify only offers its own rolling windows; there is no calendar-year view.
function SpotifyTopPanel({ id }: { id: string }) {
  const [range, setRange] = useState<SpotifyRange>("long_term");
  const [top, setTop] = useState<SpotifyTop | null>(null);
  const [failed, setFailed] = useState(false);
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
  }, [range]);

  // Keep the previous range on screen, dimmed, while the next one loads.
  const stale = top != null && top.range !== range;
  return (
    <div id={id} className="c-ytd">
      <div className="c-ytd__head">
        <p className="c-ytd__title">Most played</p>
        <div className="c-seg" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === range}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {top ? (
        <div className={`c-top${stale ? " is-stale" : ""}`} aria-busy={stale}>
          <div>
            <p className="c-now__label">Artists</p>
            <ol className="c-top__list">
              {top.artists.map((a, i) => (
                <li key={a.name}>
                  <span className="c-top__rank">{i + 1}</span>
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="c-top__img c-top__img--round"
                      src={a.image}
                      alt=""
                      width="36"
                      height="36"
                    />
                  ) : (
                    <span className="c-top__img c-top__img--round" aria-hidden="true" />
                  )}
                  <span className="c-top__text">
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" dir="auto">
                        {a.name}
                      </a>
                    ) : (
                      <span dir="auto">{a.name}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="c-now__label">Tracks</p>
            <ol className="c-top__list">
              {top.tracks.map((t, i) => (
                <li key={`${t.name}-${t.artist}`}>
                  <span className="c-top__rank">{i + 1}</span>
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="c-top__img" src={t.image} alt="" width="36" height="36" />
                  ) : (
                    <span className="c-top__img" aria-hidden="true" />
                  )}
                  <span className="c-top__text">
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" dir="auto">
                        {t.name}
                      </a>
                    ) : (
                      <span dir="auto">{t.name}</span>
                    )}
                    <span className="c-top__sub" dir="auto">
                      {t.artist}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <p className="c-now__detail">{failed ? "Couldn’t load top artists." : "Loading…"}</p>
      )}
      <p className="c-now__detail">Spotify’s rolling windows; it has no calendar-year view.</p>
    </div>
  );
}

function Listening({ s, fetchedAt, now }: { s: SpotifyState; fetchedAt: number; now: number }) {
  const playing = s.kind === "playing";
  const { open, panelId, toggle } = useToggle();
  const progress =
    s.kind === "recent"
      ? 0
      : Math.min(s.durationMs, s.progressMs + (playing ? now - fetchedAt : 0));
  const status =
    s.kind === "recent"
      ? `Played ${timeAgo(now - Date.parse(s.playedAt))}`
      : s.kind === "paused"
        ? "Paused"
        : "Listening";

  return (
    <li
      className={`c-panel c-now__card c-now__card--wide c-now__card--listen${open ? " is-open" : ""}`}
    >
      <div className="c-now__top">
        <p className="c-now__label">
          {playing ? <span className="c-live c-live--pulse" aria-hidden="true" /> : null}
          {status}
        </p>
        <YtdToggle
          open={open}
          panelId={panelId}
          label="most played on Spotify"
          text="Top"
          onClick={toggle}
        />
      </div>
      <div className="c-now__song">
        {s.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="c-now__art"
            src={s.albumArt}
            alt=""
            width="52"
            height="52"
            decoding="async"
          />
        ) : (
          <span className="c-now__art" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>
        )}
        <div className="c-now__song-text">
          {s.url ? (
            <a
              className="c-now__track"
              dir="auto"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.track}
            </a>
          ) : (
            <span className="c-now__track" dir="auto">
              {s.track}
            </span>
          )}
          <span className="c-now__artist" dir="auto">
            {s.artist}
          </span>
        </div>
      </div>
      {s.kind !== "recent" ? (
        <div className="c-now__progress">
          <span>{clock(progress)}</span>
          <span className="c-now__bar" aria-hidden="true">
            <span style={{ width: `${(progress / s.durationMs) * 100}%` }} />
          </span>
          <span>{clock(s.durationMs)}</span>
        </div>
      ) : null}
      {open ? <SpotifyTopPanel id={panelId} /> : null}
    </li>
  );
}

/* ── Shared snapshot ────────────────────────────────────────── */

// The hero renders two halves of this section (one per column); both read the
// same snapshot from a single poll instead of polling twice.
type Listener = (snap: NowSnapshot) => void;
const listeners = new Set<Listener>();
let latest: NowSnapshot | null = null;
let stopPolling: (() => void) | null = null;

function startPolling() {
  let ctl: AbortController | null = null;
  const demo = demoParam();
  const url = demo ? `/api/now?demo=${encodeURIComponent(demo)}` : "/api/now";

  async function poll() {
    ctl?.abort();
    ctl = new AbortController();
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) return;
      latest = (await res.json()) as NowSnapshot;
      listeners.forEach((l) => l(latest as NowSnapshot));
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.warn("[live-stats] poll failed", err);
      }
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
  return () => {
    ctl?.abort();
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function useNowSnapshot(): NowSnapshot | null {
  const [snap, setSnap] = useState<NowSnapshot | null>(latest);
  useEffect(() => {
    listeners.add(setSnap);
    if (latest) setSnap(latest);
    if (!stopPolling) stopPolling = startPolling();
    return () => {
      listeners.delete(setSnap);
      if (listeners.size === 0 && stopPolling) {
        stopPolling();
        stopPolling = null;
      }
    };
  }, []);
  return snap;
}

/* ── Sections ───────────────────────────────────────────────── */

/** Under the dial: what's playing, plus the latest published week's scores. */
export function NowStrip() {
  const snap = useNowSnapshot();
  const [now, setNow] = useState(() => Date.now());

  // Advance the song's progress bar between polls.
  const playing = snap?.spotify?.kind === "playing";
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  // Hold the band's space until the first snapshot lands.
  if (!snap) return <NowSlot band="live" />;
  // Nothing connected (or every provider failed): render nothing at all.
  if (!snap.spotify && !snap.oura) return null;
  const { spotify, oura } = snap;

  return (
    <div className="c-now c-now--live" role="group" aria-labelledby="now-h">
      <p className="c-now__head">
        <span id="now-h">{spotify ? "Right now" : "Lately"}</span>
        <span className="c-now__source">
          {spotify ? <span className="c-live" aria-hidden="true" /> : null}
          {[spotify && "Live from Spotify", oura && "Oura a week behind"].filter(Boolean).join(" · ")}
        </span>
      </p>
      <ul className="c-now__grid">
        {spotify ? (
          <Listening
            s={spotify}
            fetchedAt={snap.generatedAt}
            now={Math.max(now, snap.generatedAt)}
          />
        ) : null}
        {oura ? (
          <>
            <TrendTile
              label="Readiness"
              weeks={oura.weeks}
              metric="readiness"
              unit="/100"
              upIsGood
              average={oura.average.readiness}
            />
            <TrendTile
              label="Sleep score"
              weeks={oura.weeks}
              metric="sleepScore"
              unit="/100"
              upIsGood
              average={oura.average.sleepScore}
            />
          </>
        ) : null}
      </ul>
    </div>
  );
}

/** Under the intro: a year of movement and recovery, week by week. */
export function NowTrends() {
  const snap = useNowSnapshot();
  if (!snap) return <NowSlot band="trends" />;
  const oura = snap.oura;
  if (!oura) return null;
  const { weeks } = oura;

  return (
    <div className="c-now c-now--trends" role="group" aria-labelledby="trends-h">
      <p className="c-now__head">
        <span id="trends-h">Last {weeks.length} weeks</span>
        <span className="c-now__source">
          Weekly averages · through {dayLabel(oura.through, "short")}
        </span>
      </p>
      <ul className="c-now__grid">
        <StepsCard oura={oura} />
        <TrendTile label="HRV" weeks={weeks} metric="hrvRel" upIsGood relative />
        <TrendTile
          label="Resting heart rate"
          weeks={weeks}
          metric="restingHrRel"
          upIsGood={false}
          relative
        />
      </ul>
      <OuraTable weeks={weeks} />
    </div>
  );
}
