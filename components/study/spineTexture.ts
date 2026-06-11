import * as THREE from "three";

const TEXTURES = new Map<string, THREE.CanvasTexture>();

export function getSpineTexture(opts: {
  title: string;
  author?: string;
  color: string;
  width: number; // in book units (used for canvas aspect)
  height: number;
}): THREE.CanvasTexture {
  const key = `${opts.title}|${opts.author ?? ""}|${opts.color}|${opts.width}|${opts.height}`;
  const cached = TEXTURES.get(key);
  if (cached) return cached;

  // Spine is tall and narrow. Make canvas tall.
  const W = 64;
  const H = Math.max(256, Math.round((opts.height / opts.width) * W));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Base color
  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, W, H);

  // Subtle vertical gradient (highlight to shadow)
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.10)");
  grad.addColorStop(0.5, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Top/bottom bands (mimic hardback caps)
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, 6);
  ctx.fillRect(0, H - 6, W, 6);

  // Title — rendered vertically (rotated)
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f3e9d2";
  ctx.font = "600 22px ui-serif, Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = truncate(opts.title, 28);
  ctx.fillText(title, 0, -6);
  if (opts.author) {
    ctx.fillStyle = "rgba(243,233,210,0.7)";
    ctx.font = "400 14px ui-serif, Georgia, serif";
    ctx.fillText(truncate(opts.author, 28), 0, 16);
  }
  ctx.restore();

  // Subtle paper grain
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  TEXTURES.set(key, tex);
  return tex;
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function getPagesTexture(): THREE.CanvasTexture {
  const cached = TEXTURES.get("__pages__");
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#efe6cf";
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 1) {
    ctx.fillStyle = `rgba(180,160,120,${0.05 + (i % 3) * 0.03})`;
    ctx.fillRect(0, i, 64, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  TEXTURES.set("__pages__", tex);
  return tex;
}
