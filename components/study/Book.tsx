import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { getPagesTexture, getSpineTexture } from "./spineTexture";

export type BookData = {
  id: number;
  title: string;
  authors: string[];
  spineColor: string;
  thickness: number; // x
  height: number; // y
  depth: number; // z
};

const PULL_DISTANCE = 0.32;
const PULL_LIFT = 0.04;
const TILT = 0.18;
const HOVER_LIFT = 0.05;

export default function Book({
  data,
  position,
  pulled,
  onClick,
}: {
  data: BookData;
  position: [number, number, number];
  pulled: boolean;
  onClick: (id: number, mesh: THREE.Mesh) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Key on the first author's name, not the array identity — SWR revalidation
  // produces fresh arrays with identical contents.
  const author = data.authors[0] ?? "";
  const materials = useMemo(() => {
    const spineTex = getSpineTexture({
      title: data.title,
      author,
      color: data.spineColor,
      width: data.thickness,
      height: data.height,
    });
    const pages = getPagesTexture();
    const coverColor = new THREE.Color(data.spineColor)
      .clone()
      .multiplyScalar(0.85);
    const coverMat = new THREE.MeshStandardMaterial({
      color: coverColor,
      roughness: 0.7,
    });
    const pagesMat = new THREE.MeshStandardMaterial({
      map: pages,
      roughness: 0.95,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.7,
    });
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    return [coverMat, coverMat, pagesMat, pagesMat, spineMat, pagesMat];
  }, [data.title, author, data.spineColor, data.thickness, data.height]);

  // Dispose replaced/unmounted materials (textures live in a shared cache).
  useEffect(() => {
    return () => {
      for (const m of new Set(materials)) m.dispose();
    };
  }, [materials]);

  // base position is the shelved position
  const base = position;
  // target offset from base
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const tilt = useRef(0);
  const scale = useRef(1);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const wantZ = pulled ? PULL_DISTANCE : hovered ? 0.04 : 0;
    const wantY = pulled ? PULL_LIFT : hovered ? HOVER_LIFT : 0;
    const wantTilt = pulled ? -TILT : 0;
    const wantScale = pulled ? 1.0 : hovered ? 1.04 : 1.0;

    const k = 1 - Math.exp(-delta * 9);
    target.current.z += (wantZ - target.current.z) * k;
    target.current.y += (wantY - target.current.y) * k;
    tilt.current += (wantTilt - tilt.current) * k;
    scale.current += (wantScale - scale.current) * k;

    ref.current.position.set(
      base[0],
      base[1] + target.current.y,
      base[2] + target.current.z
    );
    ref.current.rotation.x = tilt.current;
    ref.current.scale.setScalar(scale.current);

    // emissive feedback on hover
    const mats = ref.current.material as THREE.MeshStandardMaterial[];
    const emissive = hovered && !pulled ? 0.18 : 0;
    for (const m of mats) {
      if (m.emissive) {
        m.emissive.setRGB(emissive, emissive * 0.7, emissive * 0.4);
      }
    }
  });

  return (
    <mesh
      ref={ref}
      position={base}
      castShadow
      receiveShadow
      material={materials}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (ref.current) onClick(data.id, ref.current);
      }}
    >
      <boxGeometry args={[data.thickness, data.height, data.depth]} />
    </mesh>
  );
}
