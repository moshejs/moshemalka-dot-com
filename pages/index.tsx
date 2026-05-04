import React, { useEffect, useRef, type ReactNode } from "react";
import Head from "next/head";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Moshe Malka — Intersection
 *
 * Not resume.
 * Not corporate.
 * Just signal + energy.
 */

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

function Theme() {
  return (
    <style jsx global>{`
      :root {
        /* Rolex Milgauss inspired palette
           Z-Blue dial · lightning-orange seconds · green sapphire crystal · brushed steel · MILGAUSS red */
        --bg: #060912;
        --ink: #ffffff;
        --muted: rgba(255, 255, 255, 0.66);
        --soft: rgba(255, 255, 255, 0.36);
        --line: rgba(255, 255, 255, 0.07);

        --z-blue:    #2e6fbb;
        --z-blue-dk: #1b4d8b;
        --lightning: #ffa42e;
        --crystal:   #5dbb9a;
        --steel:     #b8c5d6;
        --red:       #d9342f;

        /* legacy aliases — keep mapping so existing references stay valid */
        --blue:   var(--z-blue);
        --gold:   var(--lightning);
        --green:  var(--crystal);
        --violet: var(--steel);

        --cx: 50vw;
        --cy: 30vh;
      }

      html { scroll-behavior: smooth; }
      body {
        background: var(--bg);
        color: var(--ink);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        font-feature-settings: "ss01", "cv11", "cv02";
      }

      .mm-sans  { font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, "Inter", sans-serif; }
      .mm-mono  { font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.14em; text-transform: uppercase; }
      .mm-title { letter-spacing: -0.045em; font-feature-settings: "ss01", "cv11"; }

      ::selection {
        background: rgba(46, 111, 187, 0.4);
        color: #fff;
      }

      /* ── Scroll progress bar ──────────────────────────────── */
      .mm-progress {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        z-index: 40;
        pointer-events: none;
        overflow: hidden;
      }
      .mm-progress::before {
        content: "";
        position: absolute;
        inset: 0;
        width: var(--p, 0%);
        background: linear-gradient(90deg, var(--z-blue), var(--crystal), var(--lightning));
        background-size: 200% 100%;
        animation: progressShimmer 4s ease-in-out infinite;
        box-shadow: 0 0 12px rgba(255, 164, 46, 0.55);
        transition: width 80ms linear;
      }
      @keyframes progressShimmer {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }

      /* ── Aurora conic gradient backdrop (Milgauss tones) ──── */
      .mm-aurora {
        position: absolute;
        top: -20%;
        left: -20%;
        right: -20%;
        bottom: -20%;
        z-index: 0;
        pointer-events: none;
        background: conic-gradient(
          from 0deg at 50% 50%,
          rgba(46, 111, 187, 0.10),
          rgba(93, 187, 154, 0.05),
          rgba(255, 164, 46, 0.06),
          rgba(46, 111, 187, 0.10)
        );
        filter: blur(60px) saturate(140%);
        opacity: 0.6;
        animation: auroraSpin 90s linear infinite;
        will-change: transform;
      }
      @keyframes auroraSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      /* ── Graph-paper grid (trading-floor backdrop) ────────── */
      .mm-grid-paper {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(184, 197, 214, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(184, 197, 214, 0.045) 1px, transparent 1px);
        background-size: 64px 64px;
        background-position: -1px -1px;
        -webkit-mask-image: radial-gradient(ellipse 70% 90% at 50% 30%, #000 0%, transparent 75%);
                mask-image: radial-gradient(ellipse 70% 90% at 50% 30%, #000 0%, transparent 75%);
        opacity: 0.9;
      }

      /* ── Animated gradient on hero accent word ────────────── */
      .mm-grad-word {
        background: linear-gradient(
          120deg,
          var(--z-blue)   0%,
          var(--crystal)  35%,
          var(--lightning) 65%,
          var(--z-blue)   100%
        );
        background-size: 240% 100%;
        background-position: 0% 50%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: gradWordShift 9s ease-in-out infinite;
        will-change: background-position;
      }
      @keyframes gradWordShift {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }

      /* ── Section markers ──────────────────────────────────── */
      .mm-marker {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
      }
      .mm-marker-bar {
        display: inline-block;
        width: 26px;
        height: 1px;
        background: linear-gradient(90deg, var(--soft), transparent);
      }

      /* ── Hero stat row ────────────────────────────────────── */
      .mm-stats {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.1rem;
      }
      .mm-stat {
        display: inline-flex;
        align-items: baseline;
        gap: 0.4rem;
      }
      .mm-stat-num {
        color: var(--ink);
        font-weight: 600;
      }
      .mm-stat-unit {
        color: var(--soft);
        font-weight: 500;
      }
      .mm-stat-sep {
        color: rgba(255, 255, 255, 0.18);
        user-select: none;
      }

      /* ── Live ticker tape ─────────────────────────────────── */
      .mm-ticker {
        position: relative;
        overflow: hidden;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        padding: 0.85rem 0;
        background:
          linear-gradient(
            180deg,
            rgba(46, 111, 187, 0.05),
            rgba(0, 0, 0, 0.25)
          );
        backdrop-filter: blur(8px) saturate(140%);
        -webkit-backdrop-filter: blur(8px) saturate(140%);
        mask-image: linear-gradient(
          90deg,
          transparent 0,
          #000 6%,
          #000 94%,
          transparent 100%
        );
        -webkit-mask-image: linear-gradient(
          90deg,
          transparent 0,
          #000 6%,
          #000 94%,
          transparent 100%
        );
      }
      .mm-ticker-track {
        display: flex;
        align-items: center;
        white-space: nowrap;
        width: max-content;
        animation: tickerScroll 64s linear infinite;
        will-change: transform;
      }
      .mm-ticker:hover .mm-ticker-track {
        animation-play-state: paused;
      }
      @keyframes tickerScroll {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(-50%, 0, 0); }
      }
      .mm-tick {
        display: inline-flex;
        align-items: baseline;
        gap: 0.5rem;
        padding: 0 1.6rem;
        font-size: 11px;
        letter-spacing: 0.06em;
      }
      .mm-tick-sym {
        color: var(--ink);
        font-weight: 600;
      }
      .mm-tick-px {
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }
      .mm-tick-up {
        color: var(--crystal);
        font-variant-numeric: tabular-nums;
      }
      .mm-tick-down {
        color: var(--red);
        font-variant-numeric: tabular-nums;
      }
      .mm-tick-sep {
        color: rgba(255, 255, 255, 0.12);
        padding: 0 0.4rem;
      }

      /* ── Candlestick chart on cards (replaces music EQ) ───── */
      .mm-candles {
        display: block;
        margin-top: 1.1rem;
        overflow: visible;
      }
      .mm-candle {
        opacity: 0;
        transform-origin: center;
        animation: candleIn 700ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      .mm-candle-wick {
        stroke: var(--accent, var(--crystal));
        stroke-width: 0.7;
        opacity: 0.55;
      }
      .mm-candle-up {
        fill: var(--accent, var(--crystal));
        filter: drop-shadow(0 0 3px color-mix(in oklab, var(--accent) 45%, transparent));
      }
      .mm-candle-down {
        fill: var(--red);
        filter: drop-shadow(0 0 3px rgba(217, 52, 47, 0.35));
      }
      @keyframes candleIn {
        0%   { opacity: 0; transform: scaleY(0); }
        100% { opacity: 1; transform: scaleY(1); }
      }
      .mm-candle-baseline {
        stroke: var(--accent, var(--crystal));
        stroke-width: 0.4;
        stroke-dasharray: 1 2;
        opacity: 0.18;
      }
      .mm-candle-tag {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 4px;
        letter-spacing: 0.18em;
        fill: var(--soft);
        text-transform: uppercase;
      }

      /* ── Session pill (top-left — trading-session reframe) ── */
      .mm-session {
        position: fixed;
        top: 1.4rem;
        left: 1.4rem;
        z-index: 30;
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.45rem 0.85rem 0.45rem 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(6, 9, 18, 0.55);
        backdrop-filter: blur(10px) saturate(140%);
        -webkit-backdrop-filter: blur(10px) saturate(140%);
        font-size: 11px;
        letter-spacing: 0.12em;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }
      .mm-session-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--crystal);
        box-shadow: 0 0 12px rgba(93, 187, 154, 0.65);
        animation: pulseDot 2.6s ease-in-out infinite;
      }
      .mm-session-tkr  { color: var(--ink); font-weight: 600; }
      .mm-session-key  { color: var(--soft); }
      .mm-session-val  { color: var(--ink); }
      .mm-session-iv   { color: var(--lightning); }

      /* ── Hero spec sheet (Bloomberg quote layout) ─────────── */
      .mm-specs {
        display: grid;
        grid-template-columns: 1fr 1px 1fr 1px 1fr 1px 1fr;
        gap: 0 1.4rem;
        align-items: stretch;
        max-width: 640px;
      }
      .mm-spec {
        display: flex;
        flex-direction: column;
        gap: 0.18rem;
        padding: 0.05rem 0;
      }
      .mm-spec-key {
        font-size: 9.5px;
        letter-spacing: 0.22em;
        color: var(--soft);
        text-transform: uppercase;
      }
      .mm-spec-val {
        color: var(--ink);
        font-size: 1.6rem;
        font-weight: 500;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        line-height: 1.05;
      }
      .mm-spec-y {
        color: var(--soft);
        font-size: 0.9em;
        font-weight: 400;
      }
      .mm-spec-ctx {
        font-size: 9.5px;
        letter-spacing: 0.18em;
        color: var(--soft);
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .mm-spec-live { color: var(--crystal); }
      .mm-spec-live-dot {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--crystal);
        box-shadow: 0 0 8px rgba(93, 187, 154, 0.6);
        animation: pulseDot 2.6s ease-in-out infinite;
      }
      .mm-spec-rule {
        background: var(--line);
        align-self: stretch;
      }

      /* ── Holdings table (Stack reframed as fund holdings) ─ */
      .mm-hold {
        width: 100%;
        border-collapse: collapse;
      }
      .mm-hold thead th {
        font-family: var(--font-mono), ui-monospace, monospace;
        text-align: left;
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
        font-weight: 500;
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid var(--line);
      }
      .mm-hold thead th.mm-hold-num {
        text-align: right;
      }
      .mm-hold tbody td {
        padding: 0.55rem 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.025);
        vertical-align: middle;
      }
      .mm-hold tbody tr {
        transition: background-color 220ms ease;
      }
      .mm-hold tbody tr:hover {
        background: rgba(255, 255, 255, 0.018);
      }
      .mm-hold-tkr {
        color: var(--ink);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 0.82rem;
        letter-spacing: 0.06em;
      }
      .mm-hold-bar-cell {
        width: 50%;
      }
      .mm-hold-bar {
        position: relative;
        height: 5px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 3px;
        overflow: hidden;
      }
      .mm-hold-bar-fill {
        position: absolute;
        inset: 0 auto 0 0;
        background: linear-gradient(90deg, var(--z-blue), var(--lightning));
        border-radius: 3px;
        width: 0%;
        transition: width 1.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .mm-watch.is-visible .mm-hold-bar-fill {
        width: var(--mm-bar, 0%);
      }
      .mm-hold-num {
        text-align: right;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .mm-hold-mark-live {
        color: var(--crystal);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .mm-hold-mark-live::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--crystal);
        box-shadow: 0 0 6px rgba(93, 187, 154, 0.6);
      }
      .mm-hold-mark-held {
        color: var(--soft);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      /* ── Audio toggle (bottom-right, finance-meter aesthetic) ─ */
      .mm-audio {
        position: fixed;
        bottom: 1.3rem;
        right: 1.4rem;
        z-index: 30;
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.4rem 0.75rem 0.4rem 0.55rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(6, 9, 18, 0.55);
        backdrop-filter: blur(10px) saturate(140%);
        -webkit-backdrop-filter: blur(10px) saturate(140%);
        font-size: 10px;
        letter-spacing: 0.18em;
        color: var(--muted);
        cursor: pointer;
        transition: border-color 240ms ease, color 240ms ease, background 240ms ease;
      }
      .mm-audio:hover {
        border-color: rgba(255, 255, 255, 0.18);
        color: var(--ink);
      }
      .mm-audio-icon {
        font-size: 12px;
        line-height: 1;
      }
      .mm-audio[data-on="true"] .mm-audio-icon  { color: var(--lightning); }
      .mm-audio[data-on="false"] .mm-audio-icon { color: var(--soft); }
      .mm-audio[data-on="true"] .mm-audio-state {
        color: var(--crystal);
      }
      .mm-audio[data-on="false"] .mm-audio-state {
        color: var(--soft);
      }

      /* ── Position-row interaction + tear sheet ─────────────── */
      .mm-traj-row {
        cursor: pointer;
        user-select: none;
      }
      .mm-traj-row[aria-expanded="true"] {
        background: rgba(255, 255, 255, 0.022);
        padding-left: 1.5rem;
      }
      .mm-traj-row[aria-expanded="true"]::before {
        opacity: 1;
        transform: scaleY(1);
      }
      .mm-traj-row .mm-traj-chevron {
        display: inline-block;
        transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
        color: var(--soft);
        font-size: 0.7rem;
        margin-left: 0.5rem;
      }
      .mm-traj-row[aria-expanded="true"] .mm-traj-chevron {
        transform: rotate(90deg);
        color: var(--accent);
      }

      .mm-tear {
        grid-column: 1 / -1;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition:
          max-height 480ms cubic-bezier(0.2, 0.8, 0.2, 1),
          opacity 360ms ease,
          padding 360ms ease;
        padding: 0 0.4rem;
      }
      .mm-tear[data-open="true"] {
        max-height: 720px;
        opacity: 1;
        padding: 1.4rem 0.4rem 1.6rem 1.5rem;
      }
      .mm-tear-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.2rem;
      }
      @media (min-width: 768px) {
        .mm-tear-grid {
          grid-template-columns: 230px 1fr;
          gap: 1.4rem 2rem;
        }
      }
      .mm-tear-key {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
        padding-top: 0.18rem;
      }
      .mm-tear-val {
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.55;
        text-transform: none;
        letter-spacing: 0;
      }
      .mm-tear-strikes {
        list-style: none;
        margin: 0;
        padding: 0;
        text-transform: none;
        letter-spacing: 0;
      }
      .mm-tear-strikes li {
        position: relative;
        padding-left: 1.2rem;
        margin: 0 0 0.45rem;
        color: var(--muted);
        text-transform: none;
        letter-spacing: 0;
      }
      .mm-tear-strikes li::before {
        content: "▸";
        position: absolute;
        left: 0;
        top: 0.05em;
        color: var(--accent, var(--crystal));
        font-size: 0.85em;
      }
      .mm-tear-instr {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .mm-tear-instr span {
        display: inline-flex;
        align-items: center;
        padding: 0.18rem 0.6rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        letter-spacing: 0.08em;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.014);
      }

      /* ── Execution log row tags (FILL / EXEC / OPEN / CLOSE) */
      .mm-tick-act-fill   { color: var(--crystal);   font-weight: 600; }
      .mm-tick-act-exec   { color: var(--lightning); font-weight: 600; }
      .mm-tick-act-open   { color: var(--z-blue);    font-weight: 600; }
      .mm-tick-act-close  { color: var(--steel);     font-weight: 600; }
      .mm-tick-act-roll   { color: var(--lightning); font-weight: 600; }
      .mm-tick-status-pos { color: var(--crystal); }
      .mm-tick-status-neu { color: var(--soft);    }
      .mm-tick-ts         { color: var(--soft);   }
      .mm-tick-msg        { color: var(--ink);    }

      /* ── Position-book row variants ───────────────────────── */
      .mm-pos-side {
        display: inline-block;
        font-size: 10px;
        letter-spacing: 0.22em;
        padding: 0.1rem 0.45rem;
        border-radius: 4px;
        border: 1px solid var(--accent, var(--line));
        color: var(--accent);
        background: color-mix(in oklab, var(--accent) 8%, transparent);
      }
      .mm-pos-side[data-side="META"] {
        background: color-mix(in oklab, var(--lightning) 15%, transparent);
        border-color: var(--lightning);
        color: var(--lightning);
      }
      .mm-pos-group-label {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin: 1.6rem 0 0.4rem;
        font-size: 10px;
        letter-spacing: 0.22em;
        color: var(--soft);
      }
      .mm-pos-group-label::before {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--line) 60%);
        order: 2;
        margin-left: 0.6rem;
      }

      /* ── Count-up numbers (subtle ‘live’ scrim) ───────────── */
      .mm-count {
        font-variant-numeric: tabular-nums;
        display: inline-block;
        min-width: 2.2ch;
        text-align: right;
      }

      /* ── Trajectory timeline ──────────────────────────────── */
      .mm-traj {
        display: flex;
        flex-direction: column;
      }
      .mm-traj-row {
        display: grid;
        grid-template-columns: 1fr;
        row-gap: 0.35rem;
        column-gap: 1.6rem;
        padding: 1.4rem 0.4rem;
        border-bottom: 1px solid var(--line);
        position: relative;
        --accent: rgba(255, 255, 255, 0.5);
        transition: padding-left 360ms cubic-bezier(0.2, 0.8, 0.2, 1),
                    background-color 320ms ease;
      }
      .mm-traj-row::before {
        content: "";
        position: absolute;
        left: 0;
        top: 12%;
        bottom: 12%;
        width: 2px;
        background: var(--accent);
        opacity: 0;
        transform: scaleY(0.3);
        transform-origin: center;
        transition: opacity 320ms ease,
                    transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .mm-traj-row:hover {
        padding-left: 1.5rem;
        background: rgba(255, 255, 255, 0.018);
      }
      .mm-traj-row:hover::before { opacity: 1; transform: scaleY(1); }

      .mm-traj-year {
        color: var(--soft);
        letter-spacing: 0.18em;
        font-size: 11px;
        transition: color 320ms ease, transform 320ms ease;
      }
      .mm-traj-row:hover .mm-traj-year {
        color: var(--accent);
        transform: translateX(2px);
      }
      .mm-traj-co {
        color: var(--ink);
        font-weight: 600;
        letter-spacing: -0.005em;
        font-size: 1.05rem;
      }
      .mm-traj-note {
        color: var(--muted);
        font-size: 0.96rem;
        line-height: 1.55;
      }
      @media (min-width: 768px) {
        .mm-traj-row {
          grid-template-columns: 110px 230px 1fr;
          align-items: baseline;
          row-gap: 0;
        }
      }

      /* ── Tech stack tags ──────────────────────────────────── */
      .mm-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.42rem 0.88rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
        font-size: 0.85rem;
        letter-spacing: -0.005em;
        background: rgba(255, 255, 255, 0.018);
        transition: color 280ms ease,
                    border-color 280ms ease,
                    transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
                    background-color 280ms ease,
                    box-shadow 280ms ease;
        cursor: default;
      }
      .mm-tag:hover {
        color: var(--ink);
        border-color: rgba(255, 255, 255, 0.28);
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }

      /* ── Pull quote ───────────────────────────────────────── */
      .mm-pull {
        position: relative;
        padding-left: 1.4rem;
        font-style: italic;
        font-size: 1.02rem;
        color: var(--soft);
      }
      .mm-pull::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.15rem;
        bottom: 0.15rem;
        width: 2px;
        background: linear-gradient(
          180deg,
          var(--z-blue),
          var(--crystal),
          var(--lightning)
        );
        border-radius: 2px;
      }

      /* ── Magnetic CTA ─────────────────────────────────────── */
      .mm-cta {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.85rem 1.25rem 0.85rem 1.4rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background:
          linear-gradient(
            120deg,
            rgba(46, 111, 187, 0.16),
            rgba(93, 187, 154, 0.10) 50%,
            rgba(255, 164, 46, 0.16)
          );
        color: var(--ink);
        font-size: 0.95rem;
        letter-spacing: -0.005em;
        --magx: 0px;
        --magy: 0px;
        transform: translate3d(var(--magx), var(--magy), 0);
        transition:
          transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
          border-color 320ms ease,
          background 360ms ease,
          box-shadow 360ms ease;
        overflow: hidden;
      }
      .mm-cta::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(120deg, var(--z-blue), var(--crystal), var(--lightning));
        opacity: 0;
        transition: opacity 320ms ease;
        z-index: -1;
        filter: blur(18px);
      }
      .mm-cta:hover {
        border-color: rgba(255, 255, 255, 0.32);
        background:
          linear-gradient(
            120deg,
            rgba(46, 111, 187, 0.28),
            rgba(93, 187, 154, 0.22) 50%,
            rgba(255, 164, 46, 0.28)
          );
        box-shadow: 0 14px 50px rgba(255, 164, 46, 0.22);
      }
      .mm-cta:hover::before { opacity: 0.55; }
      .mm-cta-arrow {
        display: inline-block;
        transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .mm-cta:hover .mm-cta-arrow { transform: translateX(5px); }

      /* ── Page-wide cursor spotlight ───────────────────────── */
      .mm-spotlight {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background: radial-gradient(
          520px circle at var(--cx) var(--cy),
          rgba(255, 255, 255, 0.055),
          transparent 60%
        );
        mix-blend-mode: screen;
        transition: opacity 400ms ease;
      }

      /* ── Subtle film grain ────────────────────────────────── */
      .mm-grain {
        position: fixed;
        inset: -10%;
        pointer-events: none;
        z-index: 2;
        opacity: 0.045;
        mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
      }

      /* ── Top-right status pill ────────────────────────────── */
      .mm-status {
        position: fixed;
        top: 1.4rem;
        right: 1.4rem;
        z-index: 30;
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.45rem 0.75rem 0.45rem 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(10, 12, 16, 0.55);
        backdrop-filter: blur(10px) saturate(140%);
        -webkit-backdrop-filter: blur(10px) saturate(140%);
        transition: border-color 260ms ease, background-color 260ms ease, transform 260ms ease;
      }
      .mm-status:hover {
        border-color: rgba(255, 255, 255, 0.16);
        background: rgba(10, 12, 16, 0.7);
        transform: translateY(-1px);
      }
      .mm-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--lightning);
        box-shadow: 0 0 12px rgba(255, 164, 46, 0.65);
        animation: pulseDot 2.6s ease-in-out infinite;
      }
      @keyframes pulseDot {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 164, 46, 0.55); }
        50%      { box-shadow: 0 0 0 8px rgba(255, 164, 46, 0); }
      }

      /* ── Background orbs ──────────────────────────────────── */
      @keyframes drift {
        0%   { transform: translate3d(0, 0, 0) scale(1); }
        50%  { transform: translate3d(0, -22px, 0) scale(1.05); }
        100% { transform: translate3d(0, 0, 0) scale(1); }
      }
      @keyframes floatX {
        0%   { transform: translateX(-2%); }
        50%  { transform: translateX(2%); }
        100% { transform: translateX(-2%); }
      }
      @keyframes glowPulse {
        0%, 100% { opacity: 0.18; transform: scaleX(0.85); }
        50%      { opacity: 0.7;  transform: scaleX(1.06); }
      }

      /* ── Hero word reveal ─────────────────────────────────── */
      @keyframes wordIn {
        from {
          opacity: 0;
          transform: translateY(110%);
          filter: blur(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }
      .mm-line {
        display: block;
        overflow: hidden;
        padding-bottom: 0.05em;
      }
      .mm-word {
        display: inline-block;
        opacity: 0;
        transform: translateY(110%);
        animation: wordIn 1100ms cubic-bezier(0.18, 0.8, 0.18, 1) forwards;
        will-change: transform, opacity, filter;
      }

      /* ── Generic eased reveal (top-of-page elements) ──────── */
      @keyframes heroIn {
        from { opacity: 0; transform: translateY(18px); filter: blur(6px); }
        to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
      }
      .mm-reveal {
        opacity: 0;
        animation: heroIn 850ms cubic-bezier(0.18, 0.8, 0.2, 1) forwards;
      }
      .mm-delay-1 { animation-delay: 120ms; }
      .mm-delay-2 { animation-delay: 240ms; }
      .mm-delay-3 { animation-delay: 380ms; }
      .mm-delay-4 { animation-delay: 540ms; }

      /* ── Scroll-triggered reveals (IntersectionObserver) ──── */
      .mm-watch {
        opacity: 0;
        transform: translateY(28px);
        transition:
          opacity 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
          transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
        transition-delay: var(--mm-delay, 0ms);
        will-change: transform, opacity;
      }
      .mm-watch.is-visible {
        opacity: 1;
        transform: none;
      }

      /* ── Background grid wash ─────────────────────────────── */
      .mm-grid {
        position: relative;
      }
      .mm-grid::before {
        content: "";
        position: absolute;
        inset: -4rem -2rem;
        background:
          radial-gradient(circle at 18% 18%, rgba(46, 111, 187, 0.16), transparent 45%),
          radial-gradient(circle at 82% 82%, rgba(255, 164, 46, 0.10), transparent 45%);
        filter: blur(30px);
        opacity: 0.55;
        pointer-events: none;
        animation: floatX 14s ease-in-out infinite;
      }

      /* ── Cards (live cursor sheen + magnetic 3D tilt) ─────── */
      @keyframes softSweep {
        0%   { transform: translateX(-130%); }
        100% { transform: translateX(220%); }
      }

      .mm-card {
        position: relative;
        padding: 1.6rem;
        margin: -1.6rem;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 20px;
        background: linear-gradient(
          145deg,
          rgba(255, 255, 255, 0.045),
          rgba(255, 255, 255, 0.012)
        );
        --rx: 0deg;
        --ry: 0deg;
        --ty: 0px;
        --accent: rgba(255, 255, 255, 1);
        transform: perspective(1200px)
          translate3d(0, var(--ty), 0)
          rotateX(var(--rx))
          rotateY(var(--ry));
        transform-style: preserve-3d;
        transition:
          transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1),
          border-color 320ms ease,
          box-shadow 420ms ease,
          background-color 320ms ease;
        overflow: hidden;
      }
      .mm-card::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          360px circle at var(--mx, 50%) var(--my, 50%),
          color-mix(in oklab, var(--accent) 28%, transparent),
          transparent 55%
        );
        opacity: 0;
        transition: opacity 320ms ease;
        pointer-events: none;
        border-radius: inherit;
        mix-blend-mode: screen;
      }
      .mm-card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          105deg,
          transparent 38%,
          rgba(255, 255, 255, 0.18) 50%,
          transparent 62%
        );
        transform: translateX(-130%);
        pointer-events: none;
        border-radius: inherit;
      }
      .mm-card:hover {
        --ty: -6px;
        border-color: color-mix(in oklab, var(--accent) 38%, rgba(255, 255, 255, 0.2));
        box-shadow:
          0 28px 70px rgba(0, 0, 0, 0.5),
          0 0 60px color-mix(in oklab, var(--accent) 12%, transparent),
          0 1px 0 rgba(255, 255, 255, 0.06) inset;
        background-color: rgba(255, 255, 255, 0.022);
      }
      .mm-card:hover::before { opacity: 1; }
      .mm-card:hover::after  { animation: softSweep 1.1s cubic-bezier(0.2, 0.8, 0.2, 1); }

      .mm-card-number {
        position: absolute;
        top: 1.5rem;
        right: 1.6rem;
        font-size: 10px;
        letter-spacing: 0.22em;
        color: rgba(255, 255, 255, 0.22);
        transition: color 360ms ease, transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
        pointer-events: none;
      }
      .mm-card:hover .mm-card-number {
        color: var(--accent);
        transform: translateX(-4px);
        text-shadow: 0 0 16px color-mix(in oklab, var(--accent) 50%, transparent);
      }

      .mm-chip {
        display: inline-block;
        transition:
          transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
          text-shadow 320ms ease,
          letter-spacing 320ms ease;
      }
      .mm-card:hover .mm-chip {
        transform: translateX(6px);
        text-shadow: 0 0 18px rgba(255, 255, 255, 0.28);
        letter-spacing: 0.18em;
      }

      /* ── Divider ──────────────────────────────────────────── */
      .mm-divider {
        position: relative;
        overflow: hidden;
      }
      .mm-divider::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent 18%,
          rgba(255, 255, 255, 0.55) 50%,
          transparent 82%
        );
        opacity: 0.55;
        animation: glowPulse 4.6s ease-in-out infinite;
        transform-origin: center;
      }

      /* ── Energy section — underline reveal ────────────────── */
      .mm-hover-line {
        position: relative;
        display: inline-block;
        transition: color 220ms ease;
      }
      .mm-hover-line::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -0.22em;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, var(--blue), rgba(0, 245, 160, 0.65), transparent);
        transform: scaleX(0.18);
        opacity: 0;
        transform-origin: left;
        transition: transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 320ms ease;
      }
      .mm-hover-line:hover { color: rgba(255, 255, 255, 0.95); }
      .mm-hover-line:hover::after {
        opacity: 1;
        transform: scaleX(1);
      }

      /* ── Footer ───────────────────────────────────────────── */
      .mm-foot {
        border-top: 1px solid var(--line);
      }
      .mm-foot a {
        color: var(--muted);
        transition: color 220ms ease;
      }
      .mm-foot a:hover { color: var(--ink); }

      /* ── Reduced motion ───────────────────────────────────── */
      @media (prefers-reduced-motion: reduce) {
        .mm-reveal,
        .mm-grid::before,
        .mm-card,
        .mm-card::before,
        .mm-card::after,
        .mm-card-number,
        .mm-chip,
        .mm-divider::after,
        .mm-hover-line,
        .mm-hover-line::after,
        .mm-watch,
        .mm-word,
        .mm-status-dot,
        .mm-spotlight,
        .mm-aurora,
        .mm-grad-word,
        .mm-cta,
        .mm-cta-arrow,
        .mm-progress::before,
        .mm-traj-row,
        .mm-traj-row::before,
        .mm-traj-year,
        .mm-tag,
        .mm-ticker-track,
        .mm-candle,
        .mm-session-dot,
        .mm-spec-live-dot,
        .mm-tear,
        .mm-hold-bar-fill {
          animation: none !important;
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
        .mm-grad-word {
          background: none !important;
          color: var(--ink) !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
        }
      }
    `}</style>
  );
}

