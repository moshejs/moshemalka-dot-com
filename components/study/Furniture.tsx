import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { BookStack } from "./Decor";
import { brass, darkWalnut, leather, rugMaterial, walnut } from "./materials";

type V3 = [number, number, number];

const inlay = new THREE.MeshStandardMaterial({ color: "#1f3a2c", roughness: 0.5 });
const pageMat = new THREE.MeshStandardMaterial({ color: "#efe5cc", roughness: 0.9, side: THREE.DoubleSide });

/** Partners-style pedestal desk with a green leather writing surface. */
export function Desk({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const wood = walnut();
  const dark = darkWalnut();
  const W = 1.75, D = 0.86, TOP = 0.78;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={wood} castShadow receiveShadow position={[0, TOP - 0.025, 0]}>
        <boxGeometry args={[W, 0.05, D]} />
      </mesh>
      <mesh material={inlay} receiveShadow position={[0, TOP + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.22, D - 0.2]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.26), 0, 0]}>
          <mesh material={dark} castShadow receiveShadow position={[0, (TOP - 0.05) / 2, 0]}>
            <boxGeometry args={[0.46, TOP - 0.05, D - 0.06]} />
          </mesh>
          {[0.16, 0.37, 0.58].map((y) => (
            <group key={y} position={[0, y, (D - 0.06) / 2]}>
              <mesh material={wood} castShadow position={[0, 0, 0.006]}>
                <boxGeometry args={[0.4, 0.17, 0.012]} />
              </mesh>
              <mesh material={brass()} position={[0, 0, 0.018]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.09, 8]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* modesty panel */}
      <mesh material={dark} receiveShadow position={[0, (TOP - 0.05) / 2 + 0.1, -D / 2 + 0.08]}>
        <boxGeometry args={[W - 0.98, TOP - 0.25, 0.03]} />
      </mesh>
    </group>
  );
}

const shadeGlass = new THREE.MeshStandardMaterial({
  color: "#17573a",
  roughness: 0.12,
  metalness: 0.1,
  emissive: new THREE.Color("#0b2a1a"),
  side: THREE.DoubleSide,
});
const bulbGlow = new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false });

/** The green-shaded banker's lamp — the warmest light in the room. */
export function BankersLamp({ position, rotationY = 0, shadows = true }: { position: V3; rotationY?: number; shadows?: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow material={brass()} position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.085, 0.1, 0.03, 32]} />
      </mesh>
      <mesh castShadow material={brass()} position={[0, 0.17, -0.02]}>
        <cylinderGeometry args={[0.011, 0.011, 0.3, 12]} />
      </mesh>
      <mesh castShadow material={brass()} position={[0, 0.31, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.1, 10]} />
      </mesh>
      {/* the half-cylinder green glass shade */}
      <group position={[0, 0.33, 0.05]}>
        <mesh castShadow material={shadeGlass} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.34, 32, 1, true, Math.PI / 2, Math.PI]} />
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} material={brass()} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.077, 0.077, 0.006, 32, 1, false, Math.PI / 2, Math.PI]} />
          </mesh>
        ))}
        <mesh material={bulbGlow} position={[0, -0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.018, 0.16, 6, 12]} />
        </mesh>
        <pointLight
          position={[0, -0.05, 0]}
          color="#ffbf73"
          intensity={6}
          distance={5}
          decay={2}
          castShadow={shadows}
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.002}
        />
      </group>
    </group>
  );
}

/** A book left open on the desk, pages fanned slightly. */
export function OpenBook({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.006, 0]}>
        <boxGeometry args={[0.46, 0.012, 0.3]} />
        <meshStandardMaterial color="#5a2a24" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={pageMat} castShadow receiveShadow position={[s * 0.11, 0.026, 0]} rotation={[-Math.PI / 2, s * -0.09, 0]}>
          <planeGeometry args={[0.215, 0.28, 1, 1]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`b${s}`} position={[s * 0.11, 0.019, 0]}>
          <boxGeometry args={[0.21, 0.014, 0.275]} />
          <meshStandardMaterial color="#e3d8bc" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Chesterfield wingback: tufted back, rolled arms, turned legs. */
