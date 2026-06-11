import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CameraTarget = {
  position: [number, number, number];
  lookAt: [number, number, number];
} | null;

const RESET_POS: [number, number, number] = [3.4, 1.85, 3.6];
const RESET_LOOK: [number, number, number] = [0, 1.5, -3];

export default function CameraRig({
  focus,
  controlsRef,
}: {
  focus: CameraTarget;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const wantPos = useRef(new THREE.Vector3(...RESET_POS));
  const wantLook = useRef(new THREE.Vector3(...RESET_LOOK));
  const animating = useRef(false);

  useEffect(() => {
    if (focus) {
      wantPos.current.set(...focus.position);
      wantLook.current.set(...focus.lookAt);
      animating.current = true;
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      wantPos.current.set(...RESET_POS);
      wantLook.current.set(...RESET_LOOK);
      animating.current = true;
      // re-enable orbit a moment later
      setTimeout(() => {
        if (controlsRef.current) controlsRef.current.enabled = true;
      }, 600);
    }
  }, [focus, controlsRef]);

  useFrame((_, delta) => {
    if (!animating.current) return;
    const k = 1 - Math.exp(-delta * 4.5);
    camera.position.lerp(wantPos.current, k);
    if (controlsRef.current?.target) {
      controlsRef.current.target.lerp(wantLook.current, k);
      controlsRef.current.update?.();
    } else {
      camera.lookAt(wantLook.current);
    }
    if (camera.position.distanceTo(wantPos.current) < 0.02) {
      animating.current = false;
    }
  });

  return null;
}
