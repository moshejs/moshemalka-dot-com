import { useEffect, useId, useState } from "react";
import type {
  NowSnapshot,
  OuraDay,
  OuraState,
  SpotifyRange,
  SpotifyState,
  SpotifyTop,
} from "@/lib/stats";
import {
  BAR_MAX,
  PAD,
  barPath,
  dayLabel,
  fmt,
  localIso,
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
}: {
  values: (number | undefined)[];
  width: number;
  height: number;
  active: number | null;
  label: string;
  handlers: ScrubHandlers;
}) {
  const defined = values.filter((v): v is number => v != null);
  if (!width || defined.length < 2) return null;
  const SPARK_H = Math.round(Math.min(SPARK_MAX, Math.max(height, 34)));
  // Never zoom in tighter than ±10% of the average, so a 47–52 bpm wobble
  // doesn't read as a dramatic swing when the chart is tall.
  const lo = Math.min(...defined);
  const hi = Math.max(...defined);
  const floor = Math.abs(mean(defined)) * 0.2;
  const pad = Math.max(0, floor - (hi - lo)) / 2;
  const min = lo - pad;
  const span = hi - lo + pad * 2 || 1;
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

/* ── Year to date ───────────────────────────────────────────── */

// Fetched once, on the first card opened, and shared by every card after.
let ytdRequest: Promise<OuraDay[] | null> | null = null;

function loadYtd(): Promise<OuraDay[] | null> {
  if (!ytdRequest) {
    const url = demoParam() ? "/api/oura-ytd?demo" : "/api/oura-ytd";
    ytdRequest = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<OuraState | null>) : null))
      .then((state) => state?.days ?? null)
      .catch(() => null);
    // A failure shouldn't stick: the next open tries again.
    ytdRequest.then((days) => {
      if (!days) ytdRequest = null;
    });
  }
  return ytdRequest;
}

export type YtdState =
  { status: "loading" } | { status: "ready"; days: OuraDay[] } | { status: "error" };

export function useYtd(enabled: boolean): YtdState {
  const [state, setState] = useState<YtdState>({ status: "loading" });
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadYtd().then((days) => {
      if (live) setState(days ? { status: "ready", days } : { status: "error" });
    });
    return () => {
      live = false;
    };
  }, [enabled]);
  return state;
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

// Trailing 7-day mean; a window with fewer than 3 readings is a gap.
function rolling(values: (number | undefined)[], window = 7): (number | undefined)[] {
  return values.map((_, i) => {
    const w = values
      .slice(Math.max(0, i - window + 1), i + 1)
      .filter((v): v is number => v != null);
    return w.length >= 3 ? mean(w) : undefined;
  });
}

// The last 30 calendar days against the year: is the recent stretch above or
// below the norm?
function recent30(values: (number | undefined)[], ytdAvg: number, suffix: string): Fact | null {
  const v = values.slice(-30).filter((x): x is number => x != null);
  if (!v.length) return null;
  const avg = mean(v);
  const diff = Math.round(avg - ytdAvg);
  const rel =
    Math.abs(ytdAvg) >= 1000
      ? `${Math.round((Math.abs(avg - ytdAvg) / ytdAvg) * 100)}%`
      : `${Math.abs(diff)}${suffix}`;
  return {
    k: "Last 30 days",
    v: `${fmt(Math.round(avg))}${suffix}`,
    sub: diff === 0 ? "level with YTD" : `${diff > 0 ? "▲" : "▼"} ${rel} vs YTD`,
  };
}

function extreme(days: OuraDay[], metric: Metric, highest: boolean) {
  let best: { v: number; day: string } | null = null;
  for (const d of days) {
    const v = d[metric];
    if (v == null) continue;
    if (!best || (highest ? v > best.v : v < best.v)) best = { v, day: d.day };
  }
  return best;
}

type Fact = { k: string; v: string; sub?: string };

