// Writes public/og-image.jpg (1200×630 share card) from scripts/og-card/base.jpg.
//
// The base is the original card, kept pixel for pixel: domain line, name,
// teal "New York City" mark, divider and photo all come from it. This script
// only paints over the title line with the card background and draws the
// title in its place, in the font, size, colour, left edge and baseline the
// original title line used (measured from the base).
//
// Usage: node scripts/og-card.mjs [--title "…"] [--out path] [--quality 95]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import jpeg from "jpeg-js";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const TITLE = arg("title", "Founder & principal engineer");
const OUT = arg("out", fileURLToPath(new URL("../public/og-image.jpg", import.meta.url)));
const QUALITY = Number(arg("quality", "95"));

// Measured from base.jpg: background #060912; the title band between the
// name (ink ends at y=279) and the teal mark (ink starts at y=394) is clean
// background inside this box, so filling it leaves no seam.
const BG = "#060912";
const BLANK = { x: 60, y: 288, w: 652, h: 96 };
// Original title line: Arial regular, left ink edge x=85, cap top y=330,
// baseline y=360, colour sampled from the glyph cores. Re-rendering the old
// title ("Engineering Leader") with these values lands on the same ink box
// (x 85–441, y 330–367) with 0.97 correlation to the base.
const TEXT = { font: "Arial", size: 41.2, color: "#e4e5ea", left: 85, baseline: 360 };

const base = readFileSync(new URL("./og-card/base.jpg", import.meta.url)).toString("base64");

const html = `<!doctype html><html><head><style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: ${BG}; }
  img { position: absolute; left: 0; top: 0; width: 1200px; height: 630px; }
  .blank { position: absolute; left: ${BLANK.x}px; top: ${BLANK.y}px; width: ${BLANK.w}px; height: ${BLANK.h}px; background: ${BG}; }
  .title { position: absolute; left: 0; top: 0; font: 400 ${TEXT.size}px "${TEXT.font}"; color: ${TEXT.color};
           line-height: 1; white-space: nowrap; -webkit-font-smoothing: antialiased; }
</style></head><body>
  <img src="data:image/jpeg;base64,${base}" alt="">
  <div class="blank"></div>
  <div class="title" id="t"></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(async ({ title, left, baseline, blank }) => {
  await document.fonts.ready;
  const el = document.getElementById("t");
  el.textContent = title;
  // Place the alphabetic baseline and the left ink edge exactly.
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  el.appendChild(probe);
  const baseY = probe.getBoundingClientRect().top;
  el.removeChild(probe);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = getComputedStyle(el).font;
  const m = ctx.measureText(title);
  el.style.left = `${left + m.actualBoundingBoxLeft}px`;
  el.style.top = `${baseline - baseY}px`;
  const right = left + m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  if (right > blank.x + blank.w) throw new Error(`Title is ${Math.round(right)}px wide; it overruns the left column.`);
}, { title: TITLE, left: TEXT.left, baseline: TEXT.baseline, blank: BLANK });
// Encode once, from the lossless frame. Chrome's own JPEG output subsamples
// chroma (4:2:0), which smears the orange domain line; jpeg-js keeps full
// chroma, so everything outside the title stays visually identical to base.
const png = await page.screenshot({ type: "png" });
const rgba = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
}, `data:image/png;base64,${png.toString("base64")}`);
await browser.close();
const { data } = jpeg.encode({ data: Uint8Array.from(rgba), width: 1200, height: 630 }, QUALITY);
writeFileSync(OUT, data);
console.log(`og-card: "${TITLE}" → ${OUT}`);
