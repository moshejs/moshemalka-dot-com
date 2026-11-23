/**
 * The product catalogue (/products and /products/<slug>): every product here
 * is one I built and run myself, is listed on https://www.quentin.software/work,
 * and answered 200 at its URL when this list was written (2026-11-23).
 *
 * This file is the one place to edit catalogue copy. Rules for every entry,
 * checked by lib/products.test.ts:
 * - `summary` says what it does and who it's for, in the product's own terms.
 * - `status` is the product's state in plain words, as its own site says it
 *   today (`statusSource` is where that was read). No prices: link instead.
 * - `built` only repeats what quentin.software/work or this site already say.
 * - No user counts, revenue, testimonials or claims the product doesn't make.
 *
 * Plain TypeScript with no imports and type-only syntax, so
 * scripts/sitemap.mjs can import it with Node's built-in type stripping.
 */

export type ProductGroup = "Languages" | "Health" | "Writing and reading" | "Stories and art";

export type Product = {
  /** URL segment: /products/<slug>. Lowercase letters, digits and hyphens. */
  slug: string;
  name: string;
  group: ProductGroup;
  /** One line under the name. */
  tagline: string;
  /** One or two sentences: what it does and who it's for. */
  summary: string;
  /** Plain-words status, as the product's own site states it. */
  status: string;
  /** The page the status was read from. */
  statusSource: string;
  /** The live product. */
  url: string;
  /** Text for the button to the live product. */
  linkLabel: string;
  /** One true line on how it was built, from what's already public. */
  built?: string;
  /** The studio's public write-up, if there is one. */
  caseStudy?: string;
  /** <title>, at most 60 characters. */
  title: string;
  /** Meta description, at most 155 characters. */
  description: string;
  /** schema.org type for the page's JSON-LD. */
  schemaType: "WebApplication" | "SoftwareApplication" | "CreativeWork";
  /** schema.org applicationCategory (applications only). */
  applicationCategory?: string;
  /** schema.org operatingSystem (applications only). */
  operatingSystem?: string;
  /** A stable @id when another page on this site already names the product. */
  schemaId?: string;
};

export const GROUPS: readonly ProductGroup[] = ["Languages", "Health", "Writing and reading", "Stories and art"];

