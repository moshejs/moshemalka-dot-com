# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all confirmed as primary; a visit is a win for any of them:

- **Hiring and leadership evaluators.** Recruiters, VPs, and CTOs sizing Moshe up for engineering-leader roles. Success: they reach out by LinkedIn or email.
- **Prospective Quentin Code clients.** Non-technical business owners who might hire his studio for custom software. Success: they click through to quentin.software.
- **Peers and search engines.** Engineers, people who use his npm packages, and Google. Here the site is the canonical "Moshe Malka" entity page that separates him from people with the same name.

## Product Purpose

moshemalka.com is Moshe Malka's personal site: one page that says who he is, what he has built, and how to reach him. It also anchors the "Moshe Malka" search entity. Success means a visitor quickly understands he is a New York City engineering leader writing software since 2008, can trust that, and can act on it: contact him, hire the studio, or follow a profile.

## Positioning

**Engineering Leader**: leads and mentors teams, ships products with AI, writing software since 2008, based in New York City. He moved away from "Senior Software Engineer" on purpose. Site copy, meta tags, and structured data must all say the same thing and match his LinkedIn bio.

What sets him apart: deep fintech and trading-systems experience combined with consumer-product and studio work. A namesake can't truthfully claim that track record.

## Operating Context

- People mostly arrive from a Google search for "Moshe Malka", a LinkedIn profile click, or links on GitHub, Stack Overflow, npm package READMEs, and quentin.software.
- The search results compete with other people of the same name: a prominent rabbi, real-estate agents in Miami and Brooklyn, an Israeli painter, and a staff software engineer in Israel. The site has to make it clear right away which Moshe Malka this is.
- Contact is by email (hello@moshemalka.com) and LinkedIn (linkedin.com/in/moshenyc).

## Capabilities and Constraints

- **Stack (existing):** Next.js 13 (pages router), React 18, TypeScript, Tailwind 3, plus hand-written theme CSS in `styles/theme.css`. Portfolio data and pure utilities live in `lib/portfolio.ts`, which stays framework-free and is unit-tested with Jest.
- **Single page** (`pages/index.tsx`) plus a 404 page. It currently includes a career session counter, an execution-log tape, expandable position book tear sheets, a trade ticket, and a ⌘K command terminal.
- **SEO entity signals are load-bearing.** The Person/WebSite/ProfilePage JSON-LD `@graph`, canonical URL, OG/Twitter tags, robots.txt, and sitemap.xml must survive every change. `sameAs` lists only his real profiles: linkedin.com/in/moshenyc, github.com/moshejs, stackoverflow.com/users/7381252/moshe, instagram.com/justmoshemalka. Never add namesakes' accounts (for example IG @moshemmalka or github.com/Moshe-Malka).
- **Location is New York City only.** There is no Miami presence. The current "NYC ↔ MIA" / "dual desk" copy is wrong and must go (owner-confirmed 2026-10-05).
- **Career dates:** career start is 2008 (`CAREER_EPOCH` = 2008-06-01). Experience figures everywhere must agree with "since 2008".
- **Employer names are allowed on this site.** The owner confirmed on 2026-10-05 that naming past and present employers is fine here. The no-employer-names rule applies to side projects and other public content (npm packages, quentin.software, client sites), not to moshemalka.com.
- **Open:** quentin.software is a primary audience goal, but the current page has no link to it. How the site sends visitors there is undecided.

## Brand Commitments

- **Name and title:** "Moshe Malka — Engineering Leader", New York City.
- **Restraint:** after the July 2026 simplification, the owner's standing direction is one confident idea over gimmicks. Don't bring back ambient animation layers, audio or haptics, or decorative chrome.
- **The trading-desk metaphor is not binding.** Positions, tape, tear sheets, the ⌘K terminal, and the Milgauss palette are the current execution only. A future redesign may replace them.

## Evidence on Hand

- Headshot: `public/moshe.jpg`. OG image: `public/og-image.jpg`. Favicon and apple-touch icon are in `public/`.
- Career record with dated roles and shipped work: `EXEC_LOG` and `POSITIONS` in `lib/portfolio.ts`.
- Public work: a family of npm packages published under github.com/moshejs, covering fixed-income math, Treasury and NY Fed data clients, and gematria. Also a Stack Overflow profile (about 2.7k reputation) and the Quentin Code studio with its client sites.
- **Absent, so never fabricate:** testimonials, client quotes, press coverage, speaking credits, metrics not already in the career record.

## Product Principles

1. **Unmistakably this Moshe Malka.** Every surface should help both people and search engines tell him apart from his namesakes.
2. **One confident idea.** Restraint beats spectacle. Cut anything that doesn't do work.
3. **Leader, not just builder.** Show leading teams and shipping with AI, not only individual output.
4. **Every path ends in a channel.** Whichever audience is reading, the next step (email, LinkedIn, or quentin.software) is always one move away.
5. **Truthful and consistent.** Titles, dates, and claims match LinkedIn and the structured data, and nothing is invented.

## Accessibility & Inclusion

No product-specific requirement has been set beyond good web practice. The page already respects `prefers-reduced-motion` and uses ARIA on the terminal dialog and the expandable tear sheets. Keep both.
