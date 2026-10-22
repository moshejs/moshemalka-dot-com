import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type CameraTarget = { position: THREE.Vector3; lookAt: THREE.Vector3 } | null;

export const REST = {
  position: new THREE.Vector3(3.3, 1.74, 3.3),
  lookAt: new THREE.Vector3(-0.8, 1.28, -3.2),
};
const INTRO_FROM = new THREE.Vector3(4.4, 2.15, 4.25);

/**
 * Owns the camera whenever it's travelling: the arrival dolly, flying in to a
 * taken-down book, and returning home. Orbit control is handed back only once
 * the camera has come to rest.
 */
export default function CameraRig({
  focus,
  controlsRef,
}: {
  focus: CameraTarget;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const wantPos = useRef(REST.position.clone());
  const wantLook = useRef(REST.lookAt.clone());
  const travelling = useRef(true);
  const speed = useRef(1.6);

  useEffect(() => {
    const target = focus ?? REST;
    wantPos.current.copy(target.position);
    wantLook.current.copy(target.lookAt);
    travelling.current = true;
    speed.current = focus ? 2.6 : 2.2;
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [focus, controlsRef]);

  // Arrival (declared after the focus effect so its slower speed wins on
  // mount): start at the doorway unless the visitor prefers reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    camera.position.copy(reduce ? REST.position : INTRO_FROM);
    if (controlsRef.current) {
      controlsRef.current.target.copy(REST.lookAt);
      controlsRef.current.enabled = false;
    }
    travelling.current = true;
    speed.current = 1.35;
  }, [camera, controlsRef]);

  useFrame((_, delta) => {
    if (!travelling.current) return;
    const k = 1 - Math.exp(-delta * speed.current);
    camera.position.lerp(wantPos.current, k);
    const c = controlsRef.current;
    if (c?.target) {
      c.target.lerp(wantLook.current, k);
      c.update?.();
    } else camera.lookAt(wantLook.current);

    if (camera.position.distanceTo(wantPos.current) < 0.004) {
      travelling.current = false;
      // Hand orbit back only at rest — a held book stays framed.
      if (c && !focus) c.enabled = true;
    }
  });

  return null;
}