export const PRODUCTS: readonly Product[] = [
  {
    slug: "hebrabic",
    name: "Hebrabic",
    group: "Languages",
    tagline: "Arabic and Hebrew, taught from either side",
    summary:
      "Arabic for Hebrew speakers and, mirrored, Hebrew for Arabic speakers. Words are taught through their relatives on the other side: the shared alphabet, regular sound correspondences and root families, with false friends marked.",
    status:
      "Live. The alphabet, reading, grammar, vocabulary and roots are free with no account; a paid Pro plan opens every deck and dialogue.",
    statusSource: "https://hebrabic.com/pricing",
    url: "https://hebrabic.com/",
    linkLabel: "Open Hebrabic",
    built: "Next.js 16, Postgres with Drizzle, Better Auth and the Web Speech API, from one typed dataset that serves both directions.",
    caseStudy: "https://www.quentin.software/blog/hebrabic",
    title: "Hebrabic: Arabic and Hebrew from either side · Moshe Malka",
    description:
      "Hebrabic, by Moshe Malka: Arabic for Hebrew speakers and Hebrew for Arabic speakers, taught through shared roots, sound correspondences and cognates.",
    schemaType: "WebApplication",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "cognata",
    name: "Cognata",
    group: "Languages",
    tagline: "Six Latin daughters and English, through each other",
    summary:
      "Spanish, French, Italian, Portuguese, Romanian, Catalan and English, each learned through the one you already speak: which words are cognates, which are false friends, and the sound laws that predict the rest.",
    status: "Live and free for everyone for now. Paid plans aren't open yet.",
    statusSource: "https://www.cognata.app/pricing",
    url: "https://www.cognata.app/",
    linkLabel: "Open Cognata",
    built: "Next.js 16, Postgres with Drizzle, FSRS spaced repetition and the Claude API.",
    caseStudy: "https://www.quentin.software/blog/cognata",
    title: "Cognata: Romance languages through cognates · Moshe Malka",
    description:
      "Cognata, by Moshe Malka: learn Spanish, French, Italian, Portuguese, Romanian or Catalan through the language you already speak, cognate by cognate.",
    schemaType: "WebApplication",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "ojala",
    name: "Ojalá",
    group: "Languages",
    tagline: "The Arabic hiding inside Spanish",
    summary:
      "Aceite, azúcar, ojalá: Arabic taught to Spanish speakers through the Spanish words that came from al-Andalus, and Spanish taught back to Arabic speakers through the same words. Each word shows its Arabic source, its root, and how sure the etymology is.",
    status: "Live.",
    statusSource: "https://www.ojala.uno/",
    url: "https://www.ojala.uno/",
    linkLabel: "Open Ojalá",
    built: "Next.js 16 and TypeScript, tested with Vitest, with pronunciation from the Web Speech API.",
    caseStudy: "https://www.quentin.software/blog/ojala",
    title: "Ojalá: learn Arabic through Spanish · Moshe Malka",
    description:
      "Ojalá, by Moshe Malka: Arabic through the Spanish words that came from al-Andalus, each with its Arabic source, its root and how sure the etymology is.",
    schemaType: "WebApplication",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "lexodus",
    name: "Lexodus",
    group: "Languages",
    tagline: "An animated atlas of where words wandered",
    summary:
      "Search a word and watch it travel the map one hop at a time, like sugar from Sanskrit through Persian and Arabic into English. Every hop is graded by how sure scholars are, and popular-but-wrong origin stories are labelled as myths.",
    status: "Live and free to explore. Paid plans are coming soon; nothing can be bought yet.",
    statusSource: "https://lexodus.quentin.software/pricing",
    url: "https://lexodus.quentin.software/",
    linkLabel: "Open Lexodus",
    built: "Next.js 16, d3-geo and Natural Earth map data, tested with Vitest.",
    caseStudy: "https://www.quentin.software/blog/lexodus",
    title: "Lexodus: an atlas of where words wandered · Moshe Malka",
    description:
      "Lexodus, by Moshe Malka: an animated atlas that traces each word's journey hop by hop across the map, with an honest grade on every link.",
    schemaType: "WebApplication",
    applicationCategory: "ReferenceApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "medical-companions",
    name: "Medical Companions",
    group: "Health",
    tagline: "Animated, cited guides to how diseases work",
    summary:
      "Free guides for health-science students, for people living with a disease, and for the families who care for them. Each one shows how a disease works in animations you can scrub, and every claim links to its source.",
    status: "Live and free. Educational summaries of published research, not medical advice.",
    statusSource: "https://www.medcompanions.org/",
    url: "https://www.medcompanions.org/",
    linkLabel: "Open the guides",
    built: "Hand-written HTML, SVG and vanilla JavaScript with a Python build, served from GitHub Pages.",
    caseStudy: "https://www.quentin.software/blog/medical-companions",
    title: "Medical Companions: animated, cited guides · Moshe Malka",
    description:
      "Medical Companions, by Moshe Malka: free guides that show how diseases work in animations you can scrub, with every claim linked to its source.",
    schemaType: "WebApplication",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "retake",
    name: "Retake",
    group: "Writing and reading",
    tagline: "Tracked changes for one hard reply",
    summary:
      "A workbench for getting one hard text message right. Every take lands as a tracked change on a branching history, so you can compare any two drafts and go back to any of them; nothing is ever sent for you.",
    status:
      "Live as a demo with made-up examples and no AI. It runs and saves in your browser; add your own API key to turn the rewriting on.",
    statusSource: "https://retake.quentin.software/",
    url: "https://retake.quentin.software/",
    linkLabel: "Open Retake",
    built: "Vanilla JavaScript and Node, with the Claude API for rewriting, tested with Playwright and axe.",
    caseStudy: "https://www.quentin.software/blog/retake",
    title: "Retake: get one hard text message right · Moshe Malka",
    description:
      "Retake, by Moshe Malka: a workbench for one hard reply, where every draft is a tracked change on a branching history and nothing is sent for you.",
    schemaType: "WebApplication",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web browser",
  },
  {
    slug: "told-in-passing",
    name: "Told in Passing",
    group: "Writing and reading",
    tagline: "Two short stories, each in a reader built around it",
    summary:
      "Avoidant Book is a therapeutic chapter on the avoidant pattern, told in stories; Fake Love puts the transactional analysis under each moment one tap away. For readers who want a story that slips past the guard.",
    status: "Live. No account, nothing to sign up for.",
    statusSource: "https://told-in-passing.quentin.software/",
    url: "https://told-in-passing.quentin.software/",
    linkLabel: "Start reading",
    built: "Once two apps, now one shelf: the stories are data, read in one shared reader.",
    caseStudy: "https://www.quentin.software/blog/told-in-passing",
    title: "Told in Passing: two short stories · Moshe Malka",
    description:
      "Told in Passing, by Moshe Malka: two short stories, each in a quiet reader built around it, one with tappable notes under every moment.",
    schemaType: "CreativeWork",
  },
  {
    slug: "bookstore",
    name: "Bookstore",
    group: "Writing and reading",
    tagline: "An Anki add-on where your reviews build a bookshop",
    summary:
      "An add-on for the Anki flashcard app. Every card you review earns coins for shelves, furniture and decor, customers walk in asking for a genre, and a one-shelf nook grows into a grand bookhouse.",
    status: "Free download. Needs Anki 2.1.50 or newer, on Windows, Mac or Linux.",
    statusSource: "https://www.quentin.software/blog/anki-bookstore",
    url: "https://www.quentin.software/blog/anki-bookstore",
    linkLabel: "Get the add-on",
    title: "Bookstore: an Anki add-on that builds a shop · Moshe Malka",
    description:
      "Bookstore, by Moshe Malka: a free Anki add-on where every flashcard you review earns coins to stock shelves and grow a one-shelf nook into a bookhouse.",
    schemaType: "SoftwareApplication",
    applicationCategory: "GameApplication",
    operatingSystem: "Windows, macOS, Linux (Anki 2.1.50 or newer)",
  },
  {
    slug: "shevirah",
    name: "Shevirah",
    group: "Stories and art",
    tagline: "Kabbalistic inquiries, animated",
    summary:
      "An interactive web series on Kabbalah: works that turn a count into a field of lights, from the 288 sparks to the 613 commandments, and twenty-two classic texts from Sefer Yetzirah to Baal HaSulam, read teaching by teaching.",
    status: "Live.",
    statusSource: "https://kelipot.quentin.software/",
    url: "https://kelipot.quentin.software/",
    linkLabel: "Visit Shevirah",
    built: "Next.js 16 and React 19 on Vercel, with hand-written CSS, inline SVG and canvas, and no UI library.",
    caseStudy: "https://www.quentin.software/blog/shevirah",
    title: "Shevirah: kabbalistic inquiries, animated · Moshe Malka",
    description:
      "Shevirah, by Moshe Malka: an interactive web series on Kabbalah, with works drawn as fields of light and classic texts read teaching by teaching.",
    schemaType: "CreativeWork",
    schemaId: "https://kelipot.quentin.software/#work",
  },
  {
    slug: "two-libertines",
    name: "Two Libertines",
    group: "Stories and art",
    tagline: "Casanova and Don Juan, behind a two-door foyer",
    summary:
      "Two sites that play their man instead of describing him. Casanova runs on your attention: a dark room lit by your cursor, and a voice that reads your tempo. Don Juan runs on a clock that ignores you, and files you as an entry in his catalogue.",
    status: "Live.",
    statusSource: "https://casanova.quentin.software/",
    url: "https://casanova.quentin.software/",
    linkLabel: "Choose a door",
    caseStudy: "https://www.quentin.software/blog/casanova-don-juan",
    title: "Two Libertines: Casanova and Don Juan · Moshe Malka",
    description:
      "Two Libertines, by Moshe Malka: Casanova and Don Juan as two sites that play their man, one lit by your attention and one that ignores you.",
    schemaType: "CreativeWork",
  },
  {
    slug: "under-the-sycamore",
    name: "Under the Sycamore",
    group: "Stories and art",
    tagline: "A journey after The Alchemist, in your browser",
    summary:
      "A third-person journey after the novel by Paulo Coelho: walk a shepherd who dreamt of treasure out of the hills of Andalusia, through a day that turns from dawn to night. The text, art and code are original.",
    status:
      "Free to play in your browser (it needs WebGL 2; best on a laptop or desktop). Andalusia is walkable today, and the rest of the road is being built.",
    statusSource: "https://under-the-sycamore.quentin.software/site/",
    url: "https://under-the-sycamore.quentin.software/",
    linkLabel: "Play in your browser",
    caseStudy: "https://www.quentin.software/blog/under-the-sycamore",
    title: "Under the Sycamore: after The Alchemist · Moshe Malka",
    description:
      "Under the Sycamore, by Moshe Malka: a free third-person journey in the browser, after The Alchemist, with original text, art and code.",
    schemaType: "CreativeWork",
  },
  {
    slug: "one-hundred-lines",
    name: "One Hundred Lines",
    group: "Stories and art",
    tagline: "A hundred one-line drawings, judged by a panel of agents",
    summary:
      "Five artist agents drew a hundred minimal line drawings over eleven rounds, and a curator, a draughtsman and a graphic designer scored every one. Flip any drawing through its versions with each judge's score and note.",
    status: "Live.",
    statusSource: "https://moshejs.github.io/one-hundred-lines/",
    url: "https://moshejs.github.io/one-hundred-lines/",
    linkLabel: "See the drawings",
    title: "One Hundred Lines: drawings judged by agents · Moshe Malka",
    description:
      "One Hundred Lines, by Moshe Malka: a hundred one-line drawings revised over eleven rounds by artist agents and scored by a panel of three judges.",
    schemaType: "CreativeWork",
  },
];

export const CATALOGUE = {
  path: "/products",
  title: "Products by Moshe Malka",
  description:
    "The products Moshe Malka builds and runs himself: language apps, cited medical guides, writing tools and interactive stories, each with a link to try it.",
} as const;

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function productsInGroup(group: ProductGroup): Product[] {
  return PRODUCTS.filter((p) => p.group === group);
}

/** The host plus any path, for showing where a link goes. */
export function addressOf(url: string): string {
  const u = new URL(url);
  return u.host.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
}
