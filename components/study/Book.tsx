import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  getGeneratedCover,
  getPagesTexture,
  getSpineMaps,
  type Binding,
} from "./spineTexture";

export type BookData = {
  id: string;
  title: string;
  authors: string[];
  spineColor: string;
  coverUrl?: string;
  binding: Binding;
  thickness: number; // x
  height: number; // y
  depth: number; // z
};

/** Where a taken-down book is held, in its bookcase's local space. */
export const HELD_Y = 1.42;
export const HELD_Z = 1.05;

export type PullInfo = {
  held: THREE.Vector3; // world position the book travels to
  facing: THREE.Vector3; // world direction its spine faced on the shelf
};

const BOARD = 0.006; // cover board thickness
const LIP = 0.008; // board overhang past the page block
const SPINE = 0.01;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

const coverLoader = new THREE.TextureLoader();
coverLoader.setCrossOrigin("anonymous");
const COVERS = new Map<string, Promise<THREE.Texture | null>>();

function loadCover(url: string) {
  let p = COVERS.get(url);
  if (!p) {
    // ?default=false makes Open Library 404 instead of returning a 1×1 blank.
    const src = url.includes("openlibrary") ? `${url}?default=false` : url;
    p = coverLoader
      .loadAsync(src)
      .then((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      })
      .catch(() => null);
    COVERS.set(url, p);
  }
  return p;
}

export default function Book({
  data,
  position,
  pulled,
  onClick,
  onHover,
  register,
}: {
  data: BookData;
  position: [number, number, number];
  pulled: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Lets the room frame any book (e.g. ←/→ from the card) without a click. */
  register: (id: string, pose: () => PullInfo) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { thickness: T, height: H, depth: D, binding } = data;
  const author = data.authors[0] ?? "";

  const mats = useMemo(() => {
    const spine = getSpineMaps({
      id: data.id,
      title: data.title,
      author,
      color: data.spineColor,
      binding,
      width: T,
      height: H,
    });
    const cloth = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.spineColor).multiplyScalar(0.92),
      roughness: binding === "hard" ? 0.78 : 0.62,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      map: spine.map,
      roughnessMap: spine.rm,
      metalnessMap: spine.rm,
      roughness: 1,
      metalness: 1,
    });
    const cover = new THREE.MeshStandardMaterial({
      map: getGeneratedCover({
        id: data.id,
        title: data.title,
        author,
        color: data.spineColor,
        binding,
        aspect: D / H,
      }),
      roughness: binding === "hard" ? 0.7 : 0.45,
    });
    const pages = new THREE.MeshStandardMaterial({ map: getPagesTexture(), roughness: 0.92 });
    return { cloth, spineMat, cover, pages };
  }, [data.id, data.title, author, data.spineColor, binding, T, H, D]);

  useEffect(
    () => () => {
      for (const m of Object.values(mats)) m.dispose();
    },
    [mats]
  );

  // Swap in the real cover the first time this book is taken down.
  useEffect(() => {
    if (!pulled || !data.coverUrl) return;
    let alive = true;
    loadCover(data.coverUrl).then((t) => {
      if (!alive || !t) return;
      mats.cover.map = t;
      mats.cover.needsUpdate = true;
    });
    return () => {
      alive = false;
    };
  }, [pulled, data.coverUrl, mats]);

  // Face material arrays (BoxGeometry order: +x, −x, +y, −y, +z, −z).
  const faces = useMemo(() => {
    const { cloth, spineMat, cover, pages } = mats;
    return binding === "hard"
      ? {
          front: [cover, cloth, cloth, cloth, cloth, cloth],
          back: [cloth, cloth, cloth, cloth, cloth, cloth],
          spine: [cloth, cloth, cloth, cloth, spineMat, cloth],
          block: [pages, pages, pages, pages, pages, pages],
        }
      : { whole: [cover, cloth, pages, pages, spineMat, pages] };
  }, [mats, binding]);

  const p = useRef(0); // 0 = shelved, 1 = held
  const hover = useRef(0);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    // Critically-damped approach toward the target pose.
    const k = 1 - Math.exp(-delta * (pulled ? 3.2 : 4.4));
    p.current += ((pulled ? 1 : 0) - p.current) * k;
    hover.current += ((hovered && !pulled ? 1 : 0) - hover.current) * (1 - Math.exp(-delta * 12));

    const slide = easeInOut(clamp01(p.current / 0.42)); // beat 1: out of the row
    const present = easeInOut(clamp01((p.current - 0.32) / 0.68)); // beat 2: into the hand

    const [x0, y0, z0] = position;
    const slidZ = z0 + slide * (D * 0.95) + hover.current * 0.035;
    g.position.set(
      x0,
      THREE.MathUtils.lerp(y0 + hover.current * 0.012, HELD_Y, present),
      THREE.MathUtils.lerp(slidZ, HELD_Z, present)
    );
    const sway = present * Math.sin(state.clock.elapsedTime * 0.9) * 0.025;
    g.rotation.set(-0.07 * present, -Math.PI / 2 * present + sway, 0);
  });

  // Evaluated lazily, after the first frame has settled world matrices.
  useEffect(() => {
    register(data.id, () => {
      const parent = ref.current!.parent!;
      parent.updateWorldMatrix(true, false);
      const held = parent.localToWorld(new THREE.Vector3(position[0], HELD_Y, HELD_Z));
      const q = parent.getWorldQuaternion(new THREE.Quaternion());
      return { held, facing: new THREE.Vector3(0, 0, 1).applyQuaternion(q) };
    });
  }, [data.id, position, register]);

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      onHover(data.id);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      setHovered(false);
      onHover(null);
      document.body.style.cursor = "";
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > 4) return; // that was an orbit drag, not a pick
      onClick(data.id);
    },
  };

  if (binding === "paper") {
    return (
      <group ref={ref} position={position} {...handlers}>
        <mesh castShadow receiveShadow material={faces.whole}>
          <boxGeometry args={[T, H, D]} />
        </mesh>
      </group>
    );
  }

  const blockW = T - 2 * BOARD;
  const blockH = H - 2 * LIP;
  const blockD = D - SPINE - LIP;
  // Boards stop behind the spine so their edges never z-fight its face.
  const boardD = D - SPINE;
  return (
    <group ref={ref} position={position} {...handlers}>
      <mesh castShadow receiveShadow material={faces.front} position={[T / 2 - BOARD / 2, 0, -SPINE / 2]}>
        <boxGeometry args={[BOARD, H, boardD]} />
      </mesh>
      <mesh castShadow receiveShadow material={faces.back} position={[-T / 2 + BOARD / 2, 0, -SPINE / 2]}>
        <boxGeometry args={[BOARD, H, boardD]} />
      </mesh>
      <mesh castShadow receiveShadow material={faces.spine} position={[0, 0, D / 2 - SPINE / 2]}>
        <boxGeometry args={[T, H, SPINE]} />
      </mesh>
      <mesh receiveShadow material={faces.block} position={[0, 0, D / 2 - SPINE - blockD / 2]}>
        <boxGeometry args={[blockW, blockH, blockD]} />
      </mesh>
    </group>
  );
}
