import React, { useEffect, useState } from "react";

/**
 * An antimagnetic-style Z-blue dial keeping live New York time.
 *
 * The hour and minute hands are set from the clock (rechecked every 15s);
 * the lightning seconds hand sweeps in CSS at 8 beats per second, offset
 * once to the real second. Server render shows the classic 10:10.
 * Deliberately unbranded: no crown, no maker's name.
 */

type Time = { h: number; m: number; s: number };

function nyTime(): Time {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { h: get("hour") % 12, m: get("minute"), s: get("second") + (Date.now() % 1000) / 1000 };
}

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const TRACK_NUMERALS = [
  { n: "15", a: 90 },
  { n: "30", a: 180 },
  { n: "45", a: 270 },
  { n: "60", a: 0 },
];

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: Math.round(r * Math.cos(rad) * 100) / 100, y: Math.round(r * Math.sin(rad) * 100) / 100 };
}

export function Dial() {
  const [time, setTime] = useState<Time | null>(null);
  const [secondsOffset, setSecondsOffset] = useState<number | null>(null);

  useEffect(() => {
    const first = nyTime();
    setTime(first);
    setSecondsOffset(first.s);
    const id = window.setInterval(() => setTime(nyTime()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const t = time ?? { h: 10, m: 10, s: 0 };
  const hourDeg = (t.h + t.m / 60) * 30;
  const minuteDeg = (t.m + t.s / 60) * 6;
  const label = time
    ? `Watch dial showing ${String(t.h === 0 ? 12 : t.h)}:${String(t.m).padStart(2, "0")}, the current time in New York`
    : "Watch dial showing the current time in New York";

  return (
    <svg className="c-dial" viewBox="-200 -200 400 400" role="img" aria-label={label}>
      <defs>
        {/* green sapphire crystal: clear at the centre, tinted at the rim */}
        <radialGradient id="crystal" r="0.5">
          <stop offset="0" stopColor="#5dbb9a" stopOpacity="0.12" />
          <stop offset="0.8" stopColor="#5dbb9a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#7fe0bb" stopOpacity="0.34" />
        </radialGradient>
        <linearGradient id="glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* case + bezel */}
      <circle className="c-dial__case" r="196" />
      <circle className="c-dial__face" r="184" />
      <circle className="c-dial__chapter" r="171" />

      {/* minute track */}
      {TICKS.map((i) => {
        const major = i % 5 === 0;
        const a = polar(major ? 160 : 165, i * 6);
        const b = polar(178, i * 6);
        return (
          <line
            key={i}
            className={major ? "c-dial__tick c-dial__tick--major" : "c-dial__tick"}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
          />
        );
      })}
      {TRACK_NUMERALS.map(({ n, a }) => {
        const p = polar(147, a);
        return (
          <text key={n} className="c-dial__numeral" x={p.x} y={p.y} dy="0.35em">
            {n}
          </text>
        );
      })}

      {/* hour batons; a triangle at twelve */}
      {Array.from({ length: 12 }, (_, i) => i).map((i) =>
        i === 0 ? (
          <path key={i} className="c-dial__index" d="M0 -128 L-10 -112 L10 -112 Z" />
        ) : (
          <rect
            key={i}
            className="c-dial__index"
            x="-4"
            y={i % 3 === 0 ? -132 : -130}
            width="8"
            height={i % 3 === 0 ? 30 : 24}
            transform={`rotate(${i * 30})`}
          />
        )
      )}

      <text className="c-dial__name" y="-68">
        MALKA
      </text>
      <text className="c-dial__small" y="62">
        NEW YORK
      </text>
      <text className="c-dial__small" y="78">
        SINCE 2008
      </text>

      {/* hands */}
      <g className="c-dial__hand" style={{ transform: `rotate(${hourDeg}deg)` }}>
        <path className="c-dial__sword" d="M-5 14 L-5 -74 L0 -92 L5 -74 L5 14 Z" />
        <path className="c-dial__lume" d="M-2 -20 L-2 -72 L0 -80 L2 -72 L2 -20 Z" />
      </g>
      <g className="c-dial__hand" style={{ transform: `rotate(${minuteDeg}deg)` }}>
        <path className="c-dial__sword" d="M-3.5 16 L-3.5 -138 L0 -156 L3.5 -138 L3.5 16 Z" />
        <path className="c-dial__lume" d="M-1.5 -28 L-1.5 -136 L0 -144 L1.5 -136 L1.5 -28 Z" />
      </g>
      <g
        className="c-dial__seconds"
        style={
          secondsOffset === null
            ? undefined
            : ({
                animationDelay: `-${secondsOffset}s`,
                // reduced motion: hold still at the second the page loaded
                "--s0": `${secondsOffset * 6}deg`,
              } as React.CSSProperties)
        }
      >
        {/* Milgauss seconds hand: straight shaft, one lightning "Z", arrowhead tip */}
        <path className="c-dial__bolt" d="M0 34 L0 -94 L-9 -107 L7 -113 L0 -127 L0 -158" />
        <path className="c-dial__boltcap" d="M0 -179 L5 -156 L-5 -156 Z" />
        <circle className="c-dial__boltcap" r="6" />
      </g>
      <circle className="c-dial__pin" r="2.5" />

      {/* the crystal sits over everything */}
      <circle className="c-dial__crystal" r="188" fill="url(#crystal)" />
      <circle className="c-dial__crystal-rim" r="188" />
      {/* specular reflection on the glass, upper left */}
      <path
        className="c-dial__glint"
        d="M-170 -45.6 A 176 176 0 0 1 -15.3 -175.3 L -12.7 -145.4 A 146 146 0 0 0 -141 -37.8 Z"
        fill="url(#glint)"
      />
    </svg>
  );
}
