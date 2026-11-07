// Messages between the page (StudyCanvas) and the scene worker (study.worker).
// Kept free of three.js imports so the page bundle stays small.

import type { RoomShelf } from "./Room";

/** Phones get a lighter scene; must match on both sides of the worker. */
export const COMPACT_BELOW = 768;
export const dprRange = (compact: boolean): [number, number] => (compact ? [1, 1.5] : [1, 1.75]);

/** A @font-face rule, re-registered in the worker (workers don't share the page's fonts). */
export type FontFaceSpec = { family: string; source: string; descriptors: FontFaceDescriptors };

/** The subset of a DOM event the scene's handlers (R3F, OrbitControls) read. */
export type ForwardedEvent = {
  type: string;
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  deltaX: number;
  deltaY: number;
  deltaMode: number;
};

export type Size = { width: number; height: number; top: number; left: number; dpr: number };

export type ProbeResult = {
  canvas: [number, number];
  calls: number;
  tris: number;
  textures: number;
  books: number;
  /** An eye-level book near the middle of the frame, in CSS pixels. */
  target: { x: number; y: number } | null;
};

export type ToWorker =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      size: Size;
      compact: boolean;
      reducedMotion: boolean;
      fontFamily: string;
      faces: FontFaceSpec[];
      shelves: RoomShelf[];
      pulledId: string | null;
    }
  | { type: "props"; shelves: RoomShelf[]; pulledId: string | null }
  | { type: "resize"; size: Size }
  | { type: "event"; event: ForwardedEvent }
  | { type: "cover"; url: string; bitmap: ImageBitmap | null }
  | { type: "probe"; id: number };

export type FromWorker =
  | { type: "frame" }
  | { type: "fail"; reason: string }
  | { type: "click"; id: string }
  | { type: "hover"; id: string | null }
  | { type: "missed" }
  | { type: "cursor"; value: string }
  | { type: "cover"; url: string }
  | { type: "probe"; id: number; result: ProbeResult };
