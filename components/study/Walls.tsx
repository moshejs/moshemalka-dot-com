import { useMemo } from "react";
import * as THREE from "three";

function makeWallTexture() {
  const W = 512;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // warm mid-brown base — light enough to catch the lamps
  ctx.fillStyle = "#6b5238";
  ctx.fillRect(0, 0, W, H);

  // subtle paper grain
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(${200 + Math.random() * 30},${
      170 + Math.random() * 20
    },${130 + Math.random() * 20},${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  // a few horizontal striations
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    ctx.fillRect(0, Math.random() * H, W, 0.5 + Math.random());
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export default function Walls({
  width,
  depth,
  height,
}: {
  width: number;
  depth: number;
  height: number;
}) {
  const tex = useMemo(makeWallTexture, []);
  return (
    <group>
      {/* back */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={tex} color="#a8825c" roughness={0.95} />
      </mesh>
      {/* left */}
      <mesh
        position={[-width / 2, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial map={tex} color="#a8825c" roughness={0.95} />
      </mesh>
      {/* right */}
      <mesh
        position={[width / 2, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial map={tex} color="#a8825c" roughness={0.95} />
      </mesh>
      {/* ceiling */}
      <mesh
        position={[0, height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>
    </group>
  );
}
