import * as THREE from "three";

// Procedural book surfaces: spine (color + roughness/metalness), a generated
// front cover, and page edges. Cached by content so remounts are free.

const CACHE = new Map<string, THREE.Texture>();
let FAMILY = "Georgia, 'Times New Roman', serif";

/** The room passes the loaded Garamond family in before any texture is drawn. */
export function setTextureFont(family: string) {
  FAMILY = family;
}

export type Binding = "hard" | "paper";

function luminance(hex: string) {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; // linear-ish, good enough
}

/** Gilt on dark cloth, ink on light boards, cream on dark paperbacks. */
function inkFor(color: string, binding: Binding) {
  const L = luminance(color);
  if (L > 0.42) return { ink: "#1d140c", soft: "rgba(29,20,12,0.7)", gilt: false };
  return binding === "hard"
    ? { ink: "#e2c278", soft: "rgba(226,194,120,0.75)", gilt: true }
    : { ink: "#f3e8d2", soft: "rgba(243,232,210,0.7)", gilt: false };
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  // Deterministic noise — no Math.random so every render is identical.
  let s = 1337;
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const n = ((s / 2147483647) - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Fit text to a line length by shrinking, then truncate as a last resort. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, start: number, min: number) {
  let size = start;
  for (; size >= min; size -= 1) {
    ctx.font = `${weight} ${size}px ${FAMILY}`;
    if (ctx.measureText(text).width <= max) return { text, size };
  }
  ctx.font = `${weight} ${min}px ${FAMILY}`;
  let t = text;
  while (t.length > 3 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return { text: t.trimEnd() + "…", size: min };
}

function shortTitle(title: string) {
  // Spines carry the main title, not the subtitle.
  return title.split(/\s*[:(—–]\s*/)[0].trim() || title;
}

function surname(author?: string) {
  if (!author) return "";
  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export function getSpineMaps(opts: {
  id: string;
  title: string;
  author?: string;
  color: string;
  binding: Binding;
  width: number;
  height: number;
}): { map: THREE.Texture; rm: THREE.Texture } {
  const key = `spine|${opts.id}|${opts.color}|${opts.binding}|${FAMILY}`;
  const cached = CACHE.get(key);
  if (cached) return { map: cached, rm: CACHE.get(key + "|rm")! };

  const W = 96;
  const H = Math.round((opts.height / opts.width) * W);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { ink, soft, gilt } = inkFor(opts.color, opts.binding);

  // Cloth/board base with a rounded-spine shading falloff.
  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, W, H);
  const shade = ctx.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.32)");
  shade.addColorStop(0.18, "rgba(255,255,255,0.06)");
  shade.addColorStop(0.5, "rgba(255,255,255,0.10)");
  shade.addColorStop(0.82, "rgba(255,255,255,0.03)");
  shade.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, opts.binding === "hard" ? 18 : 10);

  // Head and tail bands — gilt rules on hardcovers, a printed rule on paper.
  const bands = opts.binding === "hard" ? [0.055, 0.075, 0.925, 0.945] : [0.06, 0.94];
  ctx.fillStyle = gilt ? "#caa65a" : soft;
  for (const b of bands) ctx.fillRect(4, Math.round(b * H), W - 8, opts.binding === "hard" ? 2 : 1);

  // Title runs bottom-to-top along the spine, author surname near the tail.
  const t = shortTitle(opts.title);
  const titleMax = H * (opts.binding === "hard" ? 0.66 : 0.7);
  const fit = fitText(ctx, t, 600, titleMax, Math.min(44, W * 0.46), 15);
  ctx.save();
  ctx.translate(W / 2, H * 0.47);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.font = `600 ${fit.size}px ${FAMILY}`;
  ctx.fillText(fit.text, 0, 0);
  ctx.restore();

  const sur = surname(opts.author);
  if (sur) {
    ctx.save();
    ctx.translate(W / 2, H * 0.87);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = soft;
    const af = fitText(ctx, sur.toUpperCase(), 500, H * 0.13, 17, 10);
    ctx.font = `500 ${af.size}px ${FAMILY}`;
    ctx.fillText(af.text, 0, 0);
    ctx.restore();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  // Roughness (G) / metalness (B): gilt is polished metal, cloth is matte.
  const rmC = document.createElement("canvas");
  rmC.width = 24;
  rmC.height = Math.max(64, Math.round(H / 4));
  const r = rmC.getContext("2d")!;
  r.fillStyle = `rgb(0, ${opts.binding === "hard" ? 200 : 170}, 0)`;
  r.fillRect(0, 0, rmC.width, rmC.height);
  if (gilt) {
    // Bands plus the lettered region read as foil.
    r.fillStyle = "rgb(0, 70, 255)";
    for (const b of bands) r.fillRect(1, Math.floor(b * rmC.height), rmC.width - 2, 2);
    r.fillStyle = "rgb(0, 110, 170)";
    r.fillRect(rmC.width * 0.3, rmC.height * 0.1, rmC.width * 0.4, rmC.height * 0.82);
  }
  const rm = new THREE.CanvasTexture(rmC);

  CACHE.set(key, map);
  CACHE.set(key + "|rm", rm);
  return { map, rm };
}

/** A typeset front board for books with no cover image (or while it loads). */
export function getGeneratedCover(opts: {
  id: string;
  title: string;
  author?: string;
  color: string;
  binding: Binding;
  aspect: number; // depth / height of the board
}): THREE.Texture {
  const key = `cover|${opts.id}|${opts.color}|${FAMILY}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const H = 512;
  const W = Math.round(H * opts.aspect);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { ink, soft } = inkFor(opts.color, opts.binding);

  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.1, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, "rgba(255,255,255,0.06)");
  vg.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, 14);

  // A single inset frame rule, like a blind-stamped board.
  ctx.strokeStyle = soft;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(W * 0.08, H * 0.06, W * 0.84, H * 0.88);

  // Title, wrapped to the board width.
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const words = shortTitle(opts.title).split(/\s+/);
  const maxW = W * 0.7;
  let size = 40;
  let lines: string[] = [];
  for (; size >= 20; size -= 2) {
    ctx.font = `600 ${size}px ${FAMILY}`;
    lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    if (lines.length <= 4) break;
  }
  lines = lines.slice(0, 5);
  const lh = size * 1.18;
  let y = H * 0.34 - ((lines.length - 1) * lh) / 2;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += lh;
  }
  // Ornamental rule + author
  ctx.fillStyle = soft;
  ctx.fillRect(W * 0.42, y + lh * 0.1, W * 0.16, 1.5);
  if (opts.author) {
    ctx.font = `italic 500 ${Math.round(size * 0.55)}px ${FAMILY}`;
    ctx.fillText(opts.author, W / 2, y + lh * 0.95);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  CACHE.set(key, tex);
  return tex;
}

/** An engraved brass shelf label: small caps on a brushed plate. */
export function getLabelTexture(text: string): THREE.Texture {
  const key = `label|${text}|${FAMILY}`;
  const cached = CACHE.get(key);
  if (cached) return cached;
  const W = 512, H = 72;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e7c983");
  g.addColorStop(0.45, "#c49a4c");
  g.addColorStop(1, "#8f6a2c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // brushed grain
  for (let x = 0; x < W; x += 2) {
    ctx.fillStyle = `rgba(255,240,200,${0.03 + ((x * 13) % 7) * 0.008})`;
    ctx.fillRect(x, 0, 1, H);
  }
  // bevel + screw heads
  ctx.strokeStyle = "rgba(60,40,10,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  for (const x of [20, W - 20]) {
    ctx.fillStyle = "#6e5020";
    ctx.beginPath();
    ctx.arc(x, H / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // engraved lettering: dark fill with a light lower edge
  const label = text.toUpperCase();
  const fit = fitText(ctx, label, 600, W - 90, 34, 18);
  ctx.font = `600 ${fit.size}px ${FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "3px";
  ctx.fillStyle = "rgba(255,236,190,0.6)";
  ctx.fillText(fit.text, W / 2, H / 2 + 2);
  ctx.fillStyle = "#3a2a10";
  ctx.fillText(fit.text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  CACHE.set(key, tex);
  return tex;
}

/** Page block: fine horizontal leaves with a slight warm age. */
export function getPagesTexture(): THREE.Texture {
  const cached = CACHE.get("__pages__");
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ece2c9";
  ctx.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 128; i++) {
    ctx.fillStyle = `rgba(150,125,90,${0.05 + ((i * 7) % 5) * 0.025})`;
    ctx.fillRect(0, i, 64, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  CACHE.set("__pages__", tex);
  return tex;
}
