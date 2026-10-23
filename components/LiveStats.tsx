import { useEffect, useState } from "react";
import type { NowSnapshot, OuraState, SpotifyState } from "@/lib/stats";

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
    <li className="c-panel c-now__card c-now__card--listen">
      <p className="c-now__label">
        {playing ? <span className="c-live c-live--pulse" aria-hidden="true" /> : null}
        {status}
      </p>
      <div className="c-now__song">
        {s.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="c-now__art" src={s.albumArt} alt="" width="52" height="52" decoding="async" />
        ) : (
          <span className="c-now__art" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>
        )}
        <div className="c-now__song-text">
          {s.url ? (
            <a className="c-now__track" dir="auto" href={s.url} target="_blank" rel="noopener noreferrer">
              {s.track}
            </a>
          ) : (
            <span className="c-now__track" dir="auto">{s.track}</span>
          )}
          <span className="c-now__artist" dir="auto">{s.artist}</span>
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

function Score({ label, score, detail }: { label: string; score: number | undefined; detail: string[] }) {
  return (
    <li className="c-panel c-now__card">
      <p className="c-now__label">{label}</p>
      <p className={`c-now__score${score != null && score >= 85 ? " is-optimal" : ""}`}>
        {score ?? "—"}
        <span className="c-now__of">/100</span>
      </p>
      <span className="c-now__bar" aria-hidden="true">
        <span style={{ width: `${score ?? 0}%` }} />
      </span>
      <p className="c-now__detail">{detail.filter(Boolean).join(" · ")}</p>
    </li>
  );
}

// Oura's "day" is a local calendar date; today's readiness may not exist yet.
function dayLabel(day: string | undefined): string {
  if (!day) return "";
  const local = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const now = new Date();
  if (day === local(now)) return "today";
  now.setDate(now.getDate() - 1);
  if (day === local(now)) return "yesterday";
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function readinessDetail(o: OuraState): string[] {
  return [o.restingHr != null ? `${o.restingHr} bpm resting` : "", dayLabel(o.day)];
}

function sleepDetail(o: OuraState): string[] {
  return [o.sleepHours != null ? `${o.sleepHours}h asleep` : "", o.hrv != null ? `${o.hrv} ms HRV` : ""];
}

export default function LiveStats() {
  const [snap, setSnap] = useState<NowSnapshot | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let ctl: AbortController | null = null;
    const demo = demoParam();
    const url = demo ? `/api/now?demo=${encodeURIComponent(demo)}` : "/api/now";

    async function poll() {
      ctl?.abort();
      ctl = new AbortController();
      try {
        const res = await fetch(url, { signal: ctl.signal });
        if (res.ok) setSnap((await res.json()) as NowSnapshot);
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
  }, []);

  // Advance the song's progress bar between polls.
  const playing = snap?.spotify?.kind === "playing";
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  // Nothing configured (or every provider failed): render no section at all.
  if (!snap || (!snap.spotify && !snap.oura)) return null;
  const { spotify, oura } = snap;
  const sources = [spotify && "Spotify", oura && "Oura"].filter(Boolean).join(" + ");

  return (
    <div className="c-now" role="group" aria-labelledby="now-h">
      <p className="c-now__head">
        <span id="now-h">Right now</span>
        <span className="c-now__source">
          <span className="c-live" aria-hidden="true" />
          Live from {sources}
        </span>
      </p>
      <ul className="c-now__grid">
        {spotify ? (
          <Listening s={spotify} fetchedAt={snap.generatedAt} now={Math.max(now, snap.generatedAt)} />
        ) : null}
        {oura ? (
          <>
            <Score label="Readiness" score={oura.readiness} detail={readinessDetail(oura)} />
            <Score label="Sleep" score={oura.sleepScore} detail={sleepDetail(oura)} />
          </>
        ) : null}
      </ul>
    </div>
  );
}
