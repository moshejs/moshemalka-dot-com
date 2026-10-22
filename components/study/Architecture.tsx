import { useMemo } from "react";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import { darkWalnut, duskMaterial, floorMaterial, walnut, wallpaperMaterial } from "./materials";

// The room's shell: floor, panelled walls, beamed ceiling, and the dusk window
// on the right wall that's the scene's key light.

export const ROOM = { W: 12, D: 9, H: 4 };
export const WINDOW = { z: -1.0, y0: 1.2, y1: 3.25, width: 1.7 };

const WAINSCOT = 1.05;
const plaster = new THREE.MeshStandardMaterial({ color: "#2a1e15", roughness: 0.95 });

/** One wall in its own frame: spans x ∈ [−len/2, len/2], faces +z, base at y = 0. */
function Wall({
  len,
  position,
  rotationY,
  hole,
}: {
  len: number;
  position: [number, number, number];
  rotationY: number;
  hole?: { x: number; y0: number; y1: number; w: number };
}) {
  const { H } = ROOM;
  const paper = wallpaperMaterial([len / 1.4, (H - WAINSCOT) / 1.4]);
  const wood = walnut();
  const dark = darkWalnut();

  // Wallpaper field, split around the window opening if there is one.
  const fields: [number, number, number, number][] = []; // cx, cy, w, h
  const top = H - 0.2;
  if (!hole) fields.push([0, (WAINSCOT + top) / 2, len, top - WAINSCOT]);
  else {
    const l = hole.x - hole.w / 2, r = hole.x + hole.w / 2;
    fields.push([(-len / 2 + l) / 2, (WAINSCOT + top) / 2, l + len / 2, top - WAINSCOT]);
    fields.push([(r + len / 2) / 2, (WAINSCOT + top) / 2, len / 2 - r, top - WAINSCOT]);
    fields.push([hole.x, (hole.y1 + top) / 2, hole.w, top - hole.y1]);
    fields.push([hole.x, (WAINSCOT + hole.y0) / 2, hole.w, hole.y0 - WAINSCOT]);
  }

  // Raised wainscot panels at a steady rhythm.
  const panelW = 0.9;
  const count = Math.floor((len - 0.2) / (panelW + 0.12));
  const start = -((count - 1) * (panelW + 0.12)) / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {fields.map(([cx, cy, w, h], i) => (
        <mesh key={i} material={paper} receiveShadow castShadow position={[cx, cy, -0.05]}>
          <boxGeometry args={[w, h, 0.1]} />
        </mesh>
      ))}
      {/* wainscot backing + raised panels */}
      <mesh material={dark} receiveShadow castShadow position={[0, WAINSCOT / 2, -0.04]}>
        <boxGeometry args={[len, WAINSCOT, 0.08]} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} material={wood} receiveShadow position={[start + i * (panelW + 0.12), WAINSCOT * 0.5 + 0.05, 0.005]}>
          <boxGeometry args={[panelW, WAINSCOT - 0.42, 0.02]} />
        </mesh>
      ))}
      {/* chair rail, baseboard, crown */}
      <mesh material={wood} castShadow receiveShadow position={[0, WAINSCOT, 0.015]}>
        <boxGeometry args={[len, 0.06, 0.05]} />
      </mesh>
      <mesh material={dark} receiveShadow position={[0, 0.08, 0.02]}>
        <boxGeometry args={[len, 0.16, 0.04]} />
      </mesh>
      <mesh material={wood} castShadow receiveShadow position={[0, H - 0.1, 0.03]}>
        <boxGeometry args={[len, 0.2, 0.08]} />
      </mesh>
      <mesh material={dark} position={[0, H - 0.215, 0.05]}>
        <boxGeometry args={[len, 0.03, 0.06]} />
      </mesh>
    </group>
  );
}

