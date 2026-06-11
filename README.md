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

A 3D room — bookshelves, desk, lamp, leather chair — that displays the books I’ve read.
Click a spine to pull the book out and read its details (notes, rating, dates, subjects).
Books and shelves live in Postgres; metadata is pulled from Open Library (with Google
Books as a fallback) when you paste an ISBN at `/study/admin`.

#### One-time setup

1. **Create a Neon Postgres database**. Either:
   - In the Vercel dashboard: *Storage → Create Database → Neon* (auto-injects `DATABASE_URL`), or
   - Sign up at [neon.tech](https://neon.tech) and copy the pooled connection string.

2. **Set environment variables** locally (`.env.local`) and on Vercel (Project → Settings → Environment Variables). See `.env.example`:
   - `DATABASE_URL` — Neon connection string
   - `SESSION_SECRET` — 32+ random chars (`openssl rand -base64 48`)
   - `STUDY_PASSWORD` — the passphrase you’ll type at `/study/admin`

3. **Push the schema**:
   ```bash
   yarn db:push
   ```
   (Use `yarn db:generate` + `yarn db:push` if you prefer migration files.)

#### Adding books

Visit `/study/admin`, unlock with `STUDY_PASSWORD`, then:
- **By ISBN**: paste any ISBN-10 or ISBN-13 → preview → *shelve*.
- **By title**: type title (and optional author) for older books without ISBNs.
- **Manual**: enter title/author/year by hand for one-off entries.

Each book’s spine color is derived from a deterministic palette so the room
stays visually consistent. You can override it per-book in the admin row.

Create shelves (e.g. *Philosophy*, *Fiction*, *Reference*) and assign books to them;
each shelf becomes a horizontal row in the 3D bookcase, sorted by `slotIndex`.
