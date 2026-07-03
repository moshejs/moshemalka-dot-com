import Head from "next/head";
import Link from "next/link";

/* On-brand 404 — a position that doesn't exist in the book. Self-contained
   (no external images, no theme dependency) so it stays tiny. */
export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 — position not found · Moshe Malka</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style>{`
        .nf-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060912;
          color: #ffffff;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 24px;
        }
        .nf-card {
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 32px 36px;
          max-width: 460px;
          width: 100%;
        }
        .nf-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 6px 0;
          font-size: 13px;
          letter-spacing: 0.08em;
        }
        .nf-key { color: rgba(255, 255, 255, 0.36); text-transform: uppercase; }
        .nf-val { color: rgba(255, 255, 255, 0.85); text-align: right; }
        .nf-flat { color: #ffa42e; }
        .nf-home {
          display: inline-block;
          margin-top: 24px;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: #5dbb9a;
          text-decoration: none;
          border-bottom: 1px solid rgba(93, 187, 154, 0.4);
          padding-bottom: 2px;
        }
        .nf-home:hover { border-bottom-color: #5dbb9a; }
      `}</style>
      <main className="nf-root">
        <div className="nf-card">
          <div className="nf-row">
            <span className="nf-key">Status</span>
            <span className="nf-val">404</span>
          </div>
          <div className="nf-row">
            <span className="nf-key">Position</span>
            <span className="nf-val">not found</span>
          </div>
          <div className="nf-row">
            <span className="nf-key">Mark</span>
            <span className="nf-val nf-flat">FLAT</span>
          </div>
          <div className="nf-row">
            <span className="nf-key">Action</span>
            <span className="nf-val">roll to home</span>
          </div>
          <Link href="/" className="nf-home">
            ← MM.NYC · back to the book
          </Link>
        </div>
      </main>
    </>
  );
}
