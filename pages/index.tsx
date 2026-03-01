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
    <style>{`
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
        0% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
        100% { transform: translateY(0px); }
      }
    `}</style>
  );
}

function Orb({ color, size, top, left }: { color: string; size: number; top: string; left: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
        filter: "blur(80px)",
        animation: "drift 14s ease-in-out infinite",
        pointerEvents: "none",
      }}
    />
  );
}

function Divider() {
  return <div className="h-px w-full my-28" style={{ background: "var(--line)" }} />;
}

export default function Home() {
  return (
    <div className="mm-sans min-h-screen text-white relative overflow-hidden">
      <Theme />

      {/* Motion background */}
      <Orb color="#00F5A0" size={500} top="5%" left="10%" />
      <Orb color="#4DA3FF" size={600} top="60%" left="60%" />
      <Orb color="#B07CFF" size={400} top="30%" left="75%" />

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
          <div className="mm-mono text-sm" style={{ color: "var(--soft)" }}>
            Moshe Malka
          </div>

          <h1 className="mm-title mt-12 text-6xl md:text-8xl font-bold leading-[1.05]">
            I like building
            <br />
            things that move.
          </h1>

          <p className="mt-16 text-2xl max-w-3xl" style={{ color: "var(--muted)" }}>
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

          <div>
            <div className="mm-mono text-xs" style={{ color: "var(--green)" }}>Trading</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Arbitrage systems under 26ms.
              Real-time volatility across 40+ exchanges.
              Infrastructure where milliseconds change outcomes.
            </p>
          </div>

          <div>
            <div className="mm-mono text-xs" style={{ color: "var(--blue)" }}>Institutional Finance</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Portfolio systems at Goldman.
              Interfaces that brokers and high-net-worth clients rely on.
              Precision, governance, responsibility.
            </p>
          </div>

          <div>
            <div className="mm-mono text-xs" style={{ color: "var(--gold)" }}>Real Estate</div>
            <p className="mt-6" style={{ color: "var(--muted)" }}>
              Operational platforms for coworking and physical space.
              Software that touches real-world infrastructure.
            </p>
          </div>

          <div>
            <div className="mm-mono text-xs" style={{ color: "var(--violet)" }}>Modern Web & AI</div>
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
            Code that moves capital.
            <br />
            Systems that scale without drama.
            <br />
            Architecture that survives constraints.
            <br /><br />
            And environments that expand perspective.
          </p>
        </section>

      </main>
    </div>
  );
}
