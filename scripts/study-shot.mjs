// Headless verification harness for /study — screenshots + interaction probes.
// Usage: node scripts/study-shot.mjs <outPrefix> [url]
// Renders desktop (1440×900) and phone (390×844): room at rest, a book taken
// down, ←/→ stepping, and put back. WebGL runs on SwiftShader.
import { chromium } from "playwright";

const out = process.argv[2] ?? "study";
const url = process.argv[3] ?? "http://localhost:3000/study";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

async function run(label, viewport, isMobile) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text().slice(0, 220)}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__studyState, { timeout: 60000 });
  await page.waitForTimeout(6000); // fonts → spines, arrival dolly, shadow/AO settle

  const stats = await page.evaluate(() => {
    const s = window.__studyState;
    let books = 0;
    s.scene.traverse((o) => {
      if (o.isGroup && o.children.length && o.children.every((c) => c.isMesh && Array.isArray(c.material))) books++;
    });
    return {
      canvas: [s.gl.domElement.width, s.gl.domElement.height],
      calls: s.gl.info.render.calls,
      tris: s.gl.info.render.triangles,
      textures: s.gl.info.memory.textures,
      books,
    };
  });
  console.log(label, "STATS", JSON.stringify(stats));
  await page.screenshot({ path: `${out}-${label}-1-room.png` });

  // Project an eye-level book near the middle of the frame and click it.
  const target = await page.evaluate(() => {
    const s = window.__studyState;
    const V = s.camera.position.constructor;
    let best = null;
    s.scene.traverse((o) => {
      if (!(o.isGroup && o.children.length && o.children.every((c) => c.isMesh && Array.isArray(c.material)))) return;
      const v = o.getWorldPosition(new V());
      v.project(s.camera);
      if (Math.abs(v.x) > 0.6 || Math.abs(v.y) > 0.6 || v.z > 1) return;
      const d = Math.hypot(v.x + 0.1, v.y);
      if (!best || d < best.d) best = { d, x: v.x, y: v.y };
    });
    if (!best) return null;
    return { x: Math.round(((best.x + 1) / 2) * s.size.width), y: Math.round(((1 - best.y) / 2) * s.size.height) };
  });
  console.log(label, "CLICK", JSON.stringify(target));
  if (target) {
    await page.mouse.move(target.x, target.y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}-${label}-2-hover.png` });
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(3800);
    const card = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d ? { label: d.getAttribute("aria-label"), visible: getComputedStyle(d).visibility } : null;
    });
    console.log(label, "CARD", JSON.stringify(card));
    await page.screenshot({ path: `${out}-${label}-3-held.png` });
    if (!isMobile) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(3500);
      const next = await page.evaluate(() => document.querySelector('[role="dialog"]')?.getAttribute("aria-label"));
      console.log(label, "STEP", JSON.stringify(next));
      await page.screenshot({ path: `${out}-${label}-4-step.png` });
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${out}-${label}-5-back.png` });
  }
  console.log(label, "ERRORS", JSON.stringify(errors.slice(0, 12)));
  await page.close();
}

await run("desktop", { width: 1440, height: 900 }, false);
await run("phone", { width: 390, height: 844 }, true);
await browser.close();
