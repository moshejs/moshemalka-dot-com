import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Floor from "./Floor";
import Walls from "./Walls";
import Bookshelf, { type ShelfRow } from "./Bookshelf";
import { Chair, Desk, Globe, Lamp, PictureFrame, Rug } from "./Furniture";
import CameraRig, { type CameraTarget } from "./CameraRig";
import type { BookData } from "./Book";

const ROOM_W = 12;
const ROOM_D = 9;
const ROOM_H = 4;

const SHELF_BACK_Z = -ROOM_D / 2 + 0.32; // shelf depth ~0.55, leave clearance
const ROW_HEIGHT = 0.78; // plank-top to plank-top; max book height ~0.65 + plank
const FIRST_ROW_Y = 0.25; // plank top of the bottom row

export type RoomProps = {
  shelves: { id: number | null; label: string; books: BookData[] }[];
  pulledId: number | null;
  onBookClick: (id: number, world: THREE.Vector3) => void;
  onBackgroundClick: () => void;
};

export default function Room({
  shelves,
  pulledId,
  onBookClick,
  onBackgroundClick,
}: RoomProps) {
  const controlsRef = useRef<any>(null);
  const [focus, setFocus] = useState<CameraTarget>(null);

  // The detail panel can close without a canvas click (ESC, close button) —
  // make sure the camera always returns home when nothing is pulled.
  useEffect(() => {
    if (pulledId === null) setFocus(null);
  }, [pulledId]);

  const rows: ShelfRow[] = useMemo(() => {
    return shelves.map((s, i) => ({
      id: s.id ?? -1,
      label: s.label,
      y: FIRST_ROW_Y + i * ROW_HEIGHT,
      books: s.books,
    }));
  }, [shelves]);

  const totalShelfHeight = Math.max(
    FIRST_ROW_Y + ROW_HEIGHT * Math.max(rows.length, 1),
    1.4
  );

  function handleClick(id: number, mesh: THREE.Mesh) {
    const world = new THREE.Vector3();
    mesh.getWorldPosition(world);
    onBookClick(id, world);
    // pull the camera in a bit
    setFocus({
      position: [world.x * 0.4, world.y + 0.25, world.z + 1.8],
      lookAt: [world.x, world.y, world.z],
    });
  }

  function handleBackground() {
    setFocus(null);
    onBackgroundClick();
  }

  return (
    <Canvas
      shadows
      camera={{ position: [3.4, 1.85, 3.6], fov: 50, near: 0.1, far: 100 }}
      onPointerMissed={handleBackground}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={(state) => {
        // Dev escape hatch: lets tooling drive frames when rAF is throttled.
        (window as unknown as Record<string, unknown>).__studyState = state;
      }}
    >
      <color attach="background" args={["#0e0905"]} />
      <fog attach="fog" args={["#140d07", 14, 30]} />

      {/* Lighting — three r184 uses physical light units; values tuned for ACES */}
      <ambientLight intensity={0.85} color="#f3d6a8" />
      <hemisphereLight
        args={["#f3d6a8", "#2a1a0e", 0.9]}
        position={[0, 5, 0]}
      />
      {/* soft warm fill from the room's heart */}
      <pointLight
        position={[0, 2.6, 0.5]}
        intensity={14}
        distance={12}
        decay={2}
        color="#ffd9a8"
      />
      {/* sun-through-window key */}
      <directionalLight
        position={[-4, 4, 3]}
        intensity={3.2}
        color="#ffd9a8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-2}
      />

      <Floor width={ROOM_W} depth={ROOM_D} />
      <Walls width={ROOM_W} depth={ROOM_D} height={ROOM_H} />

      <Bookshelf
        position={[0, 0, SHELF_BACK_Z]}
        totalHeight={totalShelfHeight}
        rows={rows}
        pulledId={pulledId}
        onBookClick={handleClick}
      />

      {/* Right side: desk, chair, lamp */}
      <Desk position={[ROOM_W / 2 - 1.0, 0, -1.0]} rotationY={-Math.PI / 2} />
      <Lamp position={[ROOM_W / 2 - 1.0, 0.81, -1.4]} />
      <Chair position={[ROOM_W / 2 - 2.0, 0, -1.0]} rotationY={-Math.PI / 2} />

      {/* Left side: picture, globe on small table-ish area */}
      <PictureFrame
        position={[-ROOM_W / 2 + 0.05, 2.0, -1.0]}
        rotationY={Math.PI / 2}
      />
      <Globe position={[-ROOM_W / 2 + 0.6, 0, 1.5]} />

      {/* Reading nook rug under the chair */}
      <Rug position={[ROOM_W / 2 - 2.2, 0, -1.2]} width={2.4} depth={1.8} />

      {/* Center rug */}
      <Rug position={[0, 0, 1.4]} width={3.6} depth={2.4} />

      <CameraRig focus={focus} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        target={[0, 1.5, -3]}
        enablePan={false}
        minDistance={2.2}
        maxDistance={7}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.05}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
