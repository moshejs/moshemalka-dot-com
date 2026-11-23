import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { CATALOGUE, PRODUCTS, addressOf, productBySlug, productsInGroup, type Product } from "@/lib/products";
import {
  Arrow,
  AskLine,
  Crumbs,
  Footer,
  PERSON_ID,
  PageHead,
  SITE_NODES,
  SITE_URL,
  TopBar,
  WEBSITE_ID,
  breadcrumbNode,
} from "@/components/products/Chrome";

type Props = { product: Product };

export const getStaticPaths = (async () => ({
  paths: PRODUCTS.map((p) => ({ params: { slug: p.slug } })),
  fallback: false,
})) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const product = productBySlug(String(params?.slug ?? ""));
  if (!product) return { notFound: true };
  // Drop undefined optional fields: props must be JSON-serialisable.
  return { props: { product: JSON.parse(JSON.stringify(product)) as Product } };
}) satisfies GetStaticProps<Props>;

/** schema.org node for the product: only fields that are true and on its own site. */
function productNode(p: Product) {
  return {
    "@type": p.schemaType,
    "@id": p.schemaId ?? `${SITE_URL}/products/${p.slug}#product`,
    name: p.name,
    description: p.summary,
    url: p.url,
    author: { "@id": PERSON_ID },
    ...(p.applicationCategory && { applicationCategory: p.applicationCategory }),
    ...(p.operatingSystem && { operatingSystem: p.operatingSystem }),
    ...(p.caseStudy && { subjectOf: { "@type": "Article", url: p.caseStudy } }),
  };
}

function structuredData(p: Product) {
  const path = `/products/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...SITE_NODES,
      breadcrumbNode(`${SITE_URL}${path}#breadcrumb`, crumbsFor(p)),
      {
        "@type": "ItemPage",
        "@id": `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: p.title,
        description: p.description,
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": `${SITE_URL}${path}#breadcrumb` },
        author: { "@id": PERSON_ID },
        inLanguage: "en",
        mainEntity: productNode(p),
      },
    ],
  };
}

function crumbsFor(p: Product) {
  return [
    { name: "Home", path: "/" },
    { name: "Products", path: CATALOGUE.path },
    { name: p.name, path: `/products/${p.slug}` },
  ];
}

export default function ProductPage({ product: p }: Props) {
  const siblings = productsInGroup(p.group).filter((o) => o.slug !== p.slug);
  const i = PRODUCTS.findIndex((o) => o.slug === p.slug);
  const prev = PRODUCTS[(i - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(i + 1) % PRODUCTS.length];

  return (
    <>
      <PageHead title={p.title} description={p.description} path={`/products/${p.slug}`} structuredData={structuredData(p)} />
      <TopBar />
      <main className="c-page c-prodpage">
        <Crumbs crumbs={crumbsFor(p)} />

        <article className="c-prod" aria-labelledby="product-h">
          <header className="c-prodhead">
            <p className="c-pkg__group">{p.group}</p>
            <h1 id="product-h" className="c-prodhead__h1">
              {p.name}
            </h1>
            <p className="c-tagline">{p.tagline}</p>
            <p className="c-intro">{p.summary}</p>
            <div className="c-ctas">
              <a className="c-btn c-btn--secondary" href={p.url} target="_blank" rel="noopener noreferrer">
                {p.linkLabel}
                <span className="c-sr"> (opens in a new tab)</span>
                {Arrow}
              </a>
            </div>
          </header>

          <dl className="c-panel c-prodfacts">
            <div>
              <dt>Status</dt>
              <dd>{p.status}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="c-prodfacts__url">
                  {addressOf(p.url)}
                  <span className="c-sr"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
            {p.built && (
              <div>
                <dt>How it&rsquo;s built</dt>
                <dd>{p.built}</dd>
              </div>
            )}
            {p.caseStudy && (
              <div>
                <dt>Write-up</dt>
                <dd>
                  <a href={p.caseStudy} target="_blank" rel="noopener noreferrer" className="c-prodfacts__link">
                    The case study on quentin.software
                    <span className="c-sr"> (opens in a new tab)</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <section className="c-panel c-prodask" aria-label="Contact">
            <AskLine about={p.name} />
          </section>
        </article>

        {siblings.length > 0 && (
          <section className="c-prodgroup" aria-labelledby="more-h">
            <h2 id="more-h" className="c-h2 c-prodgroup__h2">
              More in {p.group}
            </h2>
            <ul className="c-pkgs c-pkgs--grid c-prodlist">
              {siblings.map((o) => (
                <li key={o.slug} className="c-pkg c-proditem">
                  <h3 className="c-proditem__name">
                    <Link href={`/products/${o.slug}`}>{o.name}</Link>
                  </h3>
                  <p className="c-pkg__summary">{o.tagline}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="c-prodpager" aria-label="Other products">
          <Link href={`/products/${prev.slug}`} className="c-textlink">
            <span aria-hidden="true">&larr;</span> {prev.name}
          </Link>
          <Link href="/products" className="c-textlink">
            All {PRODUCTS.length} products
          </Link>
          <Link href={`/products/${next.slug}`} className="c-textlink">
            {next.name} <span aria-hidden="true">&rarr;</span>
          </Link>
        </nav>

        <Footer />
      </main>
    </>
  );
}
