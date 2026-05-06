import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  CANDLES,
  CAREER_EPOCH,
  EXEC_LOG,
  HOLDINGS,
  POSITIONS,
  countCareerPositions,
  countOpenPositions,
  formatSession,
  type Candle,
  type ExecAction,
  type ExecEntry,
  type Holding,
  type Position,
} from "@/lib/portfolio";

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

        /* Miami after-hours pepper — used as accent stops in the
           hero gradient and the energy-line hover sweep. Just a touch. */
        --mia-pink:  #ff6b9d;
        --mia-teal:  #4ecdc4;

        /* legacy aliases — keep mapping so existing references stay valid */
        --blue:   var(--z-blue);
        --gold:   var(--lightning);
        --green:  var(--crystal);
        --violet: var(--steel);

        /* Custom easing curves — built-in ease is too weak.
           Use these everywhere; reserve linear for constant motion. */
        --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
        --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
        --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

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
          var(--z-blue)    0%,
          var(--crystal)   22%,
          var(--mia-teal)  38%,
          var(--lightning) 56%,
          var(--mia-pink)  74%,
          var(--z-blue)    100%
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
      @media (hover: hover) and (pointer: fine) {
        .mm-ticker:hover .mm-ticker-track {
          animation-play-state: paused;
        }
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
        animation: candleIn 700ms var(--ease-out) forwards;
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
        /* Start at scaleY(0.6), not 0 — nothing in the real world appears
           from nothing. The candle should grow into place, not pop in. */
        0%   { opacity: 0; transform: scaleY(0.6); }
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
        transition: background-color 200ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-hold tbody tr:hover {
          background: rgba(255, 255, 255, 0.018);
        }
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
        transition:
          border-color 220ms var(--ease-out),
          color 220ms var(--ease-out),
          background 220ms var(--ease-out),
          transform 140ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-audio:hover {
          border-color: rgba(255, 255, 255, 0.18);
          color: var(--ink);
        }
      }
      .mm-audio:active { transform: scale(0.97); }
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
      .mm-traj-row:focus-visible {
        outline: 1px solid var(--accent, var(--steel));
        outline-offset: -1px;
        background: rgba(255, 255, 255, 0.022);
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
        transition: transform 220ms var(--ease-out);
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
        transition: padding-left 220ms var(--ease-out),
                    background-color 220ms var(--ease-out);
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
        transition: opacity 220ms var(--ease-out),
                    transform 280ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-traj-row:hover {
          padding-left: 1.5rem;
          background: rgba(255, 255, 255, 0.018);
        }
        .mm-traj-row:hover::before { opacity: 1; transform: scaleY(1); }
      }
      /* Press feedback — clickable row should respond to a press */
      .mm-traj-row:active { background: rgba(255, 255, 255, 0.04); }

      .mm-traj-year {
        color: var(--soft);
        letter-spacing: 0.18em;
        font-size: 11px;
        transition: color 220ms var(--ease-out), transform 220ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-traj-row:hover .mm-traj-year {
          color: var(--accent);
          transform: translateX(2px);
        }
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
        transition: color 200ms var(--ease-out),
                    border-color 200ms var(--ease-out),
                    transform 220ms var(--ease-out),
                    background-color 200ms var(--ease-out),
                    box-shadow 220ms var(--ease-out);
        cursor: default;
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-tag:hover {
          color: var(--ink);
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
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
        --press: 1;
        transform: translate3d(var(--magx), var(--magy), 0) scale(var(--press));
        transition:
          transform 200ms var(--ease-out),
          border-color 220ms var(--ease-out),
          background 220ms var(--ease-out),
          box-shadow 220ms var(--ease-out);
        overflow: hidden;
      }
      .mm-cta::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(120deg, var(--z-blue), var(--crystal), var(--lightning));
        opacity: 0;
        transition: opacity 220ms var(--ease-out);
        z-index: -1;
        filter: blur(18px);
      }
      @media (hover: hover) and (pointer: fine) {
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
      }
      /* Compose with the magnetic + scale transform via custom prop */
      .mm-cta:active { --press: 0.97; }
      .mm-cta-arrow {
        display: inline-block;
        transition: transform 200ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-cta:hover .mm-cta-arrow { transform: translateX(5px); }
      }

      /* ── City watermarks (micro-SVGs of NYC + MIA landmarks) ── */
      /* Four hand-tuned silhouettes anchored to the page wrapper, so
         they pass by as the user scrolls. Drawn at 6–9% opacity so
         they read as ambient signature rather than ornament. NYC in
         steel; MIA in mia-teal + mia-pink. */
      .mm-cities {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
      }
      .mm-city {
        position: absolute;
        fill: currentColor;
      }
      .mm-city-skyline { top:  4%; right: 3%; width: 120px; color: var(--steel);    opacity: 0.07; }
      .mm-city-bridge  { top: 44%; left:  2%; width: 130px; color: var(--steel);    opacity: 0.06; }
      .mm-city-palm    { top: 22%; right: 2%; width:  82px; color: var(--mia-teal); opacity: 0.09; }
      .mm-city-sun     { top: 72%; right: 4%; width:  92px; color: var(--mia-pink); opacity: 0.08; }
      @media (max-width: 640px) {
        /* On phones the icons crowd the narrower content well — drop
           the bridge (left margin is already tight) and shrink the rest. */
        .mm-city-bridge { display: none; }
        .mm-city-skyline { width: 80px; }
        .mm-city-palm    { width: 56px; }
        .mm-city-sun     { width: 64px; }
      }

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
        transition:
          border-color 220ms var(--ease-out),
          background-color 220ms var(--ease-out),
          transform 160ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-status:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(10, 12, 16, 0.7);
          transform: translateY(-1px);
        }
      }
      .mm-status:active { transform: scale(0.97); }
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

      /* ── Movement table (hero subtitle, dense factsheet) ───── */
      /* Replaces the looser 4-line paragraph with 4 dense rows + an
         animated "flow" indicator per row. The dot drifting along each
         track is what visually communicates "moving" — no slot machine. */
      .mm-movements {
        max-width: 540px;
        border-top: 1px solid var(--line);
        margin-top: 3.5rem;
      }
      .mm-movement {
        display: grid;
        grid-template-columns: 110px 1fr 80px;
        align-items: center;
        gap: 1.1rem;
        padding: 0.6rem 0.1rem;
        border-bottom: 1px solid var(--line);
        opacity: 0;
        transform: translateY(8px);
        animation: movementIn 720ms cubic-bezier(0.18, 0.8, 0.18, 1) forwards;
        animation-delay: var(--mm-delay, 0ms);
      }
      @keyframes movementIn {
        to { opacity: 1; transform: translateY(0); }
      }
      .mm-movement-asset {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent, var(--soft));
        white-space: nowrap;
      }
      .mm-movement-venue {
        color: var(--ink);
        font-size: 0.98rem;
        letter-spacing: -0.005em;
        opacity: 0.92;
      }
      .mm-movement-flow {
        position: relative;
        display: block;
        width: 100%;
        height: 8px;
      }
      .mm-movement-flow-track {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.10) 30%,
          rgba(255, 255, 255, 0.10) 70%,
          transparent
        );
        transform: translateY(-50%);
      }
      .mm-movement-flow-dot {
        position: absolute;
        top: 50%;
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--accent, var(--ink));
        box-shadow: 0 0 10px var(--accent, var(--ink));
        transform: translate(-50%, -50%);
        animation: flowDrift 4.4s linear infinite;
        animation-delay: var(--mm-flow-delay, 0ms);
        will-change: left, opacity;
      }
      @keyframes flowDrift {
        0%   { left: 0%;   opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 1; }
        100% { left: 100%; opacity: 0; }
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-movement:hover {
          background: rgba(255, 255, 255, 0.018);
        }
        .mm-movement:hover .mm-movement-flow-dot {
          animation-duration: 1.6s;
        }
      }

      /* ── Rotating verb (slot-machine style) ────────────────── */
      /* Reuses the same overflow:hidden trick as .mm-line so each word
         slides into the slot from below — like a quote refresh on a
         trading screen. */
      .mm-rotor {
        display: inline-block;
        height: 1.04em;
        line-height: 1.04;
        overflow: hidden;
        vertical-align: bottom;
        /* Every rotated word is 5–6 chars and the rotor sits at the end
           of the line, so width changes don't push other text. */
      }
      .mm-rotor-inner {
        display: block;
        transform: translateY(calc(-1.04em * var(--idx, 0)));
        transition: transform 620ms cubic-bezier(0.77, 0, 0.175, 1);
        will-change: transform;
      }
      .mm-rotor-word {
        display: block;
        height: 1.04em;
        line-height: 1.04;
        white-space: nowrap;
      }
      .mm-rotor-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
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
          opacity 600ms var(--ease-out),
          transform 600ms var(--ease-out);
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
          transform 240ms var(--ease-out),
          border-color 220ms var(--ease-out),
          box-shadow 240ms var(--ease-out),
          background-color 220ms var(--ease-out);
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
        transition: opacity 220ms var(--ease-out);
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
      @media (hover: hover) and (pointer: fine) {
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
        .mm-card:hover::after  { animation: softSweep 800ms var(--ease-out); }
      }

      .mm-card-number {
        position: absolute;
        top: 1.5rem;
        right: 1.6rem;
        font-size: 10px;
        letter-spacing: 0.22em;
        color: rgba(255, 255, 255, 0.22);
        transition: color 200ms var(--ease-out), transform 200ms var(--ease-out);
        pointer-events: none;
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-card:hover .mm-card-number {
          color: var(--accent);
          transform: translateX(-4px);
          text-shadow: 0 0 16px color-mix(in oklab, var(--accent) 50%, transparent);
        }
      }

      .mm-chip {
        display: inline-block;
        transition:
          transform 200ms var(--ease-out),
          text-shadow 200ms var(--ease-out),
          letter-spacing 200ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-card:hover .mm-chip {
          transform: translateX(6px);
          text-shadow: 0 0 18px rgba(255, 255, 255, 0.28);
          letter-spacing: 0.18em;
        }
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
        transition: color 200ms var(--ease-out);
      }
      .mm-hover-line::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -0.22em;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, var(--blue), var(--mia-pink), var(--mia-teal), transparent);
        transform: scaleX(0.18);
        opacity: 0;
        transform-origin: left;
        transition: transform 260ms var(--ease-out), opacity 220ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-hover-line:hover { color: rgba(255, 255, 255, 0.95); }
        .mm-hover-line:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }
      }

      /* ── Hero power shot (portrait on the left of the headline) ─ */
      /* Portrait crop, brushed-steel frame with a faint Milgauss
         lightning halo. Aspect 3:4 so it sits beside ~3 lines of the
         h1 without dominating, but reads with weight. Stacks above
         the heading on mobile. */
      .mm-power-shot {
        position: relative;
        aspect-ratio: 3 / 4;
        width: 100%;
        max-width: 280px;
        border-radius: 6px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(184, 197, 214, 0.32);
        box-shadow:
          0 0 0 1px rgba(255, 164, 46, 0.14),
          0 20px 60px rgba(0, 0, 0, 0.5),
          0 0 80px rgba(46, 111, 187, 0.10);
        transition:
          transform 380ms var(--ease-out),
          box-shadow 380ms var(--ease-out),
          border-color 380ms var(--ease-out);
      }
      @media (min-width: 768px) {
        .mm-power-shot { max-width: 300px; }
      }
      .mm-power-shot img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 28%;
        display: block;
      }
      .mm-power-shot::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.06),
          transparent 25%,
          transparent 60%,
          rgba(0, 0, 0, 0.45)
        );
        pointer-events: none;
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-power-shot:hover {
          transform: translateY(-3px);
          border-color: var(--lightning);
          box-shadow:
            0 0 0 1px rgba(255, 164, 46, 0.45),
            0 28px 80px rgba(0, 0, 0, 0.55),
            0 0 100px rgba(46, 111, 187, 0.18);
        }
      }

      /* ── Footer ───────────────────────────────────────────── */
      .mm-foot {
        border-top: 1px solid var(--line);
      }
      .mm-foot a {
        color: var(--muted);
        transition: color 200ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-foot a:hover { color: var(--ink); }
      }

      /* ── Order-type badges (MKT · LMT · GTC · RFQ) ─────────── */
      .mm-ordtype {
        display: inline-flex;
        align-items: center;
        padding: 0.06rem 0.36rem;
        margin-right: 0.5rem;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        border: 1px solid var(--line);
        border-radius: 3px;
        color: var(--soft);
        background: rgba(255, 255, 255, 0.018);
        vertical-align: 1px;
        line-height: 1.4;
        transition:
          color 200ms var(--ease-out),
          border-color 200ms var(--ease-out),
          background 200ms var(--ease-out);
      }
      .mm-ordtype[data-type="MKT"] {
        color: var(--lightning);
        border-color: rgba(255, 164, 46, 0.34);
        background: rgba(255, 164, 46, 0.07);
      }
      .mm-ordtype[data-type="LMT"] {
        color: var(--z-blue);
        border-color: rgba(46, 111, 187, 0.40);
        background: rgba(46, 111, 187, 0.08);
      }
      .mm-ordtype[data-type="GTC"] {
        color: var(--crystal);
        border-color: rgba(93, 187, 154, 0.36);
        background: rgba(93, 187, 154, 0.07);
      }
      .mm-ordtype[data-type="RFQ"] {
        color: var(--steel);
        border-color: rgba(184, 197, 214, 0.24);
        background: rgba(184, 197, 214, 0.05);
      }

      /* ── Settlement microcopy (under email CTA) ────────────── */
      .mm-settle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .mm-settle::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--crystal);
        box-shadow: 0 0 6px rgba(93, 187, 154, 0.6);
        animation: settlePulse 2.4s ease-in-out infinite;
      }
      @keyframes settlePulse {
        0%, 100% { opacity: 0.65; transform: scale(1); }
        50%      { opacity: 1;    transform: scale(1.15); }
      }

      /* ── Fund-stats banner (above Holdings table) ──────────── */
      /* Banner bg kept very light (2% blue tint) so the page-wide
         cursor spotlight reads through it rather than being dimmed
         like a "stuck" patch over Holdings. */
      .mm-fund-stats {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        gap: 0;
        padding: 0.85rem 0;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        margin-bottom: 0.6rem;
        background: rgba(46, 111, 187, 0.02);
      }
      .mm-fund-stat {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
        padding: 0 1.1rem;
        border-right: 1px solid var(--line);
        flex: 1 1 auto;
        min-width: 110px;
        opacity: 0;
        transform: translateY(4px);
        animation: fundStatIn 540ms cubic-bezier(0.18, 0.8, 0.2, 1) forwards;
        animation-delay: var(--mm-delay, 0ms);
      }
      @keyframes fundStatIn {
        to { opacity: 1; transform: translateY(0); }
      }
      .mm-fund-stat:last-child { border-right: none; }
      .mm-fund-stat:first-child { padding-left: 0.5rem; }
      .mm-fund-key {
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .mm-fund-key-dot {
        display: inline-block;
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--crystal);
        box-shadow: 0 0 6px rgba(93, 187, 154, 0.65);
        animation: fundLivePulse 2.4s ease-in-out infinite;
      }
      @keyframes fundLivePulse {
        0%, 100% { opacity: 0.55; transform: scale(1);    }
        50%      { opacity: 1;    transform: scale(1.18); }
      }
      .mm-fund-val {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
        font-size: 0.92rem;
        letter-spacing: 0.04em;
        color: var(--ink);
      }
      .mm-fund-val.mm-fund-pos { color: var(--crystal); }

      /* ── Trade-ticket modal (email CTA confirmation) ───────── */
      .mm-ticket-overlay {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: rgba(6, 9, 18, 0.72);
        backdrop-filter: blur(8px) saturate(120%);
        -webkit-backdrop-filter: blur(8px) saturate(120%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms var(--ease-out);
      }
      .mm-ticket-overlay[data-open="true"] {
        opacity: 1;
        pointer-events: auto;
      }
      .mm-ticket {
        position: relative;
        width: 100%;
        max-width: 480px;
        background:
          linear-gradient(
            180deg,
            rgba(20, 28, 46, 0.96),
            rgba(8, 12, 22, 0.96)
          );
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 6px;
        box-shadow:
          0 30px 80px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(255, 164, 46, 0.06),
          0 0 60px rgba(46, 111, 187, 0.18);
        font-family: var(--font-mono), ui-monospace, monospace;
        transform: translateY(8px) scale(0.985);
        transition:
          transform 280ms var(--ease-out),
          opacity 220ms var(--ease-out);
        opacity: 0;
      }
      .mm-ticket-overlay[data-open="true"] .mm-ticket {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      .mm-ticket-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1.1rem;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(255, 164, 46, 0.06), transparent);
      }
      .mm-ticket-title {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        font-size: 10px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--lightning);
      }
      .mm-ticket-title::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--lightning);
        box-shadow: 0 0 8px rgba(255, 164, 46, 0.8);
        animation: settlePulse 2.4s ease-in-out infinite;
      }
      .mm-ticket-tkr {
        font-size: 10px;
        letter-spacing: 0.22em;
        color: var(--soft);
      }
      .mm-ticket-close {
        background: transparent;
        border: 1px solid transparent;
        color: var(--soft);
        font-size: 18px;
        line-height: 1;
        width: 26px;
        height: 26px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          color 200ms var(--ease-out),
          border-color 200ms var(--ease-out),
          background 200ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-ticket-close:hover {
          color: var(--ink);
          border-color: var(--line);
          background: rgba(255, 255, 255, 0.04);
        }
      }
      .mm-ticket-body {
        padding: 0.4rem 1.1rem 1rem;
      }
      .mm-ticket-row {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 0.6rem;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.025);
      }
      .mm-ticket-row:last-child { border-bottom: none; }
      .mm-ticket-key {
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
      }
      .mm-ticket-val {
        font-size: 0.84rem;
        letter-spacing: 0.06em;
        color: var(--ink);
      }
      .mm-ticket-val[data-side="BUY"]   { color: var(--crystal); }
      .mm-ticket-val[data-side="MKT"]   { color: var(--lightning); }
      .mm-ticket-val[data-side="ACCENT"]{ color: var(--lightning); }
      .mm-ticket-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.8rem;
        padding: 0.85rem 1.1rem;
        border-top: 1px solid var(--line);
        background: linear-gradient(180deg, transparent, rgba(46, 111, 187, 0.05));
      }
      .mm-ticket-hint {
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
      }
      .mm-ticket-hint kbd {
        display: inline-block;
        padding: 0.06rem 0.34rem;
        margin-right: 0.3rem;
        border: 1px solid var(--line);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.025);
        color: var(--muted);
        font-family: inherit;
        font-size: 9px;
      }
      .mm-ticket-submit {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.9rem;
        font-size: 10px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #060912;
        background: linear-gradient(120deg, var(--lightning), #ffc46a);
        border: 1px solid rgba(255, 164, 46, 0.6);
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        transition:
          transform 160ms var(--ease-out),
          box-shadow 220ms var(--ease-out),
          background 220ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-ticket-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(255, 164, 46, 0.32);
          background: linear-gradient(120deg, #ffb958, var(--lightning));
        }
      }
      .mm-ticket-submit:active { transform: translateY(0) scale(0.98); }

      /* ── Cmd+K Bloomberg-style command terminal ─────────────── */
      .mm-term-overlay {
        position: fixed;
        inset: 0;
        z-index: 70;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 8vh 1.5rem 1.5rem;
        background: rgba(6, 9, 18, 0.72);
        backdrop-filter: blur(8px) saturate(120%);
        -webkit-backdrop-filter: blur(8px) saturate(120%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms var(--ease-out);
      }
      .mm-term-overlay[data-open="true"] {
        opacity: 1;
        pointer-events: auto;
      }
      .mm-term {
        width: 100%;
        max-width: 560px;
        background:
          linear-gradient(180deg, rgba(12, 16, 28, 0.97), rgba(6, 10, 20, 0.97));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        box-shadow:
          0 30px 80px rgba(0, 0, 0, 0.6),
          0 0 60px rgba(46, 111, 187, 0.16);
        font-family: var(--font-mono), ui-monospace, monospace;
        overflow: hidden;
        transform: translateY(-12px);
        opacity: 0;
        transition:
          transform 240ms var(--ease-out),
          opacity 200ms var(--ease-out);
      }
      .mm-term-overlay[data-open="true"] .mm-term {
        transform: translateY(0);
        opacity: 1;
      }
      .mm-term-input-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--line);
      }
      .mm-term-prompt {
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--lightning);
        white-space: nowrap;
      }
      .mm-term-input {
        flex: 1 1 auto;
        background: transparent;
        border: none;
        outline: none;
        color: var(--ink);
        font-family: inherit;
        font-size: 0.95rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0;
      }
      .mm-term-input::placeholder {
        color: var(--soft);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.78rem;
      }
      .mm-term-go {
        font-size: 9.5px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
      }
      .mm-term-go kbd {
        display: inline-block;
        padding: 0.06rem 0.34rem;
        margin-left: 0.3rem;
        border: 1px solid var(--line);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.025);
        color: var(--muted);
        font-family: inherit;
        font-size: 9px;
      }
      .mm-term-list {
        list-style: none;
        margin: 0;
        padding: 0.4rem 0;
        max-height: 50vh;
        overflow-y: auto;
      }
      .mm-term-item {
        display: grid;
        grid-template-columns: 96px 1fr auto;
        gap: 0.8rem;
        align-items: center;
        padding: 0.55rem 1rem;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: background 160ms var(--ease-out), border-color 160ms var(--ease-out);
      }
      .mm-term-item[data-active="true"] {
        background: rgba(255, 164, 46, 0.06);
        border-left-color: var(--lightning);
      }
      .mm-term-tkr {
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        color: var(--ink);
      }
      .mm-term-desc {
        font-size: 0.78rem;
        color: var(--muted);
        text-transform: none;
        letter-spacing: 0;
      }
      .mm-term-cmd {
        font-size: 9.5px;
        letter-spacing: 0.2em;
        color: var(--soft);
      }
      .mm-term-empty {
        padding: 1rem;
        color: var(--soft);
        font-size: 0.78rem;
        text-align: center;
      }
      .mm-term-foot {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.55rem 1rem;
        border-top: 1px solid var(--line);
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--soft);
      }
      .mm-term-foot kbd {
        display: inline-block;
        padding: 0.06rem 0.34rem;
        margin-right: 0.3rem;
        border: 1px solid var(--line);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.025);
        color: var(--muted);
        font-family: inherit;
        font-size: 9px;
      }

      /* ── Hint pill (Cmd+K nudge in StatusPill area) ─────────── */
      .mm-cmdk-hint {
        position: fixed;
        bottom: 1.3rem;
        left: 1.4rem;
        z-index: 30;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(6, 9, 18, 0.55);
        backdrop-filter: blur(10px) saturate(140%);
        -webkit-backdrop-filter: blur(10px) saturate(140%);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
        cursor: pointer;
        transition:
          color 220ms var(--ease-out),
          border-color 220ms var(--ease-out),
          background 220ms var(--ease-out),
          transform 140ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        .mm-cmdk-hint:hover {
          color: var(--ink);
          border-color: rgba(255, 255, 255, 0.18);
        }
      }
      .mm-cmdk-hint:active { transform: scale(0.97); }
      .mm-cmdk-hint kbd {
        display: inline-block;
        padding: 0.06rem 0.34rem;
        border: 1px solid var(--line);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.04);
        font-family: inherit;
        font-size: 9px;
        color: var(--ink);
      }

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
        .mm-hold-bar-fill,
        .mm-settle::before,
        .mm-ticket,
        .mm-ticket-title::before,
        .mm-term,
        .mm-rotor-inner,
        .mm-movement,
        .mm-movement-flow-dot,
        .mm-fund-stat,
        .mm-fund-key-dot,
        .mm-power-shot {
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

/* Words the hero verb cycles through — each carries a finance double
   meaning (move/fill/ship/scale/yield) so the hero "moves" both
   literally (slot-machine motion) and conceptually. Keep all 5–6 chars
   so the line doesn't reflow as the word swaps. */
const HERO_VERBS = ["move.", "fill.", "ship.", "scale.", "yield."] as const;

function RotatingWord({
  words,
  interval = 2800,
  startDelay = 1700,
}: {
  words: readonly string[];
  interval?: number;
  startDelay?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    // Wait for the entrance animation to settle before cycling, then
    // tick on the given interval. Pause when the tab is hidden so the
    // user doesn't return to a stale-feeling word jumping around.
    let intervalId: number | null = null;
    let started = false;
    const startCycling = () => {
      if (started) return;
      started = true;
      intervalId = window.setInterval(() => {
        if (document.hidden) return;
        setIdx((i) => (i + 1) % words.length);
      }, interval);
    };
    const startTimeoutId = window.setTimeout(startCycling, startDelay);
    return () => {
      window.clearTimeout(startTimeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [words.length, interval, startDelay]);

  return (
    <span className="mm-rotor">
      <span
        className="mm-rotor-inner"
        style={{ ["--idx" as string]: idx }}
        aria-hidden
      >
        {words.map((w, i) => (
          <span key={i} className="mm-rotor-word mm-grad-word">
            {w}
          </span>
        ))}
      </span>
      <span className="mm-rotor-sr">{words[idx]}</span>
    </span>
  );
}

/* The hero's subtitle, dense factsheet edition. Each row carries the
   same statement the prose used to make ("Capital moving across
   exchanges.") plus a small flow indicator — a dot drifting along a
   track in the row's accent color. The dots are offset so they don't
   sync, which keeps the section feeling alive without a slot-machine. */
const MOVEMENTS = [
  { asset: "Capital",    venue: "across exchanges",    accent: "var(--lightning)", flowDelay: "0s"    },
  { asset: "Data",       venue: "through pipelines",   accent: "var(--z-blue)",    flowDelay: "-1.1s" },
  { asset: "Interfaces", venue: "moving portfolios",   accent: "var(--crystal)",   flowDelay: "-2.2s" },
  { asset: "People",     venue: "across cities",       accent: "var(--steel)",     flowDelay: "-3.3s" },
] as const;

function MovementTable() {
  return (
    <div className="mm-movements" aria-label="What I help move">
      {MOVEMENTS.map((m, i) => (
        <div
          key={m.asset}
          className="mm-movement"
          style={{
            ["--mm-delay" as string]: `${480 + i * 110}ms`,
            ["--accent" as string]: m.accent,
            ["--mm-flow-delay" as string]: m.flowDelay,
          }}
          data-tick={`${1100 - i * 70}`}
          data-tick-vol="0.014"
        >
          <span className="mm-movement-asset">{m.asset}</span>
          <span className="mm-movement-venue">{m.venue}</span>
          <span className="mm-movement-flow" aria-hidden>
            <span className="mm-movement-flow-track" />
            <span className="mm-movement-flow-dot" />
          </span>
        </div>
      ))}
    </div>
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
          className="mm-word"
          style={{ animationDelay: `${base + (totalCount - 1) * step + 120}ms` }}
        >
          <RotatingWord words={HERO_VERBS} />
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
        <div className="mm-spec-val">NYC ↔ MIA</div>
        <div className="mm-spec-ctx">dual desk · since ’14</div>
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

/* ── Haptic feedback (Web Vibration API) ───────────────────── */
/* No-ops on iOS Safari + desktop. Subtle by design — finance UIs
   should feel like a quote-tick, not a phone notification. */

type HapticPattern = "tick" | "tap" | "chunk" | "fill" | "pulse";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  pulse: 5,
  tick:  10,
  tap:   16,
  chunk: [12, 28, 18],
  fill:  [14, 22, 12, 22, 26],
};

function haptic(pattern: HapticPattern) {
  if (typeof navigator === "undefined") return;
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  // Respect the OS-level reduced-motion preference — vibration is motion.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    nav.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    /* swallow — some browsers throw on certain patterns */
  }
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
    haptic("tick");
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

/* ── City watermarks · NYC + MIA micro-SVGs ──────────────────
   Four hand-tuned silhouettes scattered behind content as ambient
   signature. Each is a single shape, drawn at 6–9% opacity so they
   read as watermark, not ornament. */
function CityIcons() {
  return (
    <div className="mm-cities" aria-hidden>
      {/* NYC · Skyline — varying-height buildings, one tapered tower */}
      <svg className="mm-city mm-city-skyline" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
        <path d="
          M0 80 L0 56 L14 56 L14 44 L26 44 L26 56 L36 56
          L36 30 L44 30 L44 18 L48 18 L48 8 L52 8 L52 0 L54 0
          L54 8 L58 8 L58 18 L62 18 L62 30 L70 30 L70 56
          L80 56 L80 36 L96 36 L96 56 L106 56 L106 22 L114 22
          L114 56 L122 56 L122 48 L140 48 L140 80 Z
        " />
      </svg>

      {/* NYC · Brooklyn Bridge — twin gothic towers + suspension cables */}
      <svg className="mm-city mm-city-bridge" viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg">
        {/* left tower */}
        <path d="M30 70 L30 22 Q30 14 34 14 L34 6 L36 6 L36 14 Q40 14 40 22 L40 70 Z" />
        <path d="M32 50 L32 26 L34 26 L34 50 Z M36 50 L36 26 L38 26 L38 50 Z" fill="#060912" />
        {/* right tower */}
        <path d="M100 70 L100 22 Q100 14 104 14 L104 6 L106 6 L106 14 Q110 14 110 22 L110 70 Z" />
        <path d="M102 50 L102 26 L104 26 L104 50 Z M106 50 L106 26 L108 26 L108 50 Z" fill="#060912" />
        {/* main suspension cables (parabolic between towers) */}
        <path d="M0 50 Q18 18 35 14 Q35 18 70 48 Q105 18 105 14 Q122 18 140 50"
              stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* vertical suspenders */}
        <path d="M48 32 L48 50 M58 42 L58 50 M70 48 L70 50 M82 42 L82 50 M92 32 L92 50"
              stroke="currentColor" strokeWidth="0.6" />
        {/* deck */}
        <path d="M0 50 L140 50 L140 53 L0 53 Z" />
      </svg>

      {/* MIA · Palm tree — curved trunk + sweeping fronds + coconuts */}
      <svg className="mm-city mm-city-palm" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
        {/* trunk */}
        <path d="M50 48 C 42 70, 50 95, 46 138 L 56 138 C 52 95, 60 70, 50 48 Z" />
        {/* fronds — 5 sweeping outward */}
        <path d="M50 48 C 36 38, 18 36, 4 44 C 22 42, 38 48, 50 56 Z" />
        <path d="M50 48 C 64 38, 82 36, 96 44 C 78 42, 62 48, 50 56 Z" />
        <path d="M50 48 C 38 28, 24 12, 14 2 C 32 18, 44 36, 52 56 Z" />
        <path d="M50 48 C 62 28, 76 12, 86 2 C 68 18, 56 36, 48 56 Z" />
        <path d="M50 48 C 50 30, 46 14, 44 0 C 50 18, 52 36, 52 56 Z" />
        {/* coconuts at the crown */}
        <circle cx="46" cy="52" r="2.5" />
        <circle cx="54" cy="54" r="2" />
      </svg>

      {/* MIA · Sun over wavy horizon — South Beach signature */}
      <svg className="mm-city mm-city-sun" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
        {/* sun */}
        <circle cx="60" cy="36" r="16" />
        {/* sun rays */}
        <path d="
          M60 8  L60 14   M60 58 L60 64
          M28 36 L34 36   M86 36 L92 36
          M37 13 L41 17   M79 55 L83 59
          M83 13 L79 17   M41 55 L37 59
        " stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* horizon water */}
        <path d="
          M0 70 Q15 65 30 70 Q45 75 60 70 Q75 65 90 70 Q105 75 120 70
          L120 90 L0 90 Z
        " />
      </svg>
    </div>
  );
}

function GridPaper() {
  return <div className="mm-grid-paper" aria-hidden />;
}

/* ── Execution log (career events as trade fills/orders) ──── */
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
        <span className="mm-session-tkr">MM.NYC.MIA</span>
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
      <span className="mm-session-tkr">MM.NYC.MIA</span>
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
  decimals = 0,
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const [val, setVal] = React.useState(0);

  useEffect(() => {
    // For very small targets the ramp would just flicker — skip the animation.
    if (to <= 1 && decimals === 0) {
      setVal(to);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(eased * to);
      if (t >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to, duration, decimals]);

  return (
    <span className="mm-count">
      {prefix}
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val)}
      {suffix}
    </span>
  );
}

/* ── Candlestick chart (mini OHLC plot on each card) ──────── */
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
    if (next) {
      // Expand → directional fill (audio + haptic both follow the same
      // OPEN/CLOSED/META split).
      haptic(side === "OPEN" ? "chunk" : side === "CLOSED" ? "tap" : "chunk");
    } else {
      haptic("tick");
    }
    if (typeof window === "undefined" || !window.__mmAudio) return;
    const m = window.__mmAudio;
    if (next) {
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
    <section id="position-book" className="mt-16">
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

function Holdings() {
  // Largest position weight, used to scale the bars to fill the column
  const max = Math.max(...HOLDINGS.map((h) => h.wt));

  // Aggregate stats — read like a fund factsheet. Numbers are derived, not
  // hardcoded, so they stay in sync if HOLDINGS changes.
  const names = HOLDINGS.length;
  const gross = HOLDINGS.reduce((s, h) => s + h.wt, 0);
  const live = HOLDINGS.filter((h) => h.mark === "LIVE").reduce(
    (s, h) => s + h.wt,
    0
  );
  const held = gross - live;
  const avgTenor =
    HOLDINGS.reduce((s, h) => s + parseFloat(h.tenor), 0) / names;
  const top = [...HOLDINGS].sort((a, b) => b.wt - a.wt)[0];

  return (
    <section id="holdings">
      <div className="mm-watch">
        <SectionMarker>Holdings · stack as fund allocation</SectionMarker>
      </div>
      <div className="mt-8 mm-watch">
        <div className="mm-fund-stats" aria-label="Fund factsheet">
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "0ms" }}>
            <span className="mm-fund-key">Gross</span>
            <span className="mm-fund-val">
              <CountUp to={gross} suffix="%" decimals={1} duration={1100} />
            </span>
          </div>
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "70ms" }}>
            <span className="mm-fund-key">
              <span className="mm-fund-key-dot" aria-hidden />
              Live
            </span>
            <span className="mm-fund-val mm-fund-pos">
              <CountUp to={live} suffix="%" decimals={1} duration={1300} />
            </span>
          </div>
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "140ms" }}>
            <span className="mm-fund-key">Held</span>
            <span className="mm-fund-val">
              <CountUp to={held} suffix="%" decimals={1} duration={900} />
            </span>
          </div>
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "210ms" }}>
            <span className="mm-fund-key">Names</span>
            <span className="mm-fund-val">
              <CountUp to={names} duration={900} />
            </span>
          </div>
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "280ms" }}>
            <span className="mm-fund-key">Avg Tenor</span>
            <span className="mm-fund-val">
              <CountUp to={avgTenor} suffix="Y" decimals={1} duration={1200} />
            </span>
          </div>
          <div className="mm-fund-stat" style={{ ["--mm-delay" as string]: "350ms" }}>
            <span className="mm-fund-key">Top</span>
            <span className="mm-fund-val">{top.tkr.toUpperCase()}</span>
          </div>
        </div>
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
  onClick,
  external = true,
}: {
  href: string;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  external?: boolean;
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
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="mm-cta"
      data-tick="990"
      data-tick-vol="0.025"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
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

/* ── Trade ticket modal — email CTA confirmation ──────────── */

function TicketRow({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: "BUY" | "MKT" | "ACCENT";
}) {
  return (
    <div className="mm-ticket-row">
      <span className="mm-ticket-key">{k}</span>
      <span className="mm-ticket-val" data-side={accent}>
        {v}
      </span>
    </div>
  );
}

function TradeTicket({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const submitRef = useRef<HTMLAnchorElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = (document.activeElement as HTMLElement) ?? null;
    // Focus submit so Enter immediately fires the mailto.
    window.setTimeout(() => submitRef.current?.focus(), 60);

    // Open ticket → "ka-chunk" haptic + rising BUY fill audio.
    haptic("chunk");
    if (window.__mmAudio) {
      const m = window.__mmAudio;
      m.play(660, 55, 0.06);
      window.setTimeout(() => m.play(990, 70, 0.05), 65);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const handleSubmit = () => {
    // Submit fill → punchy multi-buzz, paired with the 3-tone chord.
    haptic("fill");
    if (window.__mmAudio) {
      const m = window.__mmAudio;
      m.play(660, 50, 0.06);
      window.setTimeout(() => m.play(880, 50, 0.055), 60);
      window.setTimeout(() => m.play(1320, 80, 0.05), 130);
    }
    // Close after the mailto fires so we don't lose focus mid-handoff.
    window.setTimeout(onClose, 80);
  };

  return (
    <div
      className="mm-ticket-overlay"
      data-open={open}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mm-ticket-title"
      aria-hidden={!open}
    >
      <div className="mm-ticket" onClick={(e) => e.stopPropagation()}>
        <div className="mm-ticket-head">
          <span id="mm-ticket-title" className="mm-ticket-title">
            Trade Ticket · MM.NYC
          </span>
          <button
            className="mm-ticket-close"
            type="button"
            aria-label="Close trade ticket"
            onClick={() => {
              haptic("tick");
              onClose();
            }}
          >
            ×
          </button>
        </div>
        <div className="mm-ticket-body">
          <TicketRow k="Side" v="BUY" accent="BUY" />
          <TicketRow k="Ticker" v="MM.NYC.HELLO" />
          <TicketRow k="Order Type" v="MARKET" accent="MKT" />
          <TicketRow k="Quantity" v="1 INTRO" />
          <TicketRow k="Limit Px" v="$0.00" />
          <TicketRow k="TIF" v="GTC" />
          <TicketRow k="Settlement" v="T+1 · NYC ↔ MIA" />
          <TicketRow k="Venue" v="hello@moshemalka.com" />
        </div>
        <div className="mm-ticket-foot">
          <span className="mm-ticket-hint">
            <kbd>Esc</kbd>Cancel
          </span>
          <a
            ref={submitRef}
            className="mm-ticket-submit"
            href="mailto:hello@moshemalka.com?subject=Hello%20%E2%80%94%20MM.NYC&body=%2F%2F%20fill%20at%20will%0A%0A"
            onClick={handleSubmit}
          >
            Submit Fill →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Cmd+K Bloomberg-style command terminal ────────────────── */

type TermCmd = {
  tkr: string;
  desc: string;
  match: string[];
  exec: () => void;
  closeAfter?: boolean;
};

function CmdTerminal({
  open,
  onClose,
  onOpenTicket,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTicket: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmds: TermCmd[] = useMemo(() => {
    const scrollToId = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return [
      {
        tkr: "BOOK",
        desc: "Position book — open + closed positions",
        match: ["book", "positions", "position", "trading", "trad", "jobs", "career"],
        exec: () => scrollToId("position-book"),
      },
      {
        tkr: "STACK",
        desc: "Holdings — fund allocation of the tech stack",
        match: ["stack", "holdings", "tech", "fund", "allocation", "languages"],
        exec: () => scrollToId("holdings"),
      },
      {
        tkr: "ENERGY",
        desc: "Energy — what I'm interested in",
        match: ["energy", "interest", "leverage", "about"],
        exec: () => scrollToId("energy"),
      },
      {
        tkr: "MM.NYC",
        desc: "Hero — top of the page",
        match: ["mm", "top", "home", "hero", "moshe"],
        exec: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
      {
        tkr: "EMAIL",
        desc: "Open trade ticket → hello@moshemalka.com",
        match: ["email", "mail", "contact", "hello", "ticket", "buy", "hire"],
        exec: () => onOpenTicket(),
      },
      {
        tkr: "LI",
        desc: "LinkedIn → linkedin.com/in/moshenyc",
        match: ["li", "linkedin"],
        exec: () =>
          window.open(
            "https://www.linkedin.com/in/moshenyc/",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "GH",
        desc: "GitHub → github.com/moshejs",
        match: ["gh", "github", "code"],
        exec: () =>
          window.open(
            "https://github.com/moshejs",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "SO",
        desc: "Stack Overflow → users/7381252/moshe",
        match: ["so", "stack overflow", "stackoverflow", "answers"],
        exec: () =>
          window.open(
            "https://stackoverflow.com/users/7381252/moshe",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        tkr: "AUDIO",
        desc: "Toggle hover ticks + trade-fill sounds",
        match: ["audio", "sound", "mute", "unmute", "tick"],
        exec: () =>
          document.querySelector<HTMLButtonElement>(".mm-audio")?.click(),
      },
    ];
  }, [onOpenTicket]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cmds;
    return cmds.filter(
      (c) =>
        c.tkr.toLowerCase().includes(q) ||
        c.match.some((m) => m.toLowerCase().includes(q))
    );
  }, [query, cmds]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIdx(0);
    window.setTimeout(() => inputRef.current?.focus(), 60);
    haptic("tap");
    if (window.__mmAudio) {
      // Terminal-on triple click: rising
      const m = window.__mmAudio;
      m.play(880, 30, 0.04);
      window.setTimeout(() => m.play(1320, 30, 0.035), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        haptic("tick");
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => {
          const next = Math.min(i + 1, Math.max(filtered.length - 1, 0));
          if (next !== i) haptic("pulse");
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => {
          const next = Math.max(i - 1, 0);
          if (next !== i) haptic("pulse");
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = filtered[activeIdx];
        if (!c) return;
        haptic("chunk");
        onClose();
        // Defer the action so the overlay tear-down doesn't steal focus
        // from a popup window or the trade-ticket modal that follows.
        window.setTimeout(() => c.exec(), 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIdx, onClose]);

  return (
    <div
      className="mm-term-overlay"
      data-open={open}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command terminal"
      aria-hidden={!open}
    >
      <div className="mm-term" onClick={(e) => e.stopPropagation()}>
        <div className="mm-term-input-row">
          <span className="mm-term-prompt" aria-hidden>
            {"<MM.NYC>"}
          </span>
          <input
            ref={inputRef}
            className="mm-term-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ticker or keyword — book, stack, email, gh"
            autoComplete="off"
            spellCheck={false}
            aria-label="Command query"
          />
          <span className="mm-term-go" aria-hidden>
            <kbd>↵</kbd>GO
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="mm-term-empty">
            No match · try BOOK · STACK · EMAIL · GH
          </div>
        ) : (
          <ul className="mm-term-list" role="listbox">
            {filtered.map((c, i) => (
              <li
                key={c.tkr}
                className="mm-term-item"
                data-active={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => {
                  haptic("chunk");
                  onClose();
                  window.setTimeout(() => c.exec(), 60);
                }}
                role="option"
                aria-selected={i === activeIdx}
              >
                <span className="mm-term-tkr mm-mono">{c.tkr}</span>
                <span className="mm-term-desc">{c.desc}</span>
                <span className="mm-term-cmd mm-mono" aria-hidden>↵</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mm-term-foot">
          <span>
            <kbd>↑↓</kbd>nav
          </span>
          <span>
            <kbd>↵</kbd>execute
          </span>
          <span>
            <kbd>esc</kbd>close
          </span>
        </div>
      </div>
    </div>
  );
}

function CmdHint({ onOpen }: { onOpen: () => void }) {
  // Detect mac so we show ⌘ instead of Ctrl
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);
  return (
    <button
      type="button"
      className="mm-cmdk-hint"
      onClick={() => {
        haptic("tap");
        onOpen();
      }}
      aria-label="Open command terminal"
      data-tick="1100"
      data-tick-vol="0.018"
    >
      <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
      <kbd>K</kbd>
      <span>Terminal</span>
    </button>
  );
}

function FootNow({ onOpenTicket }: { onOpenTicket: () => void }) {
  return (
    <footer className="mm-foot mm-watch mt-16 pt-12 pb-16">
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
          <div className="flex flex-col items-start md:items-end gap-2">
            <MagneticCTA
              href="mailto:hello@moshemalka.com"
              external={false}
              onClick={(e) => {
                e.preventDefault();
                onOpenTicket();
              }}
            >
              <span className="mm-ordtype" data-type="MKT" aria-hidden>MKT</span>
              hello@moshemalka.com
            </MagneticCTA>
            <div className="mm-settle" data-tick="660" data-tick-vol="0.014">
              T+1 · NYC Hours
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a
              className="mm-hover-line"
              data-tick="990"
              href="https://www.linkedin.com/in/moshenyc/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--muted)" }}
            >
              <span className="mm-ordtype" data-type="LMT" aria-hidden>LMT</span>
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
              <span className="mm-ordtype" data-type="GTC" aria-hidden>GTC</span>
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
              <span className="mm-ordtype" data-type="RFQ" aria-hidden>RFQ</span>
              Stack Overflow
            </a>
          </div>
        </div>
      </div>

      <div
        className="mt-12 pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] mm-mono"
        style={{ color: "var(--soft)", borderTop: "1px solid var(--line)" }}
      >
        <span>Moshe Malka · NYC ↔ MIA · 2026</span>
        <span>Full-stack engineer · TypeScript · Next.js · Node</span>
      </div>
    </footer>
  );
}

export default function Home() {
  const [ticketOpen, setTicketOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

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

  // Cmd+K (or Ctrl+K) — Bloomberg-style terminal palette.
  // We catch it globally and ignore when the user is in another input so
  // typing in any future field doesn't hijack their text.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isToggle) return;
      e.preventDefault();
      haptic("tap");
      setTerminalOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      <CityIcons />

      <SessionStatus />
      <StatusPill />
      <AudioToggle />
      <CmdHint onOpen={() => setTerminalOpen(true)} />

      <TradeTicket
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
      />
      <CmdTerminal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onOpenTicket={() => {
          setTerminalOpen(false);
          window.setTimeout(() => setTicketOpen(true), 80);
        }}
      />

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
        <section className="pt-28 md:pt-36 pb-8 md:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-x-10 gap-y-8 items-start">
            <div className="mm-reveal mm-power-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/moshe.jpg"
                alt="Moshe Malka"
                width="300"
                height="400"
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <div className="mm-reveal">
                <SectionMarker>Moshe Malka — Senior Software Engineer</SectionMarker>
              </div>

              <HeroHeading />
            </div>
          </div>

          <MovementTable />

          <HeroStats />
        </section>

        <Divider />

        {/* GRID INTERSECTION */}
        <section className="mm-grid grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-20 text-xl">
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

        {/* Career events feed — sits as a header to the position book
            since the events ARE what populates it. */}
        <ExecutionLog />

        {/* POSITION BOOK */}
        <PositionBook />

        <Divider />

        {/* HOLDINGS — stack as fund allocation */}
        <Holdings />

        <Divider />

        {/* PERSONAL ENERGY */}
        <section id="energy" className="max-w-3xl pb-20 mm-watch">
          <SectionMarker>Energy</SectionMarker>

          <p
            className="mt-8 text-2xl leading-relaxed"
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

        <FootNow onOpenTicket={() => setTicketOpen(true)} />

      </main>
    </div>
  );
}