function Orb({
  color,
  size,
  top,
  left,
  duration,
  delay,
}: {
  color: string;
  size: number;
  top: string;
  left: string;
  duration: string;
  delay: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}66 0%, transparent 72%)`,
        filter: "blur(85px)",
        animation: `drift ${duration} ease-in-out ${delay} infinite alternate`,
        pointerEvents: "none",
        willChange: "transform",
      }}
    />
  );
}

function CursorSpotlight() {
  useEffect(() => {
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const update = () => {
      document.documentElement.style.setProperty("--cx", `${nx}px`);
      document.documentElement.style.setProperty("--cy", `${ny}px`);
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      nx = e.clientX;
      ny = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="mm-spotlight" aria-hidden />;
}

function StatusPill() {
  return (
    <a
      href="https://www.linkedin.com/in/moshenyc/"
      target="_blank"
      rel="noopener noreferrer"
      className="mm-status mm-reveal"
      data-tick="1420"
      aria-label="Available for select work — connect on LinkedIn"
    >
      <span className="mm-status-dot" aria-hidden />
      <span className="mm-mono text-[10px]" style={{ color: "var(--muted)" }}>
        Available · 2026
      </span>
    </a>
  );
}

function HeroHeading() {
  const lineOne = ["I", "like", "building"];
  const lineTwo = ["things", "that"];
  const base = 140;
  const step = 70;
  const totalCount = lineOne.length + lineTwo.length + 1;

  return (
    <h1 className="mm-title mt-12 text-6xl md:text-8xl font-bold leading-[1.04]">
      <span className="mm-line">
        {lineOne.map((w, i) => (
          <React.Fragment key={`a-${i}`}>
            <span
              className="mm-word"
              style={{ animationDelay: `${base + i * step}ms` }}
            >
              {w}
            </span>
            {i < lineOne.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </span>
      <span className="mm-line">
        {lineTwo.map((w, i) => (
          <React.Fragment key={`b-${i}`}>
            <span
              className="mm-word"
              style={{
                animationDelay: `${base + (lineOne.length + i) * step + 60}ms`,
              }}
            >
              {w}
            </span>{" "}
          </React.Fragment>
        ))}
        <span
          className="mm-word mm-grad-word"
          style={{ animationDelay: `${base + (totalCount - 1) * step + 120}ms` }}
        >
          move.
        </span>
      </span>
    </h1>
  );
}

function SectionMarker({ children }: { children: ReactNode }) {
  return (
    <div className="mm-marker">
      <span className="mm-marker-bar" aria-hidden />
      <span
        className="mm-mono text-[11px]"
        style={{ color: "var(--soft)" }}
      >
        {children}
      </span>
    </div>
  );
}

function HeroStats() {
  const openCount = POSITIONS.filter((p) => p.side === "OPEN").length;
  const totalPositions = POSITIONS.filter(
    (p) => p.side === "OPEN" || p.side === "CLOSED"
  ).length;
  const holdingsCount = HOLDINGS.length;
  return (
    <div className="mm-specs mm-mono mt-14 mm-reveal mm-delay-4">
      <div className="mm-spec" data-tick="1320">
        <div className="mm-spec-key">positions</div>
        <div className="mm-spec-val">
          <CountUp to={totalPositions} />
        </div>
        <div className="mm-spec-ctx">
          <span className="mm-spec-live-dot" /> {openCount} open · all-time
        </div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec" data-tick="1260">
        <div className="mm-spec-key">holdings</div>
        <div className="mm-spec-val">
          <CountUp to={holdingsCount} />
        </div>
        <div className="mm-spec-ctx">stack · live + held</div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec" data-tick="1200">
        <div className="mm-spec-key">desk</div>
        <div className="mm-spec-val">NYC</div>
        <div className="mm-spec-ctx">since ’14</div>
      </div>
      <div className="mm-spec-rule" />
      <div className="mm-spec" data-tick="1140">
        <div className="mm-spec-key">cycle</div>
        <div className="mm-spec-val">
          Q2 <span className="mm-spec-y">’26</span>
        </div>
        <div className="mm-spec-ctx mm-spec-live">
          <span className="mm-spec-live-dot" /> session live
        </div>
      </div>
    </div>
  );
}

function Aurora() {
  return <div className="mm-aurora" aria-hidden />;
}

/* ── Audio system (Web Audio tones, no asset files) ───────── */
type MMAudio = {
  enabled: boolean;
  ctx: AudioContext | null;
  play: (freq: number, ms: number, vol?: number) => void;
};

declare global {
  interface Window {
    __mmAudio?: MMAudio;
  }
}

function ensureAudioModule() {
  if (typeof window === "undefined") return null;
  if (window.__mmAudio) return window.__mmAudio;
  const stored =
    typeof localStorage !== "undefined" && localStorage.getItem("mm-audio");
  const enabled = stored === null ? true : stored === "on";
  const mod: MMAudio = {
    enabled,
    ctx: null,
    play(freq, ms, vol = 0.07) {
      if (!this.enabled) return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        if (!this.ctx) this.ctx = new Ctx();
        if (this.ctx.state === "suspended") this.ctx.resume();
        const c = this.ctx;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(c.destination);
        const now = c.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
        o.start(now);
        o.stop(now + ms / 1000 + 0.05);
      } catch {
        /* swallow audio errors silently */
      }
    },
  };
  window.__mmAudio = mod;
  return mod;
}

function AudioToggle() {
  const [on, setOn] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    const m = ensureAudioModule();
    if (m) setOn(m.enabled);
    setMounted(true);
  }, []);

  const toggle = () => {
    const m = ensureAudioModule();
    if (!m) return;
    const next = !on;
    m.enabled = next;
    setOn(next);
    try {
      localStorage.setItem("mm-audio", next ? "on" : "off");
    } catch {}
    if (next) {
      // confirmation chord
      m.play(660, 70, 0.06);
      window.setTimeout(() => m.play(880, 60, 0.05), 90);
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      className="mm-audio mm-mono"
      data-on={on}
      data-tick="1380"
      onClick={toggle}
      aria-label={`Audio cues ${on ? "on" : "off"}`}
    >
      <span className="mm-audio-icon">{on ? "♪" : "·"}</span>
      <span>AUDIO</span>
      <span className="mm-audio-state">{on ? "ON" : "OFF"}</span>
    </button>
  );
}

function GridPaper() {
  return <div className="mm-grid-paper" aria-hidden />;
}

/* ── Execution log (career events as trade fills/orders) ──── */
type ExecAction = "FILL" | "EXEC" | "OPEN" | "CLOSE" | "ROLL";

type ExecEntry = {
  ts: string;
  action: ExecAction;
  sec: string;
  status: string;
  pos?: boolean;
};

const EXEC_LOG: ExecEntry[] = [
  { ts: "26-04-29", action: "FILL",  sec: "ctrl_bar.component @ gs/pwm",         status: "+12 teams",      pos: true },
  { ts: "26-03-12", action: "FILL",  sec: "portfolio_v2.refresh",                status: "+80% cov",       pos: true },
  { ts: "25-09-04", action: "EXEC",  sec: "ai.assist --branch=onboarding",       status: "merged",         pos: true },
  { ts: "25-04-18", action: "EXEC",  sec: "lavita.ring_wizard --gpt-4 --stripe", status: "shipped",        pos: true },
  { ts: "24-09-15", action: "OPEN",  sec: "GS.PWM",                              status: "▲ active",       pos: true },
  { ts: "24-03-08", action: "EXEC",  sec: "odeliya.shopify (16 pages)",          status: "shipped",        pos: true },
  { ts: "23-02-12", action: "OPEN",  sec: "QC.STUDIO",                           status: "▲ active",       pos: true },
  { ts: "22-06-22", action: "ROLL",  sec: "peloton.web → next.gql",              status: "+core_vitals",   pos: true },
  { ts: "21-11-04", action: "FILL",  sec: "guide.launch",                        status: "shipped",        pos: true },
  { ts: "20-03-02", action: "OPEN",  sec: "PELOTON",                             status: "closed 23-02"              },
  { ts: "19-04-10", action: "OPEN",  sec: "INDUSTRIOUS",                         status: "closed 19-12"              },
  { ts: "18-10-22", action: "OPEN",  sec: "ICE.BONDS",                           status: "closed 19-01"              },
  { ts: "18-06-15", action: "OPEN",  sec: "CYA.INSURE",                          status: "closed 18-10"              },
  { ts: "17-10-15", action: "EXEC",  sec: "hitbit.arb 26ms · 40+ exch",          status: "▲ pnl",          pos: true },
  { ts: "16-12-01", action: "OPEN",  sec: "INSTANT.CAR.QUOTE",                   status: "closed 17-09"              },
];

function ExecRow({ items }: { items: ExecEntry[] }) {
  return (
    <>
      {items.map((t, i) => (
        <React.Fragment key={`${t.ts}-${i}`}>
          <span className="mm-tick mm-mono">
            <span className="mm-tick-ts">[{t.ts}]</span>
            <span className={`mm-tick-act-${t.action.toLowerCase()}`}>
              {t.action}
            </span>
            <span className="mm-tick-msg">{t.sec}</span>
            <span
              className={t.pos ? "mm-tick-status-pos" : "mm-tick-status-neu"}
            >
              {t.status}
            </span>
          </span>
          <span className="mm-tick-sep mm-mono">·</span>
        </React.Fragment>
      ))}
    </>
  );
}

function ExecutionLog() {
  return (
    <div
      className="mm-ticker mm-watch"
      aria-label="Execution log — career events as trade fills"
    >
      <div className="mm-ticker-track">
        <ExecRow items={EXEC_LOG} />
        <ExecRow items={EXEC_LOG} />
      </div>
    </div>
  );
}

/* ── Trading-session pill (career length reframed) ────────── */
const CAREER_EPOCH = new Date("2014-08-15T00:00:00-04:00").getTime();

function formatSession(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days     = Math.floor(totalSec / 86400);
  const years    = Math.floor(days / 365);
  const remDays  = days - years * 365;
  const hours    = Math.floor((totalSec % 86400) / 3600);
  const minutes  = Math.floor((totalSec % 3600) / 60);
  const seconds  = totalSec % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return { years, remDays, hh, mm, ss };
}

function SessionStatus() {
  const [up, setUp] = React.useState<ReturnType<typeof formatSession> | null>(
    null
  );

  useEffect(() => {
    const tick = () => setUp(formatSession(Date.now() - CAREER_EPOCH));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!up) {
    return (
      <div className="mm-session mm-mono mm-reveal" data-tick="1480" aria-hidden>
        <span className="mm-session-dot" />
        <span className="mm-session-tkr">MM.NYC</span>
        <span className="mm-tick-sep">·</span>
        <span className="mm-session-key">SESSION</span>
        <span className="mm-session-val">OPEN</span>
      </div>
    );
  }

  return (
    <div
      className="mm-session mm-mono mm-reveal"
      data-tick="1480"
      aria-label={`Session open — ${up.years}y ${up.remDays}d`}
    >
      <span className="mm-session-dot" />
      <span className="mm-session-tkr">MM.NYC</span>
      <span className="mm-tick-sep">·</span>
      <span className="mm-session-key">SESSION</span>
      <span className="mm-session-val">
        {up.years}Y {up.remDays}D {up.hh}:{up.mm}:{up.ss}
      </span>
    </div>
  );
}

/* ── Count-up animated number ─────────────────────────────── */
function CountUp({
  to,
  duration = 1300,
  suffix = "",
  prefix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = React.useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    let raf = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(eased * to));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className="mm-count">
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

/* ── Candlestick chart (mini OHLC plot on each card) ──────── */
type Candle = { bt: number; bb: number; wt: number; wb: number; up: boolean };

const CANDLES: Candle[] = [
  { bt: 17, bb: 20, wt: 16, wb: 21, up: true  },
  { bt: 17, bb: 19, wt: 16, wb: 20, up: false },
  { bt: 15, bb: 19, wt: 14, wb: 20, up: true  },
  { bt: 15, bb: 17, wt: 13, wb: 18, up: false },
  { bt: 12, bb: 17, wt: 11, wb: 18, up: true  },
  { bt: 12, bb: 14, wt: 10, wb: 15, up: false },
  { bt: 11, bb: 14, wt:  9, wb: 16, up: true  },
  { bt:  8, bb: 11, wt:  7, wb: 13, up: true  },
  { bt:  8, bb: 10, wt:  6, wb: 12, up: false },
  { bt:  6, bb: 10, wt:  5, wb: 11, up: true  },
];

function CandleChart({ accent = "var(--crystal)" }: { accent?: string }) {
  const slot = 5;     // x-stride per candle (incl. gap)
  const cw   = 3.2;   // body width
  const H    = 26;    // svg height (matches viewBox)
  const W    = CANDLES.length * slot;
  // The latest candle is "live" — draw a small marker
  const last = CANDLES[CANDLES.length - 1];
  const lastCx = (CANDLES.length - 1) * slot + cw / 2;
  return (
    <svg
      className="mm-candles"
      width={170}
      height={36}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ ["--accent" as string]: accent }}
      aria-hidden
    >
      {/* faint baseline rule */}
      <line className="mm-candle-baseline" x1={0} y1={H - 1} x2={W} y2={H - 1} />
      {CANDLES.map((c, i) => {
        const x  = i * slot;
        const cx = x + cw / 2;
        return (
          <g
            key={i}
            className="mm-candle"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <line
              className="mm-candle-wick"
              x1={cx}
              y1={c.wt}
              x2={cx}
              y2={c.wb}
            />
            <rect
              className={c.up ? "mm-candle-up" : "mm-candle-down"}
              x={x}
              y={c.bt}
              width={cw}
              height={Math.max(c.bb - c.bt, 0.6)}
              rx={0.4}
            />
          </g>
        );
      })}
      {/* "live" marker on the latest candle */}
      <circle
        className="mm-candle"
        cx={lastCx}
        cy={last.bt - 0.6}
        r={0.9}
        fill="var(--accent, var(--crystal))"
        style={{ animationDelay: `${CANDLES.length * 70 + 80}ms` }}
      />
    </svg>
  );
}

type Position = {
  id: string;
  range: string;
  size: string;
  side: "OPEN" | "CLOSED" | "META";
  ticker: string;
  desc: string;
  pnl: string;
  accent: string;
  basis: string;
  strikes: string[];
  instr: string[];
};

const POSITIONS: Position[] = [
  {
    id: "site",
    range: "26 → ●",
    size: "1 site",
    side: "META",
    ticker: "MM.NYC.SITE",
    desc: "the art behind this position · click",
    pnl: "read me",
    accent: "var(--lightning)",
    basis:
      "This site borrows the dense-data ergonomics of a trading desk to describe a software engineering career. The palette is Rolex Milgauss — Z-blue dial, lightning-orange seconds hand, green sapphire crystal, brushed steel — and the visual grammar is Bloomberg: spec sheets, position books, fund holdings, execution logs, analyst tear sheets. Every finance term that appears here was chosen because it carries a second meaning that maps onto a career.",
    strikes: [
      "POSITIONS · jobs reframed as open + closed trading positions, with entry / exit / ΔP",
      "HOLDINGS · the tech stack rendered as a fund-allocation table — weight bars, tenor, LIVE/HELD marks",
      "Execution log · career events scrolling like a trade ticker (FILL · EXEC · OPEN · CLOSE · ROLL)",
      "Tear sheets · every position click expands BASIS · STRIKES · INSTRUMENTS · SIZE · TENOR",
      "Candlesticks · domain expertise as OHLC price action — accent up, Milgauss-red down",
      "Sound · Web Audio sine tones for hover ticks + directional fills (BUY rises, SELL descends)",
      "Double meanings · POSITIONS · HOLDINGS · TENOR · SIZE · MARK · STRIKES · BASIS · INSTRUMENTS · VENUES · CYCLE — each reads in two languages",
    ],
    instr: ["Next.js", "TypeScript", "styled-jsx", "Tailwind", "Web Audio", "SVG"],
  },
  {
    id: "gs",
    range: "24-09 → ●",
    size: "100%",
    side: "OPEN",
    ticker: "GS.PWM",
    desc: "Private Wealth · Frontend on portfolio platform for brokers + HNW clients",
    pnl: "+12 teams",
    accent: "var(--z-blue)",
    basis:
      "Frontend on the Goldman Sachs Private Wealth platform. Brokers and high-net-worth clients depend on it daily. I own 2–4 core portfolio management pages inside a large-scale React + TypeScript + MobX SPA.",
    strikes: [
      "Built reusable Control Bar + Currency Picker — adopted across the broader app",
      "Led portfolio UX redesign + frontend refactor; aligned with internal design system",
      "Lifted unit-test coverage to 80%+ with Jest, strengthening release reliability",
      "Mentor + onboard analysts on architecture, testing, and code quality",
    ],
    instr: ["TypeScript", "React", "MobX", "Jest"],
  },
  {
    id: "qc",
    range: "23-02 → ●",
    size: "fractional",
    side: "OPEN",
    ticker: "QC.STUDIO",
    desc: "Solo studio · AI prototypes · fractional CTO for early-stage teams",
    pnl: "+9 ships",
    accent: "var(--lightning)",
    basis:
      "Solo studio. AI R&D + prototypes that ship. Fractional CTO for early-stage teams — planning, marketing strategy, integrations, the whole stack.",
    strikes: [
      "uwu Labs — PFP image gallery (React + Firebase)",
      "Lavita Labs — diamond ring wizard (Next.js + GPT-4 + Stripe)",
      "Odeliya Probeauty — full Shopify build, 16 pages + custom auth + subscriptions",
      "Cut CI time 50% on partner repos",
    ],
    instr: ["Next.js", "GPT-4", "Firebase", "Stripe", "Shopify"],
  },
  {
    id: "peloton",
    range: "20-03 → 23-02",
    size: "100%",
    side: "CLOSED",
    ticker: "PELOTON",
    desc: "E-commerce React → Next.js + GraphQL · Guide launch · design system",
    pnl: "+core_vitals",
    accent: "var(--crystal)",
    basis:
      "Owned chunks of the e-commerce web stack. Migrated React to Next.js + GraphQL. Hosted the Blockchain/Web3 working group. Drove cross-functional launches.",
    strikes: [
      "Migrated React e-commerce → Next.js + GraphQL — Core Web Vitals up across the funnel",
      "Guided design-system team to ship a Storybook UI library from scratch",
      "Led the Guide product launch — cross-fn with product, marketing, content, design, SRE, DevOps",
      "Refreshed home / bike / bike+ / tread pages — sales funnel cut from 7 steps to 3",
    ],
    instr: ["React", "Next.js", "GraphQL", "Storybook", "TypeScript"],
  },
  {
    id: "industrious",
    range: "19-04 → 19-12",
    size: "100%",
    side: "CLOSED",
    ticker: "INDUSTRIOUS",
    desc: "Coworking platform · UI library · React → Gatsby + GraphQL (formerly CBRE Hana)",
    pnl: "+ui_lib v1",
    accent: "var(--steel)",
    basis:
      "Marketing + operations tech for the coworking platform — formerly CBRE Hana Workplaces.",
    strikes: [
      "Built UI library for component reuse across marketing + ops surfaces",
      "Set up CI/CD pipelines for streamlined deploys",
      "Migrated React → GatsbyJS + GraphQL",
      "Secured sign-in pages; extended marketing + coworking platforms",
    ],
    instr: ["React", "Gatsby", "GraphQL"],
  },
  {
    id: "icebonds",
    range: "18-10 → 19-01",
    size: "100%",
    side: "CLOSED",
    ticker: "ICE.BONDS",
    desc: "Lead frontend · Angular RFQ for institutional bond trading",
    pnl: "+cusip.parser",
    accent: "var(--z-blue)",
    basis:
      "Lead frontend on the Angular RFQ app for institutional bond trading. Formerly Bondpoint.",
    strikes: [
      "Built CUSIP parser — auto-extracts from clipboard, fills validation form",
      "Streamlined the quote-request workflow",
    ],
    instr: ["Angular", "TypeScript"],
  },
  {
    id: "cya",
    range: "18-06 → 18-10",
    size: "100%",
    side: "CLOSED",
    ticker: "CYA.INSURE",
    desc: "Tech lead · client-facing warranty platform",
    pnl: "+200ms loads",
    accent: "var(--crystal)",
    basis:
      "Tech lead on the customer-facing warranty + claims platform for CPS Central. Subsidiary build.",
    strikes: [
      "TypeScript / Angular / Ionic on AWS EC2",
      "Server-side rendering + lazy loading + code splitting",
      "Page loads under 200ms",
      "Instituted weekly code discussions + agile workflow",
    ],
    instr: ["TypeScript", "Angular", "Ionic", "AWS"],
  },
  {
    id: "hitbit",
    range: "17-10 → 18-05",
    size: "100%",
    side: "CLOSED",
    ticker: "HITBIT",
    desc: "Lead full-stack · HFT arbitrage · 26ms · 40+ exchanges · BigQuery",
    pnl: "▲ pnl 26ms",
    accent: "var(--lightning)",
    basis:
      "Lead full-stack on real-time HFT + quant trading algos. The room where 26ms mattered.",
    strikes: [
      "Arbitrage trades executing under 26ms",
      "Real-time database + BigQuery for volatility analysis across 40+ exchanges",
      "Trading strategies + profitability significantly enhanced",
    ],
    instr: ["TypeScript", "Node", "GCP", "Kafka", "BigQuery"],
  },
  {
    id: "icq",
    range: "16-12 → 17-09",
    size: "100%",
    side: "CLOSED",
    ticker: "INSTANT.CAR.QUOTE",
    desc: "Lead full-stack · leasing wizard · C# engine → REST API",
    pnl: "+rest engine",
    accent: "var(--steel)",
    basis:
      "Lead full-stack on a car configuration + leasing wizard.",
    strikes: [
      "Full-stack wizard — TypeScript / Angular / Node / AWS",
      "Repurposed the legacy C# leasing engine into a REST API",
    ],
    instr: ["TypeScript", "Angular", "Node", "AWS", "C#"],
  },
];

function PositionRow({
  r,
  i,
  expanded,
  onToggle,
}: {
  r: Position;
  i: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const handleEnter = () => {
    if (typeof window !== "undefined" && window.__mmAudio) {
      // OPEN ticks higher, CLOSED lower (settled), META top of band
      const f = r.side === "META" ? 1480 : r.side === "OPEN" ? 1320 : 880;
      window.__mmAudio.play(f, 22, 0.02);
    }
  };
  return (
    <>
      <div
        className="mm-watch mm-traj-row"
        style={{
          ["--mm-delay" as string]: `${i * 50}ms`,
          ["--accent" as string]: r.accent,
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onMouseEnter={handleEnter}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="mm-mono mm-traj-year">{r.range}</div>
        <div className="mm-traj-co">
          <span className="mm-pos-side mm-mono" data-side={r.side}>
            {r.side}
          </span>
        </div>
        <div className="mm-traj-note">
          <span
            className="mm-mono"
            style={{
              color: "var(--ink)",
              fontSize: "0.78rem",
              letterSpacing: "0.06em",
            }}
          >
            {r.ticker}
          </span>
          <span style={{ color: "var(--muted)" }}>{` · ${r.desc}`}</span>
          <span
            className="mm-mono"
            style={{
              marginLeft: "0.6rem",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              color:
                r.side === "META"
                  ? "var(--lightning)"
                  : r.side === "OPEN"
                  ? "var(--crystal)"
                  : "var(--soft)",
            }}
          >
            ΔP {r.pnl}
          </span>
          <span className="mm-traj-chevron mm-mono" aria-hidden>
            ▸
          </span>
        </div>
      </div>
      <div
        className="mm-tear mm-mono"
        data-open={expanded}
        style={{ ["--accent" as string]: r.accent }}
        aria-hidden={!expanded}
      >
        <div className="mm-tear-grid">
          <div className="mm-tear-key">basis</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            {r.basis}
          </div>

          <div className="mm-tear-key">strikes</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            <ul className="mm-tear-strikes">
              {r.strikes.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="mm-tear-key">instruments</div>
          <div className="mm-tear-instr">
            {r.instr.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          <div className="mm-tear-key">size · tenor</div>
          <div className="mm-tear-val" style={{ fontFamily: "var(--font-sans)" }}>
            {r.size} · {r.range}
          </div>
        </div>
      </div>
    </>
  );
}

function PositionBook() {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const meta = POSITIONS.filter((p) => p.side === "META");
  const open = POSITIONS.filter((p) => p.side === "OPEN");
  const closed = POSITIONS.filter((p) => p.side === "CLOSED");

  const toggle = (id: string, side: Position["side"]) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (typeof window === "undefined" || !window.__mmAudio) return;
    const m = window.__mmAudio;
    if (next) {
      // expand → "fill" sound, directional by side
      if (side === "OPEN") {
        // BUY fill — rising 2-tone (low → high)
        m.play(660, 55, 0.06);
        window.setTimeout(() => m.play(990, 70, 0.05), 65);
      } else if (side === "CLOSED") {
        // SELL / review of closed pos — descending 2-tone
        m.play(880, 55, 0.06);
        window.setTimeout(() => m.play(550, 70, 0.05), 65);
      } else {
        // META · the design tear sheet — shimmery 3-tone chord
        m.play(660, 50, 0.05);
        window.setTimeout(() => m.play(880, 50, 0.045), 60);
        window.setTimeout(() => m.play(1320, 80, 0.04), 130);
      }
    } else {
      // collapse → single low "tock"
      m.play(330, 80, 0.045);
    }
  };

  let idx = 0;
  const renderRow = (r: Position) => (
    <PositionRow
      key={r.id}
      r={r}
      i={idx++}
      expanded={expanded === r.id}
      onToggle={() => toggle(r.id, r.side)}
    />
  );

  return (
    <section className="pb-12">
      <div className="mm-watch">
        <SectionMarker>Position Book · click to expand tear sheet</SectionMarker>
      </div>
      <div className="mt-8 mm-traj">
        {meta.length > 0 && (
          <>
            <div className="mm-pos-group-label mm-mono">Meta · about this site</div>
            {meta.map(renderRow)}
          </>
        )}
        <div className="mm-pos-group-label mm-mono">Open Positions</div>
        {open.map(renderRow)}
        <div className="mm-pos-group-label mm-mono">Closed Positions</div>
        {closed.map(renderRow)}
      </div>
    </section>
  );
}

type Holding = {
  tkr: string;
  wt: number;       // % allocation
  tenor: string;    // years on the desk
  mark: "LIVE" | "HELD";
};

const HOLDINGS: Holding[] = [
  { tkr: "typescript",   wt: 18, tenor: "9y", mark: "LIVE" },
  { tkr: "react",        wt: 16, tenor: "9y", mark: "LIVE" },
  { tkr: "next.js",      wt: 14, tenor: "6y", mark: "LIVE" },
  { tkr: "node",         wt: 12, tenor: "9y", mark: "LIVE" },
  { tkr: "python",       wt:  8, tenor: "7y", mark: "LIVE" },
  { tkr: "graphql",      wt:  7, tenor: "5y", mark: "LIVE" },
  { tkr: "tailwind",     wt:  6, tenor: "4y", mark: "LIVE" },
  { tkr: "bun",          wt:  4, tenor: "1y", mark: "LIVE" },
  { tkr: "websockets",   wt:  3, tenor: "8y", mark: "LIVE" },
  { tkr: "rest",         wt:  3, tenor: "9y", mark: "LIVE" },
  { tkr: "mongodb",      wt:  3, tenor: "6y", mark: "HELD" },
  { tkr: "firebase",     wt:  3, tenor: "5y", mark: "HELD" },
  { tkr: "aws",          wt:  2, tenor: "9y", mark: "LIVE" },
  { tkr: "gcp",          wt:  1, tenor: "7y", mark: "HELD" },
  { tkr: "llms · gpt-4", wt:  1, tenor: "3y", mark: "LIVE" },
  { tkr: "docker",       wt:  1, tenor: "5y", mark: "LIVE" },
  { tkr: "github actions", wt: 1, tenor: "6y", mark: "LIVE" },
];

function Holdings() {
  // Largest position weight, used to scale the bars to fill the column
  const max = Math.max(...HOLDINGS.map((h) => h.wt));
  return (
    <section className="pb-12">
      <div className="mm-watch">
        <SectionMarker>Holdings · stack as fund allocation</SectionMarker>
      </div>
      <div className="mt-8 mm-watch">
        <table className="mm-hold">
          <thead>
            <tr>
              <th>Ticker</th>
              <th className="mm-hold-bar-cell">Position Size</th>
              <th className="mm-hold-num">Wt</th>
              <th className="mm-hold-num">Tenor</th>
              <th>Mark</th>
            </tr>
          </thead>
          <tbody>
            {HOLDINGS.map((h, i) => (
              <tr
                key={h.tkr}
                className="mm-watch"
                style={{
                  ["--mm-delay" as string]: `${i * 30}ms`,
                  ["--mm-bar" as string]: `${(h.wt / max) * 100}%`,
                }}
                onMouseEnter={() => {
                  if (typeof window !== "undefined" && window.__mmAudio) {
                    // pitch scales with allocation — heavier holdings = lower note
                    const f = 1100 - h.wt * 24;
                    window.__mmAudio.play(f, 18, h.mark === "LIVE" ? 0.018 : 0.012);
                  }
                }}
              >
                <td className="mm-hold-tkr">{h.tkr}</td>
                <td className="mm-hold-bar-cell">
                  <div className="mm-hold-bar">
                    <div className="mm-hold-bar-fill" />
                  </div>
                </td>
                <td className="mm-hold-num">{h.wt}%</td>
                <td className="mm-hold-num">{h.tenor}</td>
                <td>
                  <span
                    className={
                      h.mark === "LIVE"
                        ? "mm-hold-mark-live"
                        : "mm-hold-mark-held"
                    }
                  >
                    {h.mark}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) {
        raf = 0;
        return;
      }
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
      el.style.setProperty("--p", `${p * 100}%`);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="mm-progress" aria-hidden />;
}

function MagneticCTA({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
    el.style.setProperty("--magx", `${x}px`);
    el.style.setProperty("--magy", `${y}px`);
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--magx", "0px");
    el.style.setProperty("--magy", "0px");
  };
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mm-cta"
      data-tick="990"
      data-tick-vol="0.025"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <span>{children}</span>
      <span className="mm-cta-arrow" aria-hidden>
        →
      </span>
    </a>
  );
}

type CardProps = {
  chipColor: string;
  label: string;
  idx: number;
  chart?: boolean;
  children: ReactNode;
};

function Card({ chipColor, label, idx, chart, children }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const xRel = (e.clientX - r.left) / r.width;
    const yRel = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${xRel * 100}%`);
    el.style.setProperty("--my", `${yRel * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - yRel) * 5}deg`);
    el.style.setProperty("--ry", `${(xRel - 0.5) * 5}deg`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const handleEnter = () => {
    if (typeof window !== "undefined" && window.__mmAudio) {
      // crisp high "quote tick" — different freq per card index
      const freqs = [1480, 1320, 1180, 1050];
      window.__mmAudio.play(freqs[idx % freqs.length], 24, 0.022);
    }
  };

  const number = String(idx + 1).padStart(2, "0");

  return (
    <div
      className="mm-watch"
      style={{ ["--mm-delay" as string]: `${idx * 90}ms` }}
    >
      <div
        ref={ref}
        className="mm-card"
        style={{ ["--accent" as string]: chipColor }}
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div className="mm-card-number mm-mono">{number}</div>
        <div className="mm-mono text-xs mm-chip" style={{ color: chipColor }}>
          {label}
        </div>
        <p className="mt-6 leading-relaxed" style={{ color: "var(--muted)" }}>
          {children}
        </p>
        {chart && <CandleChart accent={chipColor} />}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="mm-divider h-px w-full my-28"
      style={{ background: "var(--line)" }}
    />
  );
}

