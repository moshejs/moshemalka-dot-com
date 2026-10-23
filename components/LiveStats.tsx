import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { NowSnapshot, OuraDay, SpotifyState } from "@/lib/stats";

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

function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Oura's "day" is a local calendar date.
function dayLabel(day: string, style: "relative" | "short" = "relative"): string {
  if (style === "relative") {
    const now = new Date();
    if (day === localIso(now)) return "today";
    now.setDate(now.getDate() - 1);
    if (day === localIso(now)) return "yesterday";
  }
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const fmt = (n: number) => n.toLocaleString("en-US");

type Metric = "readiness" | "sleepScore" | "hrv" | "restingHr" | "steps";

function series(days: OuraDay[], key: Metric): (number | undefined)[] {
  return days.map((d) => d[key]);
}

function lastIndex(values: (number | undefined)[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return i;
  return -1;
}

// Mean of the defined values before `upTo`: the baseline the latest reading is
// compared against.
function baseline(values: (number | undefined)[], upTo: number): number | null {
  const prior = values.slice(0, upTo).filter((v): v is number => v != null);
  return prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : null;
}

function Delta({
  value,
  base,
  upIsGood,
  format,
}: {
  value: number;
  base: number | null;
  upIsGood: boolean;
  format: (diff: number, base: number) => string;
}) {
  if (base == null) return <span className="c-delta">&nbsp;</span>;
  const diff = value - base;
  if (Math.abs(diff) < 0.5) return <span className="c-delta">level with 14-day avg</span>;
  const up = diff > 0;
  return (
    <span className={`c-delta${up === upIsGood ? " is-good" : ""}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="c-sr">{up ? "up" : "down"}</span> {format(Math.abs(diff), base)} vs 14-day
      avg
    </span>
  );
}

/* ── Chart plumbing ─────────────────────────────────────────── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// The pointer snaps to the nearest day; arrow keys step through days when the
// chart has focus. The readout line under each chart shows the selected day.
function useScrub(count: number) {
  const [active, setActive] = useState<number | null>(null);
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * count);
    setActive(Math.max(0, Math.min(count - 1, i)));
  };
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -1 : 1;
    setActive((i) => Math.max(0, Math.min(count - 1, (i ?? count - 1) + step)));
  };
  const clear = () => setActive(null);
  return {
    active,
    handlers: {
      onPointerMove,
      onPointerLeave: clear,
      onBlur: clear,
      onKeyDown,
      tabIndex: 0,
    },
  };
}

type ScrubHandlers = ReturnType<typeof useScrub>["handlers"];

const SPARK_H = 34;
const PAD = 6; // room for the 4px end-dot plus its 2px ring

function Sparkline({
  values,
  width,
  active,
  label,
  handlers,
}: {
  values: (number | undefined)[];
  width: number;
  active: number | null;
  label: string;
  handlers: ScrubHandlers;
}) {
  const defined = values.filter((v): v is number => v != null);
  if (!width || defined.length < 2) return <div style={{ height: SPARK_H }} />;
  const min = Math.min(...defined);
  const max = Math.max(...defined);
  const span = max - min || 1;
  const step = (width - PAD * 2) / (values.length - 1);
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => PAD + (1 - (v - min) / span) * (SPARK_H - PAD * 2);

  // Break the line at missing days instead of bridging them.
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
      {runs.map((d) => (
        <path key={d} d={d} className="c-spark__line" />
      ))}
      {/* A reading isolated between two gaps still gets a mark. */}
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

/* ── Oura tiles ─────────────────────────────────────────────── */

function TrendTile({
  label,
  days,
  metric,
  unit,
  upIsGood,
  deltaFormat,
  context,
}: {
  label: string;
  days: OuraDay[];
  metric: Metric;
  unit: string;
  upIsGood: boolean;
  deltaFormat: (diff: number, base: number) => string;
  context?: (d: OuraDay) => string;
}) {
  const values = series(days, metric);
  const last = lastIndex(values);
  const [ref, width] = useWidth<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  if (last < 0) return null;

  const shown = active ?? last;
  const day = days[shown];
  const v = values[shown];
  const when = dayLabel(day.day, active == null ? "relative" : "short");
  const readout =
    v == null ? `${when} · no reading` : [when, context?.(day)].filter(Boolean).join(" · ");

  return (
    <li className="c-panel c-now__card">
      <p className="c-now__label">{label}</p>
      <p className="c-now__score">
        {v != null ? fmt(v) : "—"}
        <span className="c-now__of">{unit}</span>
      </p>
      {active == null ? (
        <Delta
          value={values[last] as number}
          base={baseline(values, last)}
          upIsGood={upIsGood}
          format={deltaFormat}
        />
      ) : (
        <span className="c-delta" aria-hidden="true">
          &nbsp;
        </span>
      )}
      <div ref={ref} className="c-now__plot">
        <Sparkline
          values={values}
          width={width}
          active={active}
          label={`${label}, last ${days.length} days`}
          handlers={handlers}
        />
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
    </li>
  );
}

const STEPS_H = 92;
const BAR_MAX = 24;
const RADIUS = 4;

function StepsCard({ days }: { days: OuraDay[] }) {
  const values = series(days, "steps");
  const last = lastIndex(values);
  const [ref, width] = useWidth<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  if (last < 0) return null;

  const defined = values.filter((v): v is number => v != null);
  const avg = defined.reduce((a, b) => a + b, 0) / defined.length;
  const max = Math.max(...defined, avg) * 1.08;
  const slot = width / values.length;
  const bar = Math.max(4, Math.min(BAR_MAX, slot - 2));
  const top = (v: number) => STEPS_H - (v / max) * STEPS_H;

  const latestIsToday = days[last].day === localIso(new Date());
  const shown = active ?? last;
  const when = dayLabel(days[shown].day, active == null ? "relative" : "short");
  const readout =
    values[shown] == null
      ? `${when} · no reading`
      : `${when} · ${fmt(values[shown] as number)} steps`;

  return (
    <li className="c-panel c-now__card c-now__card--wide">
      <div className="c-steps__head">
        <div className="c-steps__figure">
          <p className="c-now__label">Steps</p>
          <p className="c-now__score">
            {fmt(values[last] as number)}
            <span className="c-now__of">
              {latestIsToday ? "so far today" : dayLabel(days[last].day)}
            </span>
          </p>
          {/* A partial day against full days would always read as "down". */}
          {latestIsToday ? null : (
            <Delta
              value={values[last] as number}
              base={baseline(values, last)}
              upIsGood
              format={(d, base) => `${Math.round((d / base) * 100)}%`}
            />
          )}
        </div>
        <p className="c-steps__avg">
          <span className="c-steps__key" aria-hidden="true" />
          {days.length}-day avg {fmt(Math.round(avg))}
        </p>
      </div>
      <div ref={ref} className="c-now__plot">
        {width ? (
          <svg
            className="c-steps"
            width={width}
            height={STEPS_H}
            aria-label={`Daily steps, last ${days.length} days`}
            {...handlers}
          >
            {values.map((v, i) => {
              if (v == null || v <= 0) return null;
              const y = top(v);
              const x0 = i * slot + (slot - bar) / 2;
              const r = Math.min(RADIUS, STEPS_H - y, bar / 2);
              // Rounded data-end, square at the baseline.
              const d =
                `M${x0},${STEPS_H}V${y + r}Q${x0},${y} ${x0 + r},${y}` +
                `H${x0 + bar - r}Q${x0 + bar},${y} ${x0 + bar},${y + r}V${STEPS_H}Z`;
              const cls = `c-steps__bar${i === last ? " is-latest" : ""}${i === active ? " is-active" : ""}`;
              return <path key={days[i].day} d={d} className={cls} />;
            })}
            <line className="c-steps__avgline" x1={0} x2={width} y1={top(avg)} y2={top(avg)} />
          </svg>
        ) : (
          <div style={{ height: STEPS_H }} />
        )}
      </div>
      <div className="c-steps__axis" aria-hidden="true">
        <span>{dayLabel(days[0].day, "short")}</span>
        <span>{dayLabel(days[days.length - 1].day, "short")}</span>
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
    </li>
  );
}

// Every plotted value, reachable without hovering.
function OuraTable({ days }: { days: OuraDay[] }) {
  const cell = (v: number | undefined) => (v == null ? "—" : fmt(v));
  // .c-sr on the table itself doesn't clip its rows (tables ignore the 1px
  // box), so the wrapper does the hiding.
  return (
    <div className="c-sr">
      <table>
        <caption>Oura readings by day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Steps</th>
            <th scope="col">Readiness</th>
            <th scope="col">Sleep score</th>
            <th scope="col">HRV (ms)</th>
            <th scope="col">Resting heart rate (bpm)</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{dayLabel(d.day, "short")}</th>
              <td>{cell(d.steps)}</td>
              <td>{cell(d.readiness)}</td>
              <td>{cell(d.sleepScore)}</td>
              <td>{cell(d.hrv)}</td>
              <td>{cell(d.restingHr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Spotify ────────────────────────────────────────────────── */

function Listening({ s, fetchedAt, now }: { s: SpotifyState; fetchedAt: number; now: number }) {
  const playing = s.kind === "playing";
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
    <li className="c-panel c-now__card c-now__card--wide c-now__card--listen">
      <p className="c-now__label">
        {playing ? <span className="c-live c-live--pulse" aria-hidden="true" /> : null}
        {status}
      </p>
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

function useNowSnapshot(): NowSnapshot | null {
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

/** Under the dial: what's playing, plus last night's scores. */
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

  // Nothing connected (or every provider failed): render nothing at all.
  if (!snap || (!snap.spotify && !snap.oura)) return null;
  const { spotify, oura } = snap;
  const days = oura?.days ?? [];
  const sources = [spotify && "Spotify", oura && "Oura"].filter(Boolean).join(" + ");

  return (
    <div className="c-now c-now--side" role="group" aria-labelledby="now-h">
      <p className="c-now__head">
        <span id="now-h">Right now</span>
        <span className="c-now__source">
          <span className="c-live" aria-hidden="true" />
          Live from {sources}
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
              days={days}
              metric="readiness"
              unit="/100"
              upIsGood
              deltaFormat={(d) => `${Math.round(d)}`}
            />
            <TrendTile
              label="Sleep score"
              days={days}
              metric="sleepScore"
              unit="/100"
              upIsGood
              deltaFormat={(d) => `${Math.round(d)}`}
              context={(d) => (d.sleepHours != null ? `${d.sleepHours}h asleep` : "")}
            />
          </>
        ) : null}
      </ul>
    </div>
  );
}

/** Under the intro: two weeks of movement and recovery. */
export function NowTrends() {
  const snap = useNowSnapshot();
  const days = snap?.oura?.days;
  if (!days) return null;

  return (
    <div className="c-now c-now--trends" role="group" aria-labelledby="trends-h">
      <p className="c-now__head">
        <span id="trends-h">Last {days.length} days</span>
        <span className="c-now__source">From Oura</span>
      </p>
      <ul className="c-now__grid">
        <StepsCard days={days} />
        <TrendTile
          label="HRV"
          days={days}
          metric="hrv"
          unit="ms"
          upIsGood
          deltaFormat={(d) => `${Math.round(d)} ms`}
        />
        <TrendTile
          label="Resting heart rate"
          days={days}
          metric="restingHr"
          unit="bpm"
          upIsGood={false}
          deltaFormat={(d) => `${Math.round(d)} bpm`}
        />
      </ul>
      <OuraTable days={days} />
    </div>
  );
}
