import React from "react";
import Head from 'next/head';
import Script from 'next/script'

/**
 * Moshe Malka — Intersection
 *
 * Not resume.
 * Not corporate.
 * Just signal + energy.
 */

function Theme() {
  return (
    <style jsx global>{`
      :root {
        --bg: #0A0C10;
        --ink: #FFFFFF;
        --muted: rgba(255,255,255,0.65);
        --soft: rgba(255,255,255,0.35);
        --line: rgba(255,255,255,0.06);

        --green: #00F5A0;
        --blue: #4DA3FF;
        --gold: #E6B566;
        --violet: #B07CFF;
      }

      body { background: var(--bg); }

      .mm-sans { font-family: ui-sans-serif, system-ui, -apple-system; }
      .mm-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; text-transform: uppercase; }
      .mm-title { letter-spacing: -0.04em; }

      @keyframes drift {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(0, -14px, 0) scale(1.04); }
      }

      @keyframes orbit {
        0% { transform: translate3d(0, 0, 0) rotate(0deg); }
        25% { transform: translate3d(8px, -10px, 0) rotate(1deg); }
        50% { transform: translate3d(0, -18px, 0) rotate(0deg); }
        75% { transform: translate3d(-10px, -8px, 0) rotate(-1deg); }
        100% { transform: translate3d(0, 0, 0) rotate(0deg); }
      }

      @keyframes glowPulse {
        0%, 100% { opacity: 0.24; transform: scaleX(1); }
        50% { opacity: 0.8; transform: scaleX(1.03); }
      }

      @keyframes heroIn {
        from {
          opacity: 0;
          transform: translateY(18px);
          filter: blur(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      @keyframes titleSheen {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      @keyframes softSweep {
        0% { transform: translateX(-130%); }
        100% { transform: translateX(230%); }
      }

      @keyframes cardFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }

      .mm-reveal {
        opacity: 0;
        animation: heroIn 820ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      .mm-delay-1 { animation-delay: 120ms; }
      .mm-delay-2 { animation-delay: 240ms; }
      .mm-delay-3 { animation-delay: 360ms; }

      .mm-hero-title {
        background: linear-gradient(92deg, #ffffff 0%, #eaf4ff 35%, #ffffff 65%, #d6e8ff 100%);
        background-size: 230% 230%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: titleSheen 8s ease-in-out infinite;
      }

      .mm-card {
        position: relative;
        padding: 1.35rem;
        margin: -1.35rem;
        border: 1px solid transparent;
        border-radius: 16px;
        background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
        transition: transform 280ms ease, border-color 280ms ease, background-color 280ms ease, box-shadow 280ms ease;
        overflow: hidden;
        animation: cardFloat 6s ease-in-out infinite;
        will-change: transform;
      }

      .mm-card:nth-child(2) { animation-delay: 400ms; }
      .mm-card:nth-child(3) { animation-delay: 900ms; }
      .mm-card:nth-child(4) { animation-delay: 1400ms; }

      .mm-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255,255,255,0.07);
        opacity: 0;
        transition: opacity 280ms ease;
      }

      .mm-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
        transform: translateX(-130%);
        pointer-events: none;
      }

      .mm-card:hover {
        transform: translateY(-8px) scale(1.01);
        border-color: rgba(255,255,255,0.18);
        background-color: rgba(255,255,255,0.03);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      }

      .mm-card:hover::before { opacity: 1; }

      .mm-card:hover::after {
        animation: softSweep 900ms ease;
      }

      .mm-chip {
        display: inline-block;
        transition: transform 280ms ease, text-shadow 280ms ease, letter-spacing 280ms ease;
      }

      .mm-card:hover .mm-chip {
        transform: translateX(6px);
        letter-spacing: 0.11em;
        text-shadow: 0 0 20px rgba(255,255,255,0.24);
      }

      .mm-divider {
        position: relative;
        overflow: hidden;
      }

      .mm-divider::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
        animation: glowPulse 4.6s ease-in-out infinite;
        transform-origin: center;
      }

      .mm-hover-line {
        position: relative;
        display: inline-block;
        transition: color 220ms ease;
      }

      .mm-hover-line::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -0.2em;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, var(--blue), transparent);
        transform: scaleX(0.2);
        opacity: 0;
        transform-origin: left;
        transition: transform 300ms ease, opacity 300ms ease;
      }

      .mm-hover-line:hover {
        color: rgba(255,255,255,0.88);
      }

      .mm-hover-line:hover::after {
        opacity: 1;
        transform: scaleX(1);
      }

      @media (prefers-reduced-motion: reduce) {
        .mm-reveal,
        .mm-hero-title,
        .mm-card,
        .mm-card::after,
        .mm-chip,
        .mm-divider::after,
        .mm-hover-line::after,
        .mm-orb {
          animation: none !important;
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}

function Orb({ color, size, top, left, duration, delay }: { color: string; size: number; top: string; left: string; duration: number; delay?: string }) {
  return (
    <div
      className="mm-orb"
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
        filter: "blur(80px)",
        animation: `drift ${duration}s ease-in-out infinite, orbit ${duration * 1.3}s ease-in-out infinite`,
        animationDelay: delay,
        pointerEvents: "none",
      }}
    />
  );
}

function Divider() {
  return <div className="mm-divider h-px w-full my-28" style={{ background: "var(--line)" }} />;
}

export default function Home() {
  return (
    <div className="mm-sans min-h-screen text-white relative overflow-hidden">
      <Theme />

      {/* Motion background */}
      <Orb color="#00F5A0" size={500} top="5%" left="10%" duration={14} />
      <Orb color="#4DA3FF" size={600} top="60%" left="60%" duration={18} delay="-3s" />
      <Orb color="#B07CFF" size={400} top="30%" left="75%" duration={16} delay="-6s" />

      <div className='container'>
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
        <section className="pt-40 pb-40">
          <div className="mm-mono text-sm mm-reveal" style={{ color: "var(--soft)" }}>
            Moshe Malka
          </div>

          <h1 className="mm-title mm-hero-title mt-12 text-6xl md:text-8xl font-bold leading-[1.05] mm-reveal mm-delay-1">
            I like building
            <br />
            things that move.
          </h1>

          <p className="mt-16 text-2xl max-w-3xl mm-reveal mm-delay-2" style={{ color: "var(--muted)" }}>
            Capital moving across exchanges.
            <br />
            Data moving through pipelines.
            <br />
            Interfaces moving portfolios.
            <br />
            People moving across cities.
          </p>
        </section>

        <Divider />

        {/* GRID INTERSECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 text-xl">

          <div className="mm-card mm-reveal mm-delay-1">
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--green)" }}>Trading</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Arbitrage systems under 26ms.
              Real-time volatility across 40+ exchanges.
              Infrastructure where milliseconds change outcomes.
            </p>
          </div>

          <div className="mm-card mm-reveal mm-delay-2">
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--blue)" }}>Institutional Finance</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Portfolio systems at Goldman.
              Interfaces that brokers and high-net-worth clients rely on.
              Precision, governance, responsibility.
            </p>
          </div>

          <div className="mm-card mm-reveal mm-delay-3">
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--gold)" }}>Real Estate</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Operational platforms for coworking and physical space.
              Software that touches real-world infrastructure.
            </p>
          </div>

          <div className="mm-card mm-reveal mm-delay-3">
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--violet)" }}>Modern Web & AI</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              NextJS, React, LangChain, GPT-4.
              Tools that compress iteration cycles.
              Product built fast, but built right.
            </p>
          </div>

        </section>

        <Divider />

        {/* PERSONAL ENERGY */}
        <section className="max-w-3xl pb-40">
          <div className="mm-mono text-xs" style={{ color: "var(--soft)" }}>Energy</div>

          <p className="mt-10 text-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
            I’m interested in leverage.
            <br /><br />
            <span className="mm-hover-line">Code that moves capital.</span>
            <br />
            <span className="mm-hover-line">Systems that scale without drama.</span>
            <br />
            <span className="mm-hover-line">Architecture that survives constraints.</span>
            <br /><br />
            And environments that expand perspective.
          </p>
        </section>

      </main>
    </div>
  );
}
