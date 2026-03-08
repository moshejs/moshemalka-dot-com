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
        0% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(0, -18px, 0) scale(1.04); }
        100% { transform: translate3d(0, 0, 0) scale(1); }
      }

      @keyframes floatX {
        0% { transform: translateX(-2%); }
        50% { transform: translateX(2%); }
        100% { transform: translateX(-2%); }
      }

      @keyframes glowPulse {
        0%, 100% { opacity: 0.2; transform: scaleX(0.85); }
        50% { opacity: 0.7; transform: scaleX(1.06); }
      }

      @keyframes heroIn {
        from {
          opacity: 0;
          transform: translateY(22px) scale(0.995);
          filter: blur(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes softSweep {
        0% { transform: translateX(-130%); }
        100% { transform: translateX(220%); }
      }

      @keyframes cardIn {
        from {
          opacity: 0;
          transform: translateY(14px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .mm-reveal {
        opacity: 0;
        animation: heroIn 850ms cubic-bezier(0.18, 0.8, 0.2, 1) forwards;
      }

      .mm-delay-1 { animation-delay: 120ms; }
      .mm-delay-2 { animation-delay: 260ms; }
      .mm-delay-3 { animation-delay: 400ms; }
      .mm-delay-4 { animation-delay: 540ms; }

      .mm-grid {
        position: relative;
      }

      .mm-grid::before {
        content: '';
        position: absolute;
        inset: -4rem -2rem;
        background: radial-gradient(circle at 20% 20%, rgba(77, 163, 255, 0.12), transparent 45%),
                    radial-gradient(circle at 80% 80%, rgba(176, 124, 255, 0.1), transparent 45%);
        filter: blur(24px);
        opacity: 0.55;
        pointer-events: none;
        animation: floatX 12s ease-in-out infinite;
      }

      .mm-card {
        position: relative;
        padding: 1.4rem;
        margin: -1.4rem;
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01));
        transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 260ms ease, box-shadow 320ms ease, background-color 260ms ease;
        overflow: hidden;
        opacity: 0;
        animation: cardIn 760ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      .mm-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at var(--mx, 10%) var(--my, 10%), rgba(255,255,255,0.12), transparent 40%);
        opacity: 0;
        transition: opacity 280ms ease;
        pointer-events: none;
      }

      .mm-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.16) 50%, transparent 62%);
        transform: translateX(-130%);
        pointer-events: none;
      }

      .mm-card:hover {
        transform: translateY(-8px) scale(1.01);
        border-color: rgba(255,255,255,0.2);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
        background-color: rgba(255,255,255,0.02);
      }

      .mm-card:hover::before {
        opacity: 1;
      }

      .mm-card:hover::after {
        animation: softSweep 1s ease;
      }

      .mm-chip {
        display: inline-block;
        transition: transform 260ms ease, text-shadow 260ms ease, letter-spacing 260ms ease;
      }

      .mm-card:hover .mm-chip {
        transform: translateX(6px);
        text-shadow: 0 0 16px rgba(255,255,255,0.25);
        letter-spacing: 0.12em;
      }

      .mm-divider {
        position: relative;
        overflow: hidden;
      }

      .mm-divider::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.42) 50%, transparent 80%);
        opacity: 0.6;
        animation: glowPulse 4.2s ease-in-out infinite;
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
        bottom: -0.22em;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, var(--blue), rgba(0,245,160,0.6), transparent);
        transform: scaleX(0.25);
        opacity: 0;
        transform-origin: left;
        transition: transform 280ms ease, opacity 280ms ease;
      }

      .mm-hover-line:hover {
        color: rgba(255,255,255,0.9);
      }

      .mm-hover-line:hover::after {
        opacity: 1;
        transform: scaleX(1);
      }

      @media (prefers-reduced-motion: reduce) {
        .mm-reveal,
        .mm-grid::before,
        .mm-card,
        .mm-card::before,
        .mm-card::after,
        .mm-chip,
        .mm-divider::after,
        .mm-hover-line,
        .mm-hover-line::after {
          animation: none !important;
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}

function Orb({ color, size, top, left, duration, delay }: { color: string; size: number; top: string; left: string; duration: string; delay: string }) {
  return (
    <div
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
      <Orb color="#00F5A0" size={540} top="3%" left="8%" duration="13s" delay="0s" />
      <Orb color="#4DA3FF" size={620} top="58%" left="58%" duration="16s" delay="1.5s" />
      <Orb color="#B07CFF" size={430} top="28%" left="74%" duration="11s" delay="0.8s" />

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

          <h1 className="mm-title mt-12 text-6xl md:text-8xl font-bold leading-[1.05] mm-reveal mm-delay-1">
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
        <section className="mm-grid grid grid-cols-1 md:grid-cols-2 gap-20 text-xl">

          <div className="mm-card mm-delay-1" style={{ ['--mx' as string]: '16%', ['--my' as string]: '22%' }}>
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--green)" }}>Trading</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Arbitrage systems under 26ms.
              Real-time volatility across 40+ exchanges.
              Infrastructure where milliseconds change outcomes.
            </p>
          </div>

          <div className="mm-card mm-delay-2" style={{ ['--mx' as string]: '74%', ['--my' as string]: '18%' }}>
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--blue)" }}>Institutional Finance</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Portfolio systems at Goldman.
              Interfaces that brokers and high-net-worth clients rely on.
              Precision, governance, responsibility.
            </p>
          </div>

          <div className="mm-card mm-delay-3" style={{ ['--mx' as string]: '32%', ['--my' as string]: '80%' }}>
            <div className="mm-mono text-xs mm-chip" style={{ color: "var(--gold)" }}>Real Estate</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Operational platforms for coworking and physical space.
              Software that touches real-world infrastructure.
            </p>
          </div>

          <div className="mm-card mm-delay-4" style={{ ['--mx' as string]: '84%', ['--my' as string]: '78%' }}>
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
          <div className="mm-mono text-xs mm-reveal" style={{ color: "var(--soft)" }}>Energy</div>

          <p className="mt-10 text-2xl leading-relaxed mm-reveal mm-delay-1" style={{ color: "var(--muted)" }}>
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
