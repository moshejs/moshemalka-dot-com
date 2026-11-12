#!/usr/bin/env node
// Usage: node shot.mjs <url> <outPrefix> [extraPath ...]
// Screenshots each page at desktop (1440) and phone (390), full page, and reports
// console errors, failed requests and horizontal overflow. Exits 1 on any problem.
// Playwright is resolved from the current working directory (the project).
// Ignores host-only endpoints (/_vercel/, /cdn-cgi/) and aborted requests; add more with SMOKE_IGNORE.
import { createRequire } from 'node:module';
import path from 'node:path';

const [url, prefix, ...extra] = process.argv.slice(2);
if (!url || !prefix) {
  console.error('usage: node shot.mjs <url> <outPrefix> [extraPath ...]');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = createRequire(path.join(process.cwd(), '/'))('playwright'));
} catch {
  console.error('playwright not found in this project: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const base = new URL(url);
const targets = [base.href, ...extra.map((p) => new URL(p, base).href)];
const viewports = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'phone', width: 390, height: 844, isMobile: true },
];
// Host-only endpoints that 404 off-platform (Vercel Analytics/Speed Insights, Cloudflare).
// Extend per project with SMOKE_IGNORE='regex'.
const IGNORE = new RegExp(['/_vercel/', '/cdn-cgi/', process.env.SMOKE_IGNORE].filter(Boolean).join('|'));
const ignored = (s) => !!s && IGNORE.test(s);
const slug = (u) => (new URL(u).pathname.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_') || 'home');

let browser;
try {
  browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
} catch (e) {
  console.error(/Executable doesn't exist/.test(e.message)
    ? 'Chromium for this Playwright version is not downloaded: npx playwright install chromium'
    : `browser launch failed: ${e.message.split('\n')[0]}`);
  process.exit(2);
}
let problems = 0;

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    deviceScaleFactor: vp.isMobile ? 2 : 1,
  });
  for (const target of targets) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() !== 'error' || ignored(m.text()) || ignored(m.location()?.url)) return;
      errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('requestfailed', (r) => {
      // ERR_ABORTED = the page cancelled it (navigation, unmount, prefetch race), not a broken resource.
      if (ignored(r.url()) || /ERR_ABORTED/.test(r.failure()?.errorText ?? '')) return;
      errors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
    });
    page.on('response', (r) => r.status() >= 400 && !ignored(r.url()) && errors.push(`HTTP ${r.status()}: ${r.url()}`));

    await page.goto(target, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errors.push(`goto: ${e.message}`));
    // Scroll through so lazy content and scroll-reveal effects run, then return to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
        scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 120));
      }
      scrollTo({ top: 0, behavior: 'instant' });
    }).catch(() => {});
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      // clientWidth, not innerWidth: on mobile emulation innerWidth grows to fit overflowing content.
      viewport: document.documentElement.clientWidth,
    })).catch(() => ({ scrollWidth: 0, viewport: 0 }));
    const file = `${prefix}-${slug(target)}-${vp.name}.png`;
    // Very tall pages exceed Chromium's capture limit; fall back to the first screen.
    await page.screenshot({ path: file, fullPage: true })
      .catch(() => page.screenshot({ path: file }))
      .catch((e) => errors.push(`screenshot: ${e.message.split('\n')[0]}`));

    const over = overflow.scrollWidth > overflow.viewport;
    const ok = !errors.length && !over;
    if (!ok) problems++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${vp.name.padEnd(7)} ${target}\n     ${file}`);
    if (over) console.log(`     horizontal overflow: scrollWidth ${overflow.scrollWidth} > ${overflow.viewport}`);
    for (const e of errors.slice(0, 10)) console.log(`     ${e}`);
    await page.close();
  }
  await ctx.close();
}

await browser.close();
process.exit(problems ? 1 : 0);
