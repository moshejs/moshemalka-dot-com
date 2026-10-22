import Head from "next/head";
import Link from "next/link";

/* The 404: one quiet panel, the same product world as the homepage. */
export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page not found · Moshe Malka</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="c-nf">
        <div className="c-panel c-nf__panel">
          <h1 className="c-nf__h1">Page not found</h1>
          <p className="c-nf__text">
            There&rsquo;s nothing at this address. It may have moved, or it never existed.
          </p>
          <Link href="/" className="c-btn c-btn--secondary">
            Back to Moshe Malka&rsquo;s homepage
          </Link>
        </div>
      </main>
    </>
  );
}
