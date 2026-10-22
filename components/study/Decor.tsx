import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { brass, darkWalnut } from "./materials";

// Small shelf objects. Each sits with its base at y = 0 in local space.

export function Bookend({ position, flip = false }: { position: [number, number, number]; flip?: boolean }) {
  return (
    <group position={position} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh castShadow receiveShadow material={brass()} position={[0, 0.11, 0]}>
        <boxGeometry args={[0.014, 0.22, 0.16]} />
      </mesh>
      <mesh castShadow receiveShadow material={brass()} position={[-0.05, 0.004, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.16]} />
      </mesh>
    </group>
  );
}

const potMat = new THREE.MeshStandardMaterial({ color: "#9a5a3c", roughness: 0.85 });
const soilMat = new THREE.MeshStandardMaterial({ color: "#2a1c12", roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#3f6b3a", roughness: 0.55, side: THREE.DoubleSide });

/** A trailing pothos: terracotta pot, leaves fanning up and spilling over the plank. */
export function Plant({ position, seed = 1 }: { position: [number, number, number]; seed?: number }) {
  const leaves = useMemo(() => {
    const out: { p: [number, number, number]; r: [number, number, number]; s: number }[] = [];
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2;
      const trailing = i > 10;
      const rad = trailing ? 0.1 + rnd() * 0.06 : 0.02 + rnd() * 0.07;
      const y = trailing ? 0.12 - rnd() * 0.22 : 0.17 + rnd() * 0.16;
      out.push({
        p: [Math.cos(a) * rad, y, Math.sin(a) * rad * 0.8 + (trailing ? 0.05 : 0)],
        r: [rnd() * 1.2 - 0.6 + (trailing ? 1.1 : 0), a, rnd() * 0.8 - 0.4],
        s: 0.6 + rnd() * 0.5,
      });
    }
    return out;
  }, [seed]);
  return (
    <group position={position}>
      <mesh castShadow receiveShadow material={potMat} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.075, 0.06, 0.14, 24]} />
      </mesh>
      <mesh material={soilMat} position={[0, 0.135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.068, 20]} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} castShadow material={leafMat} position={l.p} rotation={l.r} scale={l.s}>
          <sphereGeometry args={[0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
    </group>
  );
}

const waxMat = new THREE.MeshStandardMaterial({ color: "#efe3c8", roughness: 0.5 });
const flameMat = new THREE.MeshBasicMaterial({ color: "#ffcf7a", toneMapped: false });

/** A lit taper in a brass stick. `light` adds a real flickering point light. */
export function Candle({ position, light = true }: { position: [number, number, number]; light?: boolean }) {
  const flame = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 1 + Math.sin(t * 11) * 0.05 + Math.sin(t * 17.3) * 0.04 + Math.sin(t * 3.1) * 0.03;
    if (flame.current) {
      flame.current.scale.set(1, f, 1);
      flame.current.rotation.z = Math.sin(t * 2.3) * 0.06;
    }
    if (lamp.current) lamp.current.intensity = 0.55 * f;
  });
  return (
    <group position={position}>
      <mesh castShadow material={brass()} position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.024, 24]} />
      </mesh>
      <mesh castShadow material={brass()} position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.016, 0.022, 0.05, 16]} />
      </mesh>
      <mesh castShadow material={waxMat} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.018, 0.019, 0.17, 16]} />
      </mesh>
      <mesh ref={flame} material={flameMat} position={[0, 0.255, 0]}>
        <sphereGeometry args={[0.011, 12, 10]} />
      </mesh>
      <mesh material={flameMat} position={[0, 0.262, 0]} scale={[0.7, 1.9, 0.7]}>
        <sphereGeometry args={[0.009, 12, 10]} />
      </mesh>
      {light && (
        <pointLight ref={lamp} position={[0, 0.3, 0.04]} color="#ffb35c" intensity={0.55} distance={1.4} decay={2} />
      )}
    </group>
  );
}

const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#ffffff",
  roughness: 0.05,
  transmission: 0.9,
  thickness: 0.02,
  transparent: true,
  opacity: 0.35,
});
const sandMat = new THREE.MeshStandardMaterial({ color: "#d8b77a", roughness: 0.9 });

export function Hourglass({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0.006, 0.234].map((y) => (
        <mesh key={y} castShadow material={darkWalnut()} position={[0, y, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.012, 24]} />
        </mesh>
      ))}
      {[-0.045, 0.045].map((x) =>
        [-0.045, 0.045].map((z) => (
          <mesh key={`${x}${z}`} castShadow material={darkWalnut()} position={[x, 0.12, z]}>
            <cylinderGeometry args={[0.005, 0.005, 0.22, 8]} />
          </mesh>
        ))
      )}
      <mesh material={glassMat} position={[0, 0.065, 0]}>
        <coneGeometry args={[0.042, 0.1, 24, 1, true]} />
      </mesh>
      <mesh material={glassMat} position={[0, 0.175, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.042, 0.1, 24, 1, true]} />
      </mesh>
      <mesh material={sandMat} position={[0, 0.03, 0]}>
        <coneGeometry args={[0.03, 0.035, 20]} />
      </mesh>
      <mesh material={sandMat} position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.018, 0.022, 20]} />
      </mesh>
    </group>
  );
}

const STACK_COLORS = ["#5a2a24", "#2c3e35", "#1f2a44", "#6b5434", "#3b2a1e", "#7a2e2a"];

/** Books lying flat, slightly misaligned, like a real to-read pile. */
export function BookStack({ position, count = 3, seed = 0 }: { position: [number, number, number]; count?: number; seed?: number }) {
  const books = useMemo(() => {
    let y = 0;
    return Array.from({ length: count }, (_, i) => {
      const h = 0.045 + ((seed + i * 7) % 4) * 0.012;
      const w = 0.42 - ((seed + i * 3) % 3) * 0.04;
      const d = 0.3 - ((seed + i) % 3) * 0.025;
      const b = { y: y + h / 2, h, w, d, rot: (((seed * 13 + i * 29) % 11) - 5) * 0.02, color: STACK_COLORS[(seed + i) % STACK_COLORS.length] };
      y += h;
      return b;
    });
  }, [count, seed]);
  return (
    <group position={position}>
      {books.map((b, i) => (
        <group key={i} position={[0, b.y, 0]} rotation={[0, b.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.75} />
          </mesh>
          {/* page edges on the fore-edge side */}
          <mesh position={[0, 0, b.d / 2 + 0.0005]}>
            <planeGeometry args={[b.w - 0.016, b.h - 0.01]} />
            <meshStandardMaterial color="#e6dcc2" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const oceanMat = new THREE.MeshStandardMaterial({ color: "#3b5568", roughness: 0.4 });

export function DeskGlobe({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.12;
  });
  return (
    <group position={position}>
      <mesh castShadow material={darkWalnut()} position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.03, 24]} />
      </mesh>
      <mesh castShadow material={brass()} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
      </mesh>
      <mesh ref={ref} castShadow material={oceanMat} position={[0, 0.2, 0]} rotation={[0, 0, 0.41]}>
        <sphereGeometry args={[0.11, 32, 24]} />
      </mesh>
      <mesh material={brass()} position={[0, 0.2, 0]} rotation={[0, Math.PI / 2, 0.41]}>
        <torusGeometry args={[0.122, 0.004, 8, 48, Math.PI]} />
      </mesh>
    </group>
  );
}