/** Heavy velvet drape: a plane with deep vertical folds. */
function Drape({ position, width, height }: { position: [number, number, number]; width: number; height: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 48, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const gather = 0.6 + 0.4 * ((y + height / 2) / height); // folds deepen toward the hem
      p.setZ(i, Math.sin((x / width) * Math.PI * 9) * 0.035 * gather);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height]);
  return (
    <mesh geometry={geo} position={position} castShadow receiveShadow>
      <meshStandardMaterial color="#4a1418" roughness={0.88} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A soft additive beam of light, fading along its length and at its edges. */
function LightShaft({ from, to, width }: { from: THREE.Vector3; to: THREE.Vector3; width: number }) {
  const { mat, len, quat, mid } = useMemo(() => {
    const dir = to.clone().sub(from);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color("#ffb46a") }, uStrength: { value: 0.16 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
        void main(){
          float along = smoothstep(0.0, 0.15, vUv.y) * (0.35 + 0.65 * vUv.y);
          float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
          gl_FragColor = vec4(uColor * uStrength * along * edge, 1.0);
        }`,
    });
    return { mat, len, quat, mid };
  }, [from, to]);
  return (
    <group position={mid} quaternion={quat}>
      {/* two crossed planes read as a volume from any angle */}
      <mesh material={mat}>
        <planeGeometry args={[width, len]} />
      </mesh>
      <mesh material={mat} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[width * 0.8, len]} />
      </mesh>
    </group>
  );
}

export default function Architecture({ dust = true }: { dust?: boolean }) {
  const { W, D, H } = ROOM;
  const wood = walnut();
  const dark = darkWalnut();
  const winX = W / 2;
  const { z: wz, y0, y1, width: ww } = WINDOW;

  const shaft = useMemo(
    () => ({
      from: new THREE.Vector3(winX - 0.05, (y0 + y1) / 2 + 0.2, wz),
      to: new THREE.Vector3(winX - 3.4, 0.02, wz + 0.5),
    }),
    [winX, y0, y1, wz]
  );

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial()}>
        <planeGeometry args={[W, D]} />
      </mesh>

      <Wall len={W} position={[0, 0, -D / 2]} rotationY={0} />
      <Wall len={W} position={[0, 0, D / 2]} rotationY={Math.PI} />
      <Wall len={D} position={[-W / 2, 0, 0]} rotationY={Math.PI / 2} />
      {/* right wall: rotating by −90° sends local +x to world +z, so hole x = window z */}
      <Wall
        len={D}
        position={[W / 2, 0, 0]}
        rotationY={-Math.PI / 2}
        hole={{ x: wz, y0, y1, w: ww }}
      />

      {/* ceiling + beams */}
      <mesh material={plaster} position={[0, H + 0.05, 0]} receiveShadow>
        <boxGeometry args={[W, 0.1, D]} />
      </mesh>
      {[-3, -1.2, 0.6, 2.4].map((z) => (
        <mesh key={z} material={wood} castShadow receiveShadow position={[0, H - 0.11, z]}>
          <boxGeometry args={[W, 0.22, 0.24]} />
        </mesh>
      ))}

      {/* window: dusk outside, walnut frame and mullions, sill */}
      <mesh material={duskMaterial()} position={[winX + 0.25, (y0 + y1) / 2, wz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ww + 0.4, y1 - y0 + 0.4]} />
      </mesh>
      <group position={[winX - 0.02, 0, wz]}>
        {/* frame */}
        {[
          [0, y1 + 0.04, ww + 0.16, 0.08],
          [0, y0 - 0.04, ww + 0.16, 0.08],
        ].map(([zz, y, w, h], i) => (
          <mesh key={i} material={wood} castShadow position={[0, y, zz]}>
            <boxGeometry args={[0.14, h, w]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} material={wood} castShadow position={[0, (y0 + y1) / 2, s * (ww / 2 + 0.04)]}>
            <boxGeometry args={[0.14, y1 - y0 + 0.16, 0.08]} />
          </mesh>
        ))}
        {/* mullions: two uprights, one transom */}
        {[-ww / 6, ww / 6].map((zz) => (
          <mesh key={zz} material={dark} castShadow position={[0.02, (y0 + y1) / 2, zz]}>
            <boxGeometry args={[0.05, y1 - y0, 0.035]} />
          </mesh>
        ))}
        <mesh material={dark} castShadow position={[0.02, y0 + (y1 - y0) * 0.62, 0]}>
          <boxGeometry args={[0.05, 0.035, ww]} />
        </mesh>
        {/* deep sill */}
        <mesh material={wood} castShadow receiveShadow position={[-0.12, y0 - 0.09, 0]}>
          <boxGeometry args={[0.3, 0.05, ww + 0.3]} />
        </mesh>
      </group>
      <Drape position={[winX - 0.16, (y0 + H) / 2 - 0.25, wz - ww / 2 - 0.32]} width={0.62} height={H - 0.55} />
      <Drape position={[winX - 0.16, (y0 + H) / 2 - 0.25, wz + ww / 2 + 0.32]} width={0.62} height={H - 0.55} />
      {/* drape pole */}
      <mesh position={[winX - 0.2, H - 0.35, wz]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, ww + 1.6, 12]} />
        <meshStandardMaterial color="#b08a45" metalness={1} roughness={0.35} />
      </mesh>

      <LightShaft from={shaft.from} to={shaft.to} width={1.3} />
      {dust && (
        <Sparkles
          count={70}
          scale={[2.6, 2.4, 1.6]}
          position={[winX - 1.6, 1.4, wz + 0.25]}
          size={1.6}
          speed={0.18}
          opacity={0.55}
          color="#ffd7a0"
          noise={0.6}
        />
      )}
    </group>
  );
}
