import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";
import Architecture, { ROOM, WINDOW } from "./Architecture";
import Bookshelf, { FIRST_ROW_Y, INSET, ROW_HEIGHT, ROWS_PER_CASE, bayWidth, type Slot } from "./Bookshelf";
import { Armchair, BankersLamp, Desk, FloorGlobe, OpenBook, Painting, Rug, SideTable } from "./Furniture";
import CameraRig, { REST, type CameraTarget } from "./CameraRig";
import { setTextureFont } from "./spineTexture";
import type { BookData, PullInfo } from "./Book";

const { W, D } = ROOM;

// Bookcases fill in order; the left-wall case appears once the back one is full.
const CASES = [
  {
    key: "back",
    position: [0, 0, -D / 2 + 0.36] as [number, number, number],
    rotationY: 0,
    innerWidth: 10.0,
    bays: 5,
  },
  {
    key: "left",
    position: [-W / 2 + 0.36, 0, -0.4] as [number, number, number],
    rotationY: Math.PI / 2, // spines face +x, into the room
    innerWidth: 6.4,
    bays: 3,
  },
];

// Eye-level rows first: that's where people browse. Top and bottom hold décor
// until the library outgrows the middle.
const ROW_ORDER = [1, 2, 0, 3];

export type RoomShelf = { id: string; label: string; books: BookData[] };

/** Pack shelves into bays: each named shelf starts a fresh bay; books never cross an upright. */
function pack(shelves: RoomShelf[]) {
  const order: { c: number; row: number; bay: number; cap: number }[] = [];
  CASES.forEach((c, ci) => {
    const cap = bayWidth(c.innerWidth, c.bays) - INSET - 0.03;
    for (const row of ROW_ORDER) for (let bay = 0; bay < c.bays; bay++) order.push({ c: ci, row, bay, cap });
  });
  const slots: Slot[][] = CASES.map(() => []);
  let i = 0;
  let overflow = 0;
  for (const shelf of shelves) {
    let cur: Slot | null = null;
    let used = 0;
    let first = true;
    for (const b of shelf.books) {
      if (!cur || used + b.thickness > order[i - 1].cap) {
        if (i >= order.length) {
          overflow++;
          continue;
        }
        const o = order[i++];
        cur = { row: o.row, bay: o.bay, books: [], label: first && shelf.id !== "stacks" ? shelf.label : undefined };
        first = false;
        slots[o.c].push(cur);
        used = 0;
      }
      cur.books.push(b);
      used += b.thickness;
    }
  }
  if (overflow) console.warn(`[study] ${overflow} books don't fit the room yet`);
  return slots;
}

/** A brass picture light over each bay — the shelves' own reading light. */
function BayLight({ x, y, z }: { x: number; y: number; z: number }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <group>
      <primitive object={target} position={[x, y - 1.5, z - 0.35]} />
      <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.5, 16]} />
        <meshStandardMaterial color="#c9a04e" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[x, y - 0.018, z + 0.004]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.44, 8]} />
        <meshBasicMaterial color="#ffe2b0" toneMapped={false} />
      </mesh>
      <spotLight
        position={[x, y - 0.02, z]}
        target={target}
        angle={0.62}
        penumbra={0.85}
        intensity={7}
        distance={3.4}
        decay={2}
        color="#ffd29a"
      />
    </group>
  );
}