function FootNow() {
  return (
    <footer className="mm-foot mm-watch mt-24 pt-12 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div className="max-w-md">
          <SectionMarker>Now</SectionMarker>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Building. Open to engineering work that touches scale, capital,
            or both.
          </p>
          <div className="mt-6 mm-pull">
            Build it right. Then scale it.
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4">
          <MagneticCTA href="mailto:hello@moshemalka.com">
            hello@moshemalka.com
          </MagneticCTA>
          <div className="flex items-center gap-5 text-sm">
            <a
              className="mm-hover-line"
              data-tick="990"
              href="https://www.linkedin.com/in/moshenyc/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              LinkedIn
            </a>
            <a
              className="mm-hover-line"
              data-tick="880"
              href="https://github.com/moshejs"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              GitHub
            </a>
            <a
              className="mm-hover-line"
              data-tick="770"
              href="https://stackoverflow.com/users/7381252/moshe"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              Stack Overflow
            </a>
          </div>
        </div>
      </div>

      <div
        className="mt-12 pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] mm-mono"
        style={{ color: "var(--soft)", borderTop: "1px solid var(--line)" }}
      >
        <span>Moshe Malka · NYC · 2026</span>
        <span>Full-stack engineer · TypeScript · Next.js · Node</span>
      </div>
    </footer>
  );
}

