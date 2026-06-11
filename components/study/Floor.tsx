import { useMemo } from "react";
import * as THREE from "three";

const PLANK_COLORS = ["#5a3a22", "#6b4528", "#4a2f1d", "#774e30", "#5f3c25"];

function makeFloorTexture() {
  const W = 1024;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3a2718";
  ctx.fillRect(0, 0, W, H);

  const plankH = 96;
  let y = 0;
  let row = 0;
  while (y < H) {
    let x = (row % 2) * 180 - 180;
    while (x < W) {
      const plankW = 180 + Math.floor(Math.random() * 80);
      const c = PLANK_COLORS[(row * 7 + Math.floor(x / 100)) % PLANK_COLORS.length];
      ctx.fillStyle = c;
      ctx.fillRect(x, y, plankW, plankH);

      // grain lines
      for (let g = 0; g < 6; g++) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`;
        ctx.fillRect(x, y + Math.random() * plankH, plankW, 0.6 + Math.random());
      }
      // edge shadow
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x + plankW - 1, y, 1, plankH);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x, y + plankH - 1, plankW, 1);

      x += plankW;
    }
    y += plankH;
    row++;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  return tex;
}

export default function Floor({
  width,
  depth,
}: {
  width: number;
  depth: number;
}) {
  const tex = useMemo(makeFloorTexture, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={tex} roughness={0.85} metalness={0} />
    </mesh>
  );
}
