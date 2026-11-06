// Runs after `next build`: every inline <script> that executes on a
// prerendered page must be allowed by that page's meta CSP hash
// (pages/_document.tsx). Catches a Next.js upgrade that changes the inline
// bootstrap before it ships a page whose JavaScript the browser blocks.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("../.next/server/pages/", import.meta.url).pathname;
const DATA_TYPES = /type="application\/(?:ld\+)?json"/;

function htmlFiles(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : [],
  );
}

let failed = 0;
const files = htmlFiles(dir);
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/);
  const policy = meta ? meta[1].replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&") : "";
  const allowed = new Set(policy.match(/'sha256-[^']+'/g) ?? []);
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(attrs) || DATA_TYPES.test(attrs) || !body.trim()) continue;
    const hash = `'sha256-${createHash("sha256").update(body).digest("base64")}'`;
    if (!allowed.has(hash)) {
      failed++;
      console.error(`check-csp: ${file.slice(dir.length)} has an inline script not covered by its CSP: ${body.slice(0, 80)}…`);
    }
  }
}
if (failed) process.exit(1);
console.log(`check-csp: inline scripts on ${files.length} prerendered pages are all hash-allowed`);
