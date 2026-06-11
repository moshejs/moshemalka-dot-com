// Headless verification harness for /study — screenshots + interaction probes.
// Usage: node scripts/study-shot.mjs [outPrefix]
import { chromium } from "playwright";

const out = process.argv[2] ?? "study";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
});

await page.goto("http://localhost:3000/study", { waitUntil: "networkidle" });

// Wait for the R3F state hook and a few rendered frames.
await page.waitForFunction(() => !!window.__studyState, { timeout: 30000 });
await page.waitForTimeout(3500); // let textures/lerps settle

const stats = await page.evaluate(() => {
  const s = window.__studyState;
  return {
    canvas: [s.gl.domElement.width, s.gl.domElement.height],
    drawCalls: s.gl.info.render.calls,
    triangles: s.gl.info.render.triangles,
    demo: document.body.innerText.includes("DEMO"),
  };
});
console.log("STATS", JSON.stringify(stats));

await page.screenshot({ path: `${out}-1-room.png` });

// Click a book: project the first pulled-out candidate's screen position.
const clickPos = await page.evaluate(() => {
  const s = window.__studyState;
  const meshes = [];
  s.scene.traverse((o) => {
    if (o.isMesh && Array.isArray(o.material) && o.material.length === 6) meshes.push(o);
  });
  if (!meshes.length) return null;
  const m = meshes[Math.floor(meshes.length / 2)];
  const v = m.getWorldPosition(new (Object.getPrototypeOf(m.position).constructor)());
  v.project(s.camera);
  return {
    x: Math.round(((v.x + 1) / 2) * s.size.width),
    y: Math.round(((1 - v.y) / 2) * s.size.height),
    count: meshes.length,
    title: m.userData?.title ?? null,
  };
});
console.log("CLICK", JSON.stringify(clickPos));

if (clickPos) {
  await page.mouse.click(clickPos.x, clickPos.y);
  await page.waitForTimeout(2500); // pull-out animation + camera dolly
  await page.screenshot({ path: `${out}-2-pulled.png` });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}-3-closed.png` });
}

console.log("ERRORS", JSON.stringify(errors.slice(0, 10)));
await browser.close();
