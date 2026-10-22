import * as THREE from "three";

// Procedural surfaces for the study — drawn once into canvases, shared by
// every mesh. Deterministic (seeded) so the room looks identical each visit.

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function tex(c: HTMLCanvasElement, repeat: [number, number] = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

/** Walnut: long flowing grain lines with occasional cathedral figure. */
function drawWalnut(seed: number, base: string) {
  const W = 512, H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  // broad tonal streaks
  for (let i = 0; i < 18; i++) {
    const y = r() * H;
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    const a = 0.06 + r() * 0.08;
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, r() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,210,160,${a * 0.6})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 30, W, 60);
  }
  // fine grain
  for (let i = 0; i < 260; i++) {
    const y0 = r() * H;
    const amp = 2 + r() * 6;
    const freq = 0.004 + r() * 0.01;
    const ph = r() * 10;
    ctx.strokeStyle = `rgba(${r() > 0.3 ? "20,10,4" : "120,80,45"},${0.05 + r() * 0.12})`;
    ctx.lineWidth = 0.5 + r() * 1.2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.1 + ph) * amp * 0.3;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c;
}

/** Oak floorboards — staggered planks, per-board tone, grain, and seams. */
function drawFloor() {
  const W = 1024, H = 1024;
  const { c, ctx } = canvas(W, H);
  const r = rng(7);
  const plankH = 64;
  const tones = ["#6d4528", "#7a4f2e", "#5e3b22", "#83563a", "#6a4430", "#744a2b"];
  for (let row = 0; row * plankH < H; row++) {
    let x = -Math.floor(r() * 400);
    while (x < W) {
      const len = 260 + Math.floor(r() * 320);
      const y = row * plankH;
      ctx.fillStyle = tones[Math.floor(r() * tones.length)];
      ctx.fillRect(x, y, len, plankH);
      for (let g = 0; g < 14; g++) {
        ctx.fillStyle = `rgba(${r() > 0.5 ? "30,16,6" : "150,100,60"},${0.04 + r() * 0.09})`;
        ctx.fillRect(x, y + r() * plankH, len, 0.6 + r() * 1.4);
      }
      // seams: dark gap + a faint highlight on the leading edge
      ctx.fillStyle = "rgba(20,10,4,0.75)";
      ctx.fillRect(x + len - 1.5, y, 1.5, plankH);
      ctx.fillRect(x, y + plankH - 1.5, len, 1.5);
      ctx.fillStyle = "rgba(255,220,180,0.06)";
      ctx.fillRect(x, y, len, 1);
      x += len;
    }
  }
  return c;
}

/** Library-green damask: a quiet repeating motif, darker at the field. */
function drawWallpaper() {
  const W = 256, H = 256;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#1f3328";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(196,170,110,0.10)";
  const motif = (cx: number, cy: number, s: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.75, cy - s * 0.5, cx + s * 0.55, cy + s * 0.35, cx, cy + s);
    ctx.bezierCurveTo(cx - s * 0.55, cy + s * 0.35, cx - s * 0.75, cy - s * 0.5, cx, cy - s);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  };
  motif(64, 64, 38);
  motif(192, 192, 38);
  motif(192, -64, 38);
  motif(-64, 192, 38);
  motif(64, 320, 38);
  motif(320, 64, 38);
  // fine vertical stripe + grain
  for (let x = 0; x < W; x += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(x, 0, 1, H);
  }
  const r = rng(3);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.06})`;
    ctx.fillRect(r() * W, r() * H, 1, 1);
  }
  return c;
}

/** Persian-style rug: field, medallion, layered borders, fringe-worn edges. */
function drawRug() {
  const W = 512, H = 384;
  const { c, ctx } = canvas(W, H);
  const r = rng(11);
  ctx.fillStyle = "#6e1f1c";
  ctx.fillRect(0, 0, W, H);
  // borders
  const band = (inset: number, w: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  };
  band(10, 14, "#1d2340");
  band(26, 4, "#c9a36a");
  band(38, 14, "#2f4a3a");
  band(52, 3, "#c9a36a");
  // repeating border lozenges
  ctx.fillStyle = "#c9a36a";
  for (let x = 30; x < W - 30; x += 22) {
    ctx.fillRect(x, 12, 6, 6);
    ctx.fillRect(x, H - 18, 6, 6);
  }
  // central medallion
  ctx.save();
  ctx.translate(W / 2, H / 2);
  for (const [s, col] of [
    [120, "#1d2340"],
    [92, "#c9a36a"],
    [84, "#8a2a24"],
    [52, "#2f4a3a"],
    [20, "#c9a36a"],
  ] as const) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? s * 0.72 : s;
      ctx.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // corner spandrels
  ctx.fillStyle = "rgba(29,35,64,0.85)";
  for (const [x, y] of [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]]) {
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  // wool texture + wear
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? "0,0,0" : "255,230,200"},${r() * 0.07})`;
    ctx.fillRect(r() * W, r() * H, 1.5, 1);
  }
  return c;
}

/** Dusk sky for the window: deep blue overhead fading to ember at the sill. */
function drawDusk() {
  const W = 128, H = 256;
  const { c, ctx } = canvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1b2747");
  g.addColorStop(0.45, "#5a4a6a");
  g.addColorStop(0.75, "#e08a4a");
  g.addColorStop(1, "#ffcf8a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // distant skyline silhouette
  ctx.fillStyle = "#120d14";
  const r = rng(5);
  let x = 0;
  while (x < W) {
    const w = 6 + r() * 14;
    const h = 20 + r() * 50;
    ctx.fillRect(x, H - h, w, h);
    x += w;
  }
  return c;
}

const cache = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

export const walnut = () =>
  once("walnut", () =>
    new THREE.MeshStandardMaterial({
      map: tex(drawWalnut(42, "#4a2b17"), [1, 1]),
      roughness: 0.55,
      metalness: 0,
      color: "#ffffff",
    })
  );

export const darkWalnut = () =>
  once("darkWalnut", () =>
    new THREE.MeshStandardMaterial({
      map: tex(drawWalnut(9, "#2e1a0e"), [1, 1]),
      roughness: 0.6,
    })
  );

export const floorMaterial = () =>
  once("floor", () =>
    new THREE.MeshStandardMaterial({
      map: tex(drawFloor(), [2.2, 2.2]),
      roughness: 0.48,
      metalness: 0,
    })
  );

export const wallpaperMaterial = (repeat: [number, number]) =>
  once(`wallpaper|${repeat}`, () =>
    new THREE.MeshStandardMaterial({ map: tex(drawWallpaper(), repeat), roughness: 0.9 })
  );

export const rugMaterial = () =>
  once("rug", () => new THREE.MeshStandardMaterial({ map: tex(drawRug()), roughness: 1 }));

export const duskMaterial = () =>
  once("dusk", () =>
    new THREE.MeshBasicMaterial({ map: tex(drawDusk()), toneMapped: false })
  );

export const brass = () =>
  once("brass", () =>
    new THREE.MeshStandardMaterial({ color: "#c9a04e", roughness: 0.28, metalness: 1 })
  );

export const leather = () =>
  once("leather", () =>
    new THREE.MeshStandardMaterial({ color: "#5a2416", roughness: 0.42, metalness: 0 })
  );