export default function Room({
  shelves,
  pulledId,
  onBookClick,
  onBackgroundClick,
  onBookHover,
  fontFamily,
}: {
  shelves: RoomShelf[];
  pulledId: string | null;
  onBookClick: (id: string) => void;
  onBackgroundClick: () => void;
  onBookHover: (id: string | null) => void;
  fontFamily: string;
}) {
  const controlsRef = useRef<any>(null);
  const [focus, setFocus] = useState<CameraTarget>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const compact = useMemo(() => typeof window !== "undefined" && window.innerWidth < 768, []);
  const poses = useRef<Map<string, () => PullInfo>>(new Map());

  // Spines are drawn into canvases — wait for Garamond so they never bake a fallback face.
  useEffect(() => {
    setTextureFont(fontFamily);
    Promise.all([
      document.fonts.load(`600 40px ${fontFamily}`),
      document.fonts.load(`italic 500 20px ${fontFamily}`),
    ])
      .catch(() => null)
      .finally(() => setFontsReady(true));
  }, [fontFamily]);

  const caseSlots = useMemo(() => pack(shelves), [shelves]);
  const leftCaseInUse = caseSlots[1].length > 0;

  function frame(info: PullInfo): CameraTarget {
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, info.facing).normalize();
    // Desktop: book sits left of centre, clear of the catalog card on the right.
    // Phone: card is a bottom sheet, so the book sits high in the frame.
    const shift = compact ? up.clone().multiplyScalar(-0.36) : right.clone().multiplyScalar(0.3);
    const dist = compact ? 1.7 : 1.2;
    return {
      position: info.held.clone().addScaledVector(info.facing, dist).add(shift).add(new THREE.Vector3(0, 0.04, 0)),
      lookAt: info.held.clone().add(shift),
    };
  }

  // Keep the camera on whichever book is out — including ←/→ stepping from the card.
  useEffect(() => {
    if (!pulledId) return setFocus(null);
    const pose = poses.current.get(pulledId);
    if (pose) setFocus(frame(pose()));
  }, [pulledId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable identity so books don't re-register every render.
  const registerPose = useMemo(() => {
    const m = poses.current;
    return (id: string, pose: () => PullInfo) => void m.set(id, pose);
  }, []);

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={compact ? [1, 1.5] : [1, 1.75]}
      camera={{ position: REST.position.toArray(), fov: compact ? 54 : 48, near: 0.05, far: 60 }}
      gl={{ antialias: !compact, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={(e) => {
        if ((e as MouseEvent).type === "click") onBackgroundClick();
      }}
      onCreated={(state) => {
        // Dev hook for the headless verification harness (scripts/study-shot.mjs).
        (window as unknown as Record<string, unknown>).__studyState = state;
      }}
    >
      <color attach="background" args={["#0b0704"]} />
      <fog attach="fog" args={["#120b06", 9, 22]} />

      {/* Reflections: a baked environment of soft light panels — no HDR download. */}
      <Environment resolution={128} environmentIntensity={0.55} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffb070" position={[6, 2.2, -1]} rotation-y={-Math.PI / 2} scale={[1.8, 2.2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffd7a8" position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#ffc88a" position={[5, 1.2, -0.6]} scale={0.6} />
        <Lightformer form="rect" intensity={0.25} color="#3a5a4a" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[9, 3, 1]} />
      </Environment>

      {/* phones skip the bay spotlights, so they get a brighter base */}
      <ambientLight intensity={compact ? 0.42 : 0.16} color="#f3d6a8" />
      <hemisphereLight args={["#f6dcb0", "#1a0f08", compact ? 0.7 : 0.32]} />
      {/* low dusk sun through the window — the scene's key, casting mullion shadows */}
      <directionalLight
        position={[W / 2 + 4, 4.6, WINDOW.z - 0.6]}
        intensity={3.4}
        color="#ffae66"
        castShadow
        shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      {/* faint warm fill so corners keep detail */}
      <pointLight position={[0, 3.3, 1]} intensity={2.4} distance={11} decay={2} color="#ffcf9a" />

      <Architecture dust={!compact} />

      {CASES.map((c, i) =>
        i === 0 || caseSlots[i].length ? (
          <group key={c.key}>
            {fontsReady && (
              <Bookshelf
                position={c.position}
                rotationY={c.rotationY}
                innerWidth={c.innerWidth}
                bays={c.bays}
                slots={caseSlots[i]}
                pulledId={pulledId}
                onBookClick={onBookClick}
                onBookHover={onBookHover}
                registerPose={registerPose}
                candles={i === 0}
              />
            )}
            {/* picture lights over the back case's bays */}
            {i === 0 &&
              !compact &&
              Array.from({ length: c.bays }, (_, b) => {
                const bw = bayWidth(c.innerWidth, c.bays);
                const x = -c.innerWidth / 2 + b * (bw + 0.06) + bw / 2;
                return (
                  <BayLight
                    key={b}
                    x={x}
                    y={FIRST_ROW_Y + ROW_HEIGHT * ROWS_PER_CASE + 0.02}
                    z={c.position[2] + 0.42}
                  />
                );
              })}
          </group>
        ) : null
      )}

      {/* writing desk under the window */}
      <Desk position={[W / 2 - 0.55, 0, WINDOW.z]} rotationY={-Math.PI / 2} />
      <BankersLamp position={[W / 2 - 0.4, 0.78, WINDOW.z + 0.48]} rotationY={-Math.PI / 2} shadows={!compact} />
      <OpenBook position={[W / 2 - 0.62, 0.78, WINDOW.z - 0.18]} rotationY={-Math.PI / 2 + 0.12} />

      {/* reading corner */}
      <Rug position={[-1.4, 0, 0.6]} width={4.2} depth={3.0} />
      <Armchair position={[-2.5, 0, 0.55]} rotationY={Math.PI - 0.5} />
      <SideTable position={[-3.35, 0, -0.25]} />
      <FloorGlobe position={[-4.75, 0, 2.7]} />
      {!leftCaseInUse && <Painting position={[-W / 2 + 0.06, 2.15, -0.6]} rotationY={Math.PI / 2} />}

      <CameraRig focus={focus} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        target={REST.lookAt.toArray()}
        enablePan={false}
        rotateSpeed={0.45}
        zoomSpeed={0.6}
        minDistance={2.2}
        maxDistance={8.4}
        minPolarAngle={Math.PI / 3.1}
        maxPolarAngle={Math.PI / 1.93}
        minAzimuthAngle={-1.0}
        maxAzimuthAngle={1.0}
        enableDamping
        dampingFactor={0.07}
      />

      <EffectComposer multisampling={compact ? 0 : 4} enableNormalPass={false}>
        {!compact ? <N8AO aoRadius={0.45} intensity={2.4} distanceFalloff={0.8} quality="medium" /> : <></>}
        <Bloom intensity={0.55} luminanceThreshold={0.86} luminanceSmoothing={0.15} mipmapBlur />
        <Noise opacity={0.028} premultiply />
        <Vignette offset={0.28} darkness={0.62} />
      </EffectComposer>
    </Canvas>
  );
}
