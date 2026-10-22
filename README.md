## Moshe Malka's Portfolio

Welcome to Moshe Malka's personal portfolio, a showcase of his work, experience, and skills. This Next.js project is written in TypeScript and demonstrates Moshe's expertise as a Senior Software Engineer.

### Overview

- **Age Calculator**: Moshe's age is dynamically calculated based on his birth year.
- **Company Cycle**: A rotating display of companies Moshe has worked for in the past.
- **Split Testing**: A simple implementation of A/B testing to show different career blocks.
- **Social Media Links**: Direct links to Moshe's LinkedIn, Stack Overflow, and GitHub profiles.
- **Founder and CEO**: Moshe introduces his venture, Quentin Code, a firm dedicated to helping non-tech business owners scale their businesses with custom software solutions.

### Installation and Development

1. Clone the repository:
```bash
git clone https://github.com/moshejs/moshemalka-dot-com
```

2. Navigate to the project directory and install the dependencies:
```bash
cd moshemalka-dot-com
npm install
```

3. Run the development server:
```bash
npm run dev
```
You can now access the website at [http://localhost:3000](http://localhost:3000).

### Technologies Used

- **Next.js**: A React framework for server-rendered applications.
- **TypeScript**: A typed superset of JavaScript that adds static types.
- **React**: A JavaScript library for building user interfaces.

### Main Components

- **Home**: The main landing page of the portfolio.
- **CompanyCycle**: Displays a rotating list of companies I have worked with.
- **SplitTest**: An A/B testing component to showcase different elements.
- **CareerBlockA and CareerBlockB**: Two variations of Moshe's career journey.

### Dependencies

This project uses a variety of libraries and tools listed in the `package.json`. Notable ones include:

- `next`: The core framework.
- `react` and `react-dom`: Essential for building and rendering React components.
- `@types/*`: Type definitions for TypeScript.
- `eslint` and `eslint-config-next`: Linting tools for cleaner code.

### Contributions

Feel free to fork the project, submit issues, or send pull requests. Feedback and contributions are always welcome!

### Deployment

You can deploy this Next.js project using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js. Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### The Study (`/study`)

A lamplit 3D study — walnut bookcases, a dusk window, banker's lamp, Chesterfield — that
shelves the books I've read. Take a book down and it turns in your hands to show its
cover, with a library catalog card (and an Amazon link) beside it. `←`/`→` browse
neighbouring books; `esc` puts it back.

There's no database: the whole library is one file, **`data/library.json`**, read at
build time (`getStaticProps`), so the page stays fully static.

#### Filling the shelves from Amazon

Order history goes into `data/private/` (always gitignored — the repo is public):

```bash
yarn study:amazon enrich   # amazon-orders.json → amazon-library.json (catalog data + spine colors)
yarn study:amazon apply    # merge the books you kept into data/library.json
```

`enrich` looks each ISBN up in Open Library (Google Books fallback) and samples each
cover's dominant color for the spine. Before `apply`, set `"include": false` in
`data/private/amazon-library.json` on anything you bought but didn't read. `apply` adds
new books, removes excluded ones, and never overwrites a book already in the library —
so edit `data/library.json` freely (`rating`, `notes`, `status`, `dateFinished`, `shelf`).

Shelves are optional: add `{ "id": "philosophy", "label": "Philosophy" }` to `shelves`
and set `"shelf": "philosophy"` on books; each named shelf starts a fresh bay.

#### Publishing

`data/library.json` is the published shelf — commit it and the site rebuilds with it
(without the file, the page falls back to a sample shelf). Raw order data in
`data/private/` is gitignored and never published; `apply` strips purchase dates.

Amazon links use the Associates tag in `lib/amazon.ts` (`NEXT_PUBLIC_AMAZON_TAG` overrides it).

`node scripts/study-shot.mjs <prefix>` renders the room headlessly (desktop + phone),
takes a book down, and screenshots each step — useful since WebGL needs a real GPU path.
