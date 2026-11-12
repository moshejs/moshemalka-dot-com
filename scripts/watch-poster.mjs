// Captures public/watch.webp, the still that stands in for the 3D watch
// before it loads and where WebGL is unavailable.
// Usage: start the dev server, then `node scripts/watch-poster.mjs [url]`.
import { chromium } from "playwright";
import sharp from "sharp";

const url = (process.argv[2] ?? "http://localhost:3000/") + "#watch-poster";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForSelector('.c-watch3d[data-ready="true"]', { timeout: 60_000 });
await page.waitForTimeout(1500);
const data = await page.evaluate(() => document.querySelector(".c-watch3d canvas").toDataURL("image/png"));
await browser.close();
const png = Buffer.from(data.split(",")[1], "base64");
const info = await sharp(png).resize(880, 880).webp({ quality: 86, alphaQuality: 90 }).toFile("public/watch.webp");
console.log(`public/watch.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)} KB`);
