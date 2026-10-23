/* Patterns: cards that read across metrics for the whole year so far.
   Every figure is an association between Oura's own measurements, not a
   cause, and each card says how many days stand behind it. */
import type { CSSProperties } from "react";
import { WEEKDAYS, readinessFactors, weekRhythm, type Factor, type WeekRow } from "@/lib/insights";
import { useNowSnapshot, useYtd } from "@/components/LiveStats";

/* ── What moves readiness ───────────────────────────────────── */

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(Math.round(n))}`;

function FactorsCard({ factors }: { factors: Factor[] }) {
  // Symmetric scale, at least ±5 points so small effects don't look huge.
  const max = Math.max(5, ...factors.map((f) => Math.ceil(Math.abs(f.diff))));
  const lead = factors[0];
  return (
    <li className="c-panel c-now__card c-now__card--wide c-pattern">
      <p className="c-now__label">What moves your readiness</p>
      <p className="c-pattern__lede">
        <strong>{lead.label}</strong> matters most:{" "}
        <strong>
          {Math.round(lead.a.avg)} vs {Math.round(lead.b.avg)}
        </strong>{" "}
        readiness ({lead.a.label} vs {lead.b.label}).
      </p>
      <ul className="c-factors" aria-label="Readiness difference by factor, in points">
        {factors.map((f) => {
          const w = (Math.abs(f.diff) / max) * 50;
          return (
            <li key={f.id}>
              <span className="c-factors__name">{f.label}</span>
              <span className="c-factors__track" aria-hidden="true">
                <span
                  className={`c-factors__bar${f.diff < 0 ? " is-neg" : ""}`}
                  style={
                    f.diff >= 0
                      ? { left: "50%", width: `${w}%` }
                      : { left: `${50 - w}%`, width: `${w}%` }
                  }
                />
              </span>
              <span className="c-factors__val">{signed(f.diff)}</span>
              <span className="c-factors__sub">
                {f.a.label} ({f.a.n}) vs {f.b.label} ({f.b.n})
              </span>
            </li>
          );
        })}
      </ul>
      <p className="c-now__detail">
        Readiness points · your top quarter of days vs your bottom quarter
      </p>
    </li>
  );
}

/* ── Weekly rhythm ──────────────────────────────────────────── */

function cellText(row: WeekRow, v: number): string {
  if (row.id === "steps") return `${(v / 1000).toFixed(1)}K`;
  if (row.id === "bedtime") {
    const m = ((Math.round(v) % 1440) + 1440) % 1440;
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  }
  return String(Math.round(v));
}

const NIGHT = new Set<WeekRow["id"]>(["sleepScore", "bedtime"]);
// Row labels for narrow screens, where seven cells leave little room.
const SHORT: Record<WeekRow["id"], string> = {
  steps: "Steps",
  readiness: "Ready",
  sleepScore: "Sleep",
  bedtime: "Bed",
};

function extremeDay(row: WeekRow, highest: boolean): string | null {
  let best = -1;
  row.values.forEach((v, i) => {
    if (v == null) return;
    if (best < 0 || (highest ? v > (row.values[best] as number) : v < (row.values[best] as number)))
      best = i;
  });
  return best < 0 ? null : `${WEEKDAYS[best]}${NIGHT.has(row.id) ? " night" : ""}`;
}

function WeekCard({ rows }: { rows: WeekRow[] }) {
  const byId = Object.fromEntries(rows.map((r) => [r.id, r])) as Record<WeekRow["id"], WeekRow>;
  const summary = [
    ["Most active", extremeDay(byId.steps, true)],
    ["highest readiness", extremeDay(byId.readiness, true)],
    ["best sleep", extremeDay(byId.sleepScore, true)],
    ["latest to bed", extremeDay(byId.bedtime, true)],
  ].filter(([, d]) => d) as [string, string][];

  return (
    <li className="c-panel c-now__card c-now__card--wide c-pattern">
      <p className="c-now__label">Your week</p>
      <p className="c-pattern__lede">
        {summary.map(([k, d], i) => (
          <span key={k}>
            {i ? " · " : ""}
            {k} <strong>{d}</strong>
          </span>
        ))}
      </p>
      <table className="c-heat">
        <caption className="c-sr">
          Average by weekday. Steps and readiness by day; sleep score and bedtime by the night that
          starts that evening.
        </caption>
        <thead>
          <tr>
            <td />
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col">
                {d.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const vals = row.values.filter((v): v is number => v != null);
            const lo = Math.min(...vals);
            const hi = Math.max(...vals);
            return (
              <tr key={row.id}>
                <th scope="row">
                  <span className="c-heat__long">
                    {row.id === "sleepScore" ? "Sleep" : row.label}
                  </span>
                  <span className="c-heat__short" aria-hidden="true">
                    {SHORT[row.id]}
                  </span>
                </th>
                {row.values.map((v, i) => {
                  // One hue, more is stronger; scaled within the row.
                  const t = v == null || hi === lo ? 0 : (v - lo) / (hi - lo);
                  return (
                    <td
                      key={WEEKDAYS[i]}
                      style={v == null ? undefined : ({ "--t": t.toFixed(3) } as CSSProperties)}
                      className={v == null ? "is-empty" : undefined}
                      title={
                        v == null
                          ? "No data"
                          : `${WEEKDAYS[i]}: ${cellText(row, v)} (${row.n[i]} days)`
                      }
                    >
                      {v == null ? "—" : cellText(row, v)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="c-now__detail">Stronger = higher within its row · sleep and bedtime by night</p>
    </li>
  );
}

/* ── Section ────────────────────────────────────────────────── */

/** Full-width row under both hero columns. Loads the year once Oura is
    known to be connected; renders nothing until there's enough to say. */
export function NowPatterns() {
  const snap = useNowSnapshot();
  const ytd = useYtd(!!snap?.oura);
  if (ytd.status !== "ready") return null;

  const days = ytd.days;
  const factors = readinessFactors(days);
  const rows = weekRhythm(days);
  const hasWeek = rows.every((r) => r.values.some((v) => v != null));
  if (!factors.length && !hasWeek) return null;

  return (
    <div className="c-now c-now--patterns" role="group" aria-labelledby="patterns-h">
      <p className="c-now__head">
        <span id="patterns-h">Patterns · {days[0].day.slice(0, 4)} so far</span>
      </p>
      <ul className="c-now__grid">
        {factors.length ? <FactorsCard factors={factors} /> : null}
        {hasWeek ? <WeekCard rows={rows} /> : null}
      </ul>
    </div>
  );
}
