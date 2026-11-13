/* Patterns: cards that read across metrics for the last year of weeks.
   Every figure is an association between Oura's own measurements, not a
   cause, and each card says how many days stand behind it. The maths runs
   on the server (lib/ouraPublic.ts); only the results arrive here, with no
   sleep hours or clock times in them. */
import type { CSSProperties } from "react";
import { WEEKDAYS, type Factor, type WeekRow } from "@/lib/insights";
import { useNowState } from "@/components/LiveStats";
import { NowSlot } from "@/components/NowSlot";

/* ── What moves readiness ───────────────────────────────────── */

const signed = (n: number) => {
  const r = Math.round(n);
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r)}`;
};

// "…averaged 80 after my longest nights": each comparison's own preposition.
const LEAD_IN: Record<Factor["id"], string> = {
  sleep: "after my",
  bedtime: "after my",
  steps: "after days of",
  weekend: "on",
};

function FactorsCard({ factors }: { factors: Factor[] }) {
  // Symmetric scale, at least ±5 points so small effects don't look huge.
  const max = Math.max(5, ...factors.map((f) => Math.ceil(Math.abs(f.diff))));
  const lead = factors[0];
  return (
    <li className="c-panel c-now__card c-now__card--wide c-pattern">
      <p className="c-now__label">What moves my readiness</p>
      <p className="c-pattern__lede">
        <strong>{lead.label}</strong> goes with the biggest swing: my readiness averaged{" "}
        <strong>{Math.round(lead.a.avg)}</strong> {LEAD_IN[lead.id]} {lead.a.label} and{" "}
        <strong>{Math.round(lead.b.avg)}</strong> {LEAD_IN[lead.id]} {lead.b.label}.
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
                {f.a.label} {Math.round(f.a.avg)} · {f.b.label} {Math.round(f.b.avg)} ·{" "}
                {f.a.n === f.b.n ? `${f.a.n} days each` : `${f.a.n} and ${f.b.n} days`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="c-now__detail">
        Readiness points, my top quarter of days vs my bottom quarter. These go together; they
        don’t prove a cause.
      </p>
    </li>
  );
}

/* ── Weekly rhythm ──────────────────────────────────────────── */

function cellText(row: WeekRow, v: number): string {
  if (row.id === "steps") return `${(v / 1000).toFixed(1)}K`;
  // Minutes later (+) or earlier (−) than the usual bedtime.
  if (row.id === "bedtime") return signed(v);
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
      <p className="c-now__label">My week</p>
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
          starts that evening. Bedtime is in minutes later or earlier than usual.
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
                          : `${WEEKDAYS[i]}: ${cellText(row, v)}${row.id === "bedtime" ? " min vs usual" : ""} (${row.n[i]} days)`
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
      <p className="c-now__detail">
        Stronger = higher within its row · bedtime in minutes vs usual
      </p>
    </li>
  );
}

/* ── Section ────────────────────────────────────────────────── */

/** Full-width row under both hero columns. Renders nothing until there's
    enough to say. */
export function NowPatterns() {
  const { snap, failed } = useNowState();
  // Hold the band's space while the snapshot loads.
  if (!snap) return failed ? null : <NowSlot band="patterns" />;
  const oura = snap.oura;
  if (!oura) return null;

  const { factors, rhythm } = oura;
  const hasWeek = rhythm.every((r) => r.values.some((v) => v != null));
  if (!factors.length && !hasWeek) return null;

  return (
    <div className="c-now c-now--patterns" role="group" aria-labelledby="patterns-h">
      <p className="c-now__head">
        <span id="patterns-h">Patterns · last {oura.weeks.length} weeks</span>
      </p>
      <ul className="c-now__grid">
        {factors.length ? <FactorsCard factors={factors} /> : null}
        {hasWeek ? <WeekCard rows={rhythm} /> : null}
      </ul>
    </div>
  );
}
