import * as THREE from "three";
import { useMemo } from "react";

const wood = new THREE.MeshStandardMaterial({
  color: "#4a2f1d",
  roughness: 0.7,
});
const darkWood = new THREE.MeshStandardMaterial({
  color: "#2a1a0e",
  roughness: 0.8,
});
const leather = new THREE.MeshStandardMaterial({
  color: "#3a1f15",
  roughness: 0.55,
  metalness: 0.05,
});
const brass = new THREE.MeshStandardMaterial({
  color: "#b88a3a",
  roughness: 0.35,
  metalness: 0.7,
});

export function Desk({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* top */}
      <mesh position={[0, 0.78, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
      </mesh>
      {/* legs */}
      {[
        [-0.7, 0.39, -0.35],
        [0.7, 0.39, -0.35],
        [-0.7, 0.39, 0.35],
        [0.7, 0.39, 0.35],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} material={darkWood} castShadow>
          <boxGeometry args={[0.08, 0.78, 0.08]} />
        </mesh>
      ))}
      {/* drawer face */}
      <mesh position={[0, 0.62, 0.4]} material={wood} castShadow>
        <boxGeometry args={[0.6, 0.18, 0.02]} />
      </mesh>
      <mesh position={[0, 0.62, 0.41]} material={brass} castShadow>
        <boxGeometry args={[0.05, 0.04, 0.01]} />
      </mesh>
    </group>
  );
}

export function Lamp({
  position,
  warmth = 1,
}: {
  position: [number, number, number];
  warmth?: number;
}) {
  // base, stem, shade, light
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} material={brass} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={brass} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <coneGeometry args={[0.13, 0.18, 24, 1, true]} />
        <meshStandardMaterial
          color="#d6a45a"
          roughness={0.55}
          side={THREE.DoubleSide}
          emissive={"#3a2208"}
          emissiveIntensity={0.4}
        />
      </mesh>
      <pointLight
        position={[0, 0.32, 0]}
        intensity={warmth * 30}
        distance={7}
        decay={2}
        color="#ffb874"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  );
}

export function Chair({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* seat */}
      <mesh position={[0, 0.46, 0]} material={leather} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.18, 0.85]} />
      </mesh>
      {/* seat cushion */}
      <mesh position={[0, 0.58, 0]} material={leather} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.1, 0.78]} />
      </mesh>
      {/* back */}
      <mesh
        position={[0, 0.95, -0.36]}
        material={leather}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.85, 0.85, 0.14]} />
      </mesh>
      {/* armrests */}
      <mesh position={[-0.42, 0.7, 0]} material={leather} castShadow>
        <boxGeometry args={[0.14, 0.32, 0.7]} />
      </mesh>
      <mesh position={[0.42, 0.7, 0]} material={leather} castShadow>
        <boxGeometry args={[0.14, 0.32, 0.7]} />
      </mesh>
      {/* feet */}
      {[
        [-0.36, 0.18, -0.36],
        [0.36, 0.18, -0.36],
        [-0.36, 0.18, 0.36],
        [0.36, 0.18, 0.36],
      ].map((p, i) => (
        <mesh
          key={i}
          position={p as [number, number, number]}
          material={darkWood}
          castShadow
        >
          <boxGeometry args={[0.1, 0.36, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

export function Rug({
  position,
  width = 3.2,
  depth = 2.4,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
}) {
  const tex = useMemo(() => {
    const W = 256;
    const c = document.createElement("canvas");
    c.width = c.height = W;
    const ctx = c.getContext("2d")!;
    // base
    ctx.fillStyle = "#5a2424";
    ctx.fillRect(0, 0, W, W);
    // border
    ctx.strokeStyle = "#3a1414";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, W - 16, W - 16);
    ctx.strokeStyle = "#c9a36a";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, W - 40);
    // ornament
    ctx.fillStyle = "#3a1414";
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c9a36a";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2, W / 2);
      const a = (i / 8) * Math.PI * 2;
      ctx.lineTo(W / 2 + Math.cos(a) * 60, W / 2 + Math.sin(a) * 60);
      ctx.stroke();
    }
    // grain
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
      ctx.fillRect(Math.random() * W, Math.random() * W, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], position[1] + 0.005, position[2]]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

export function PictureFrame({
  position,
  rotationY = 0,
  width = 0.9,
  height = 1.2,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={brass} castShadow>
        <boxGeometry args={[width, height, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.025]} castShadow>
        <boxGeometry args={[width - 0.08, height - 0.08, 0.005]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Globe({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} material={darkWood} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial color="#7a6a3a" roughness={0.6} />
      </mesh>
    </group>
  );
}