export function Armchair({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const hide = leather();
  const buttons = useMemo(() => {
    const out: V3[] = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4 - (r % 2); c++) out.push([-0.27 + c * 0.18 + (r % 2) * 0.09, 0.62 + r * 0.17, -0.27]);
    return out;
  }, []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* seat base + cushion */}
      <RoundedBox args={[0.92, 0.3, 0.86]} radius={0.06} smoothness={4} material={hide} castShadow receiveShadow position={[0, 0.3, 0.02]} />
      <RoundedBox args={[0.7, 0.13, 0.7]} radius={0.06} smoothness={4} material={hide} castShadow receiveShadow position={[0, 0.5, 0.06]} />
      {/* back with wings */}
      <RoundedBox args={[0.92, 0.9, 0.18]} radius={0.07} smoothness={4} material={hide} castShadow receiveShadow position={[0, 0.82, -0.35]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox args={[0.14, 0.32, 0.82]} radius={0.06} smoothness={4} material={hide} castShadow receiveShadow position={[s * 0.42, 0.56, 0.02]} />
          {/* rolled arm */}
          <mesh material={hide} castShadow receiveShadow position={[s * 0.45, 0.72, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.78, 24]} />
          </mesh>
          {/* wing */}
          <RoundedBox args={[0.1, 0.5, 0.3]} radius={0.05} smoothness={4} material={hide} castShadow position={[s * 0.42, 1.0, -0.22]} />
        </group>
      ))}
      {buttons.map((p, i) => (
        <mesh key={i} position={p} material={hide}>
          <sphereGeometry args={[0.014, 8, 6]} />
        </mesh>
      ))}
      {/* turned legs */}
      {[-0.36, 0.36].map((x) =>
        [-0.32, 0.36].map((z) => (
          <mesh key={`${x}${z}`} material={darkWalnut()} castShadow position={[x, 0.07, z]}>
            <cylinderGeometry args={[0.03, 0.02, 0.14, 12]} />
          </mesh>
        ))
      )}
    </group>
  );
}

export function SideTable({ position }: { position: V3 }) {
  const wood = walnut();
  return (
    <group position={position}>
      <mesh material={wood} castShadow receiveShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 40]} />
      </mesh>
      <mesh material={darkWalnut()} castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.56, 16]} />
      </mesh>
      <mesh material={darkWalnut()} castShadow receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.04, 32]} />
      </mesh>
      <BookStack position={[0.02, 0.62, 0]} count={2} seed={4} />
    </group>
  );
}

export function FloorGlobe({ position }: { position: V3 }) {
  const ocean = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3f5a6b", roughness: 0.45 }), []);
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={darkWalnut()} castShadow position={[Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
            <cylinderGeometry args={[0.02, 0.025, 0.62, 10]} />
          </mesh>
        );
      })}
      <mesh material={walnut()} castShadow position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.025, 10, 48]} />
      </mesh>
      <mesh material={ocean} castShadow position={[0, 0.66, 0]} rotation={[0, 0.8, 0.41]}>
        <sphereGeometry args={[0.27, 48, 32]} />
      </mesh>
      <mesh material={brass()} position={[0, 0.66, 0]} rotation={[0, 0.3, 0.41]}>
        <torusGeometry args={[0.29, 0.006, 8, 64]} />
      </mesh>
    </group>
  );
}

/** A small dusk landscape in a gilt frame. */
export function Painting({ position, rotationY = 0, w = 1.0, h = 0.75 }: { position: V3; rotationY?: number; w?: number; h?: number }) {
  const canvasTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 300;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, "#2a3550");
    g.addColorStop(0.55, "#b07a52");
    g.addColorStop(1, "#3b2a1e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 400, 300);
    const hill = (y: number, amp: number, col: string, ph: number) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      for (let x = 0; x <= 400; x += 10) ctx.lineTo(x, y + Math.sin(x * 0.012 + ph) * amp + Math.sin(x * 0.03 + ph) * amp * 0.3);
      ctx.lineTo(400, 300);
      ctx.fill();
    };
    hill(190, 18, "#4a3a35", 1);
    hill(220, 14, "#2c2420", 3);
    hill(255, 10, "#1a1410", 5);
    ctx.fillStyle = "rgba(255,220,170,0.85)";
    ctx.beginPath();
    ctx.arc(280, 150, 14, 0, Math.PI * 2);
    ctx.fill();
    // varnish crackle / brush texture (seeded, so it's the same painting every visit)
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.06})`;
      ctx.fillRect(rnd() * 400, rnd() * 300, 2, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow material={brass()}>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={canvasTex} roughness={0.6} />
      </mesh>
      {/* brass picture light */}
      <mesh material={brass()} position={[0, h / 2 + 0.12, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, w * 0.6, 16]} />
      </mesh>
      <pointLight position={[0, h / 2 + 0.02, 0.32]} intensity={0.9} distance={1.3} decay={2} color="#ffcf90" />
    </group>
  );
}

export function Rug({ position, width, depth, rotationY = 0 }: { position: V3; width: number; depth: number; rotationY?: number }) {
  return (
    <mesh material={rugMaterial()} rotation={[-Math.PI / 2, 0, rotationY]} position={[position[0], 0.004, position[2]]} receiveShadow>
      <planeGeometry args={[width, depth]} />
    </mesh>
  );
}
