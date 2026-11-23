import Link from "next/link";
import { CATALOGUE, GROUPS, PRODUCTS, addressOf, productsInGroup } from "@/lib/products";
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

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Products", path: CATALOGUE.path },
];

const groupId = (g: string) => `group-${g.toLowerCase().replace(/[^a-z]+/g, "-")}`;

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    ...SITE_NODES,
    breadcrumbNode(`${SITE_URL}${CATALOGUE.path}#breadcrumb`, CRUMBS),
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}${CATALOGUE.path}#webpage`,
      url: `${SITE_URL}${CATALOGUE.path}`,
      name: CATALOGUE.title,
      description: CATALOGUE.description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${SITE_URL}${CATALOGUE.path}#breadcrumb` },
      author: { "@id": PERSON_ID },
      inLanguage: "en",
      mainEntity: {
        "@type": "ItemList",
        name: "Products by Moshe Malka",
        numberOfItems: PRODUCTS.length,
        itemListElement: PRODUCTS.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          url: `${SITE_URL}/products/${p.slug}`,
        })),
      },
    },
  ],
};

export default function ProductsPage() {
  return (
    <>
      <PageHead
        title={CATALOGUE.title}
        description={CATALOGUE.description}
        path={CATALOGUE.path}
        structuredData={STRUCTURED_DATA}
      />
      <TopBar />
      <main className="c-page c-prodpage">
        <Crumbs crumbs={CRUMBS} />
        <header className="c-prodhead">
          <h1 className="c-prodhead__h1">Products</h1>
          <p className="c-intro">
            Things I build and run myself, outside client work: language apps, cited medical
            guides, writing tools and a few interactive stories. Each page says what it does, where
            it stands today, and links to the real thing.
          </p>
          <p className="c-secmeta">{PRODUCTS.length} products in {GROUPS.length} groups</p>
        </header>

        {GROUPS.map((g) => (
          <section key={g} className="c-prodgroup" aria-labelledby={groupId(g)}>
            <h2 id={groupId(g)} className="c-h2 c-prodgroup__h2">
              {g}
            </h2>
            <ul className="c-pkgs c-pkgs--grid c-prodlist">
              {productsInGroup(g).map((p) => (
                <li key={p.slug} className="c-pkg c-proditem">
                  <h3 className="c-proditem__name">
                    <Link href={`/products/${p.slug}`}>{p.name}</Link>
                  </h3>
                  <p className="c-pkg__group">{p.tagline}</p>
                  <p className="c-pkg__summary">{p.summary}</p>
                  <p className="c-proditem__status">
                    <span className="c-proditem__label">Status</span> {p.status}
                  </p>
                  <a className="c-textlink c-proditem__out" href={p.url} target="_blank" rel="noopener noreferrer">
                    {addressOf(p.url)}
                    <span className="c-sr"> (opens {p.name} in a new tab)</span>
                    {Arrow}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="c-panel c-prodask" aria-label="Contact">
          <AskLine about="any of these" />
          <p className="c-prodask__note">
            Client builds live on my studio&rsquo;s site:{" "}
            <a href="https://www.quentin.software/work" target="_blank" rel="noopener noreferrer">
              Quentin.Code&rsquo;s work
            </a>
            .
          </p>
        </section>
        <Footer />
      </main>
    </>
  );
}