export default function Home() {
  // Reveal-on-scroll for everything tagged .mm-watch
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".mm-watch");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hover-tick delegation: any element with [data-tick="<freq>"] plays a soft
  // quote-tick the moment the cursor crosses into it. Throttled by mouseover
  // boundaries so it stays ticker-rate (not slot-machine).
  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureAudioModule();
    const onOver = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.("[data-tick]");
      const related = (e.relatedTarget as Element | null)?.closest?.(
        "[data-tick]"
      );
      if (!target || target === related) return;
      const freq = parseInt(
        (target as HTMLElement).getAttribute("data-tick") || "1100",
        10
      );
      const vol = parseFloat(
        (target as HTMLElement).getAttribute("data-tick-vol") || "0.018"
      );
      window.__mmAudio?.play(freq, 18, vol);
    };
    document.body.addEventListener("mouseover", onOver);
    return () => document.body.removeEventListener("mouseover", onOver);
  }, []);

  return (
    <div
      className={`${sans.variable} ${mono.variable} mm-sans min-h-screen text-white relative overflow-hidden`}
    >
      <Theme />
      <ScrollProgress />
      <CursorSpotlight />
      <div className="mm-grain" aria-hidden />

      {/* Motion background */}
      <GridPaper />
      <Aurora />
      <Orb color="#2E6FBB" size={620} top="3%"  left="8%"  duration="14s" delay="0s"   />
      <Orb color="#FFA42E" size={420} top="58%" left="58%" duration="17s" delay="1.4s" />
      <Orb color="#5DBB9A" size={500} top="28%" left="74%" duration="12s" delay="0.8s" />

      <SessionStatus />
      <StatusPill />
      <AudioToggle />

      <div className="container">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L1ETKYXNV4" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-L1ETKYXNV4');
          `}
        </Script>
      </div>
      <Head>
        <title>Moshe Malka | Senior Software Engineer</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Moshe Malka is a NYC born senior software engineer" />
        <meta name="keywords" content="moshe malka, software engineer new york city" />
      </Head>

      <main className="mx-auto max-w-5xl px-6 relative z-10">

        {/* HERO */}
        <section className="pt-32 md:pt-40 pb-32 md:pb-40">
          <div className="mm-reveal">
            <SectionMarker>Moshe Malka — Senior Software Engineer</SectionMarker>
          </div>

          <HeroHeading />

          <p
            className="mt-14 text-2xl max-w-3xl mm-reveal mm-delay-3 leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Capital moving across exchanges.
            <br />
            Data moving through pipelines.
            <br />
            Interfaces moving portfolios.
            <br />
            People moving across cities.
          </p>

          <HeroStats />
        </section>

        <ExecutionLog />

        <Divider />

        {/* GRID INTERSECTION */}
        <section className="mm-grid grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-24 text-xl">
          <Card chipColor="var(--lightning)" label="Trading" idx={0} chart>
            Arbitrage systems under 26ms. Real-time volatility across 40+
            exchanges. Infrastructure where milliseconds change outcomes.
          </Card>

          <Card chipColor="var(--z-blue)"    label="Institutional Finance" idx={1} chart>
            Portfolio systems at Goldman. Interfaces that brokers and
            high-net-worth clients rely on. Precision, governance,
            responsibility.
          </Card>

          <Card chipColor="var(--crystal)"   label="Real Estate" idx={2} chart>
            Operational platforms for coworking and physical space. Software
            that touches real-world infrastructure.
          </Card>

          <Card chipColor="var(--steel)"     label="Modern Web & AI" idx={3} chart>
            NextJS, React, LangChain, GPT-4. Tools that compress iteration
            cycles. Product built fast, but built right.
          </Card>
        </section>

        <Divider />

        {/* POSITION BOOK */}
        <PositionBook />

        <Divider />

        {/* HOLDINGS — stack as fund allocation */}
        <Holdings />

        <Divider />

        {/* PERSONAL ENERGY */}
        <section className="max-w-3xl pb-40 mm-watch">
          <SectionMarker>Energy</SectionMarker>

          <p
            className="mt-10 text-2xl leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            I’m interested in leverage.
            <br /><br />
            <span className="mm-hover-line" data-tick="880">
              Code that moves capital.
            </span>
            <br />
            <span className="mm-hover-line" data-tick="990">
              Systems that scale without drama.
            </span>
            <br />
            <span className="mm-hover-line" data-tick="1100">
              Architecture that survives constraints.
            </span>
            <br /><br />
            And environments that expand perspective.
          </p>
        </section>

        <FootNow />

      </main>
    </div>
  );
}