function Facts({ facts }: { facts: Fact[] }) {
  return (
    <dl className="c-ytd__facts">
      {facts.map((f) => (
        <div key={f.k}>
          <dt>{f.k}</dt>
          <dd>
            {f.v}
            {f.sub ? <span>{f.sub}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Month starts within the series, for axis ticks and the summary table.
function monthStarts(days: OuraDay[]): { i: number; label: string }[] {
  return days.flatMap((d, i) =>
    d.day.endsWith("-01") || i === 0 ? [{ i, label: MONTHS[Number(d.day.slice(5, 7)) - 1] }] : [],
  );
}

function MonthTable({
  days,
  metric,
  caption,
  unit,
}: {
  days: OuraDay[];
  metric: Metric;
  caption: string;
  unit: string;
}) {
  const rows = monthStarts(days).map(({ i, label }, n, all) => {
    const slice = days.slice(i, all[n + 1]?.i ?? days.length);
    const v = slice.map((d) => d[metric]).filter((x): x is number => x != null);
    return { label, avg: v.length ? Math.round(mean(v)) : null, n: v.length };
  });
  return (
    <div className="c-sr">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Average{unit ? ` (${unit})` : ""}</th>
            <th scope="col">Days logged</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{r.avg == null ? "—" : fmt(r.avg)}</td>
              <td>{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const YTD_H = 112;
const AXIS_H = 18;

function MonthAxis({
  ticks,
  x,
  width,
}: {
  ticks: { i: number; label: string }[];
  x: (i: number) => number;
  width: number;
}) {
  // Thin the labels when months are packed tighter than a label is wide.
  const every = width / Math.max(ticks.length, 1) < 34 ? 2 : 1;
  return (
    <g className="c-ytd__axis" aria-hidden="true">
      {ticks.map((t, n) =>
        n % every === 0 ? (
          <text key={t.i} x={Math.min(x(t.i), width - 22)} y={YTD_H + 13}>
            {t.label}
          </text>
        ) : null,
      )}
    </g>
  );
}

function YtdPanel({
  id,
  label,
  metric,
  unit,
  upIsGood,
}: {
  id: string;
  label: string;
  metric: Metric;
  unit: string;
  upIsGood: boolean;
}) {
  const ytd = useYtd(true);
  const [ref, width] = useWidth<HTMLDivElement>();
  const days = ytd.status === "ready" ? ytd.days : [];
  const values = series(days, metric);
  const smooth = rolling(values);
  const { active, handlers } = useScrub(values.length);
  const suffix = unit === "/100" ? "" : ` ${unit}`;

  if (ytd.status !== "ready") {
    return (
      <div id={id} className="c-ytd">
        <p className="c-now__detail">
          {ytd.status === "loading" ? "Loading year to date…" : "Couldn’t load year to date."}
        </p>
      </div>
    );
  }

  const logged = values.filter((v): v is number => v != null);
  if (logged.length < 3) {
    return (
      <div id={id} className="c-ytd">
        <p className="c-now__detail">Not enough readings this year yet.</p>
      </div>
    );
  }
  const avg = mean(logged);
  const best = extreme(days, metric, upIsGood);
  const worst = extreme(days, metric, !upIsGood);
  const year = days[0].day.slice(0, 4);

  const defined = smooth.filter((v): v is number => v != null);
  const lo = Math.min(...defined, avg);
  const hi = Math.max(...defined, avg);
  const span = hi - lo || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (width - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (YTD_H - PAD * 2);

  const runs: string[] = [];
  let run = "";
  smooth.forEach((v, i) => {
    if (v == null) {
      if (run.includes("L")) runs.push(run);
      run = "";
      return;
    }
    run += `${run ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (run.includes("L")) runs.push(run);
  const last = lastIndex(smooth);
  const marker = active != null && smooth[active] != null ? active : last;

  const shown = active ?? lastIndex(values);
  const sv = smooth[shown];
  const dv = values[shown];
  const readout = [
    dayLabel(days[shown].day, active == null ? "relative" : "short"),
    sv != null ? `7-day avg ${fmt(Math.round(sv))}${suffix}` : "no 7-day avg",
    dv != null ? `day ${fmt(dv)}` : "no reading",
  ].join(" · ");

  return (
    <div id={id} className="c-ytd">
      <div className="c-ytd__head">
        <p className="c-ytd__title">{year} to date · 7-day average</p>
        <p className="c-steps__avg">
          <span className="c-steps__key" aria-hidden="true" />
          YTD avg {fmt(Math.round(avg))}
          {suffix}
        </p>
      </div>
      <Facts
        facts={[
          recent30(values, avg, suffix) ?? { k: "YTD avg", v: `${fmt(Math.round(avg))}${suffix}` },
          {
            k: upIsGood ? "Best" : "Lowest",
            v: `${fmt(best!.v)}${suffix}`,
            sub: dayLabel(best!.day, "short"),
          },
          {
            k: upIsGood ? "Worst" : "Highest",
            v: `${fmt(worst!.v)}${suffix}`,
            sub: dayLabel(worst!.day, "short"),
          },
          { k: "Days logged", v: fmt(logged.length), sub: `of ${values.length}` },
        ]}
      />
      <div ref={ref} className="c-now__plot">
        {width ? (
          <svg
            className="c-spark c-ytd__chart"
            width={width}
            height={YTD_H + AXIS_H}
            aria-label={`${label}, 7-day average, ${year} to date`}
            {...handlers}
          >
            <line className="c-steps__avgline" x1={0} x2={width} y1={y(avg)} y2={y(avg)} />
            {runs.map((d) => (
              <path key={d} d={d} className="c-ytd__line" />
            ))}
            {active != null ? (
              <line className="c-spark__cross" x1={x(active)} x2={x(active)} y1={0} y2={YTD_H} />
            ) : null}
            {marker >= 0 ? (
              <circle
                cx={x(marker)}
                cy={y(smooth[marker] as number)}
                r={4}
                className="c-spark__end"
              />
            ) : null}
            <MonthAxis ticks={monthStarts(days)} x={x} width={width} />
          </svg>
        ) : (
          <div style={{ height: YTD_H + AXIS_H }} />
        )}
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
      <MonthTable
        days={days}
        metric={metric}
        caption={`${label}, monthly average, ${year}`}
        unit={unit === "/100" ? "" : unit}
      />
    </div>
  );
}

// Monday-start weeks; the first and current weeks may be partial.
function weeks(days: OuraDay[]) {
  const out: { start: string; days: OuraDay[] }[] = [];
  for (const d of days) {
    const dow = (new Date(`${d.day}T12:00:00Z`).getUTCDay() + 6) % 7;
    if (dow === 0 || out.length === 0) out.push({ start: d.day, days: [] });
    out[out.length - 1].days.push(d);
  }
  return out.map((w) => {
    const v = w.days.map((d) => d.steps).filter((x): x is number => x != null);
    return {
      start: w.start,
      perDay: v.length ? mean(v) : undefined,
      total: v.reduce((a, b) => a + b, 0),
      n: v.length,
    };
  });
}

function YtdStepsPanel({ id }: { id: string }) {
  const ytd = useYtd(true);
  const [ref, width] = useWidth<HTMLDivElement>();
  const days = ytd.status === "ready" ? ytd.days : [];
  const wk = weeks(days);
  const { active, handlers } = useScrub(wk.length);

  if (ytd.status !== "ready") {
    return (
      <div id={id} className="c-ytd">
        <p className="c-now__detail">
          {ytd.status === "loading" ? "Loading year to date…" : "Couldn’t load year to date."}
        </p>
      </div>
    );
  }

  const logged = series(days, "steps").filter((v): v is number => v != null);
  if (!logged.length) {
    return (
      <div id={id} className="c-ytd">
        <p className="c-now__detail">No steps logged this year yet.</p>
      </div>
    );
  }
  const total = logged.reduce((a, b) => a + b, 0);
  const avg = total / logged.length;
  const best = extreme(days, "steps", true)!;
  const tenK = logged.filter((v) => v >= 10_000).length;
  const year = days[0].day.slice(0, 4);

  const perDay = wk.map((w) => w.perDay).filter((v): v is number => v != null);
  const max = Math.max(...perDay, avg) * 1.08;
  const slot = width / wk.length;
  const bar = Math.max(2, Math.min(BAR_MAX, slot - 2));
  const top = (v: number) => YTD_H - (v / max) * YTD_H;
  // Place each month's tick under the week containing its first day.
  const ticks = monthStarts(days).map((t) => ({
    i: wk.findIndex(
      (w, n) => w.start <= days[t.i].day && (wk[n + 1]?.start ?? "9999") > days[t.i].day,
    ),
    label: t.label,
  }));

  const shown = active ?? wk.length - 1;
  const w = wk[shown];
  const readout =
    w.perDay == null
      ? `Week of ${dayLabel(w.start, "short")} · no reading`
      : `Week of ${dayLabel(w.start, "short")} · ${fmt(Math.round(w.perDay))}/day · ${fmt(w.total)} total`;

  return (
    <div id={id} className="c-ytd">
      <div className="c-ytd__head">
        <p className="c-ytd__title">{year} to date · daily average by week</p>
        <p className="c-steps__avg">
          <span className="c-steps__key" aria-hidden="true" />
          YTD avg {fmt(Math.round(avg))}/day
        </p>
      </div>
      <Facts
        facts={[
          { k: "Total", v: total >= 1e6 ? `${(total / 1e6).toFixed(2)}M` : fmt(total) },
          recent30(series(days, "steps"), avg, "") ?? { k: "Avg / day", v: fmt(Math.round(avg)) },
          { k: "Best day", v: fmt(best.v), sub: dayLabel(best.day, "short") },
          { k: "10K+ days", v: fmt(tenK), sub: `of ${logged.length}` },
        ]}
      />
      <div ref={ref} className="c-now__plot">
        {width ? (
          <svg
            className="c-steps c-ytd__chart"
            width={width}
            height={YTD_H + AXIS_H}
            aria-label={`Steps, daily average by week, ${year} to date`}
            {...handlers}
          >
            {wk.map((wkx, i) =>
              wkx.perDay == null ? null : (
                <path
                  key={wkx.start}
                  d={barPath(i * slot + (slot - bar) / 2, top(wkx.perDay), bar, YTD_H)}
                  className={`c-steps__bar${i === wk.length - 1 ? " is-latest" : ""}${i === active ? " is-active" : ""}`}
                />
              ),
            )}
            <line className="c-steps__avgline" x1={0} x2={width} y1={top(avg)} y2={top(avg)} />
            <MonthAxis ticks={ticks} x={(i) => i * slot + (slot - bar) / 2} width={width} />
          </svg>
        ) : (
          <div style={{ height: YTD_H + AXIS_H }} />
        )}
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
      <MonthTable
        days={days}
        metric="steps"
        caption={`Steps, monthly daily average, ${year}`}
        unit=""
      />
    </div>
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
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  const { open, panelId, toggle } = useToggle();
  if (last < 0) return null;

  const shown = active ?? last;
  const day = days[shown];
  const v = values[shown];
  const when = dayLabel(day.day, active == null ? "relative" : "short");
  const readout =
    v == null ? `${when} · no reading` : [when, context?.(day)].filter(Boolean).join(" · ");

  return (
    <li className={`c-panel c-now__card${open ? " is-open" : ""}`}>
      <div className="c-now__top">
        <p className="c-now__label">{label}</p>
        <YtdToggle open={open} panelId={panelId} label={label} onClick={toggle} />
      </div>
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
      <div ref={ref} className="c-now__plot c-now__plot--fill">
        <Sparkline
          values={values}
          width={width}
          height={height}
          active={active}
          label={`${label}, last ${days.length} days`}
          handlers={handlers}
        />
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
      {open ? (
        <YtdPanel id={panelId} label={label} metric={metric} unit={unit} upIsGood={upIsGood} />
      ) : null}
    </li>
  );
}

const STEPS_H = 92;

function StepsCard({ days }: { days: OuraDay[] }) {
  const values = series(days, "steps");
  const last = lastIndex(values);
  const [ref, width] = useWidth<HTMLDivElement>();
  const { active, handlers } = useScrub(values.length);
  const { open, panelId, toggle } = useToggle();
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
    <li className={`c-panel c-now__card c-now__card--wide${open ? " is-open" : ""}`}>
      <div className="c-now__top">
        <p className="c-now__label">Steps</p>
        <YtdToggle open={open} panelId={panelId} label="Steps" onClick={toggle} />
      </div>
      <div className="c-steps__head">
        <div className="c-steps__figure">
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
            {values.map((v, i) =>
              v == null ? null : (
                <path
                  key={days[i].day}
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
        <span>{dayLabel(days[0].day, "short")}</span>
        <span>{dayLabel(days[days.length - 1].day, "short")}</span>
      </div>
      <p className="c-now__detail" aria-live="polite">
        {readout}
      </p>
      {open ? <YtdStepsPanel id={panelId} /> : null}
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
    <div className="c-now c-now--live" role="group" aria-labelledby="now-h">
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
        <span className="c-now__source">
          {dayLabel(days[0].day, "short")} – {dayLabel(days[days.length - 1].day, "short")}
        </span>
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
