/// <reference lib="webworker" />
// Renders the study on an OffscreenCanvas, off the main thread: three.js
// parsing, 121 lettered spine textures, shader compilation and every frame
// happen here, so the page stays responsive while the room boots.

import "./worker-globals";
import * as THREE from "three";
import { createElement } from "react";
import {
  _roots,
  createRoot,
  events as createPointerEvents,
  extend,
  type ReconcilerRoot,
  type RootState,
} from "@react-three/fiber";
import { Scene, canvasSettings, type RoomShelf } from "./Room";
import { setTextureFont } from "./spineTexture";
import { setHost } from "./host";
import type { ForwardedEvent, FromWorker, ProbeResult, Size, ToWorker } from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

extend(THREE as unknown as Parameters<typeof extend>[0]);

const post = (msg: FromWorker) => self.postMessage(msg);

type Listener = (e: unknown) => void;

/**
 * Stands in for the canvas element: R3F's pointer events and OrbitControls
 * attach listeners to it, read its size and capture pointers. The page
 * forwards real events, and captures pointers itself.
 */
class ElementProxy {
  private listeners = new Map<string, Set<Listener>>();
  style: Record<string, string> = {};
  width = 0;
  height = 0;
  left = 0;
  top = 0;

  get clientWidth() {
    return this.width;
  }
  get clientHeight() {
    return this.height;
  }
  get ownerDocument() {
    return this;
  }
  getRootNode() {
    return this;
  }
  getBoundingClientRect() {
    const { left, top, width, height } = this;
    return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height };
  }
  addEventListener(type: string, fn: Listener) {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    set.add(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatch(data: ForwardedEvent) {
    const set = this.listeners.get(data.type);
    if (!set?.size) return;
    const event = { ...data, target: this, currentTarget: this, preventDefault() {}, stopPropagation() {} };
    for (const fn of [...set]) fn(event);
  }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() {
    return false;
  }
  focus() {}
}

const proxy = new ElementProxy();
let root: ReconcilerRoot<OffscreenCanvas> | null = null;
let scene: {
  shelves: RoomShelf[];
  pulledId: string | null;
  compact: boolean;
  reducedMotion: boolean;
  fontsReady: boolean;
} | null = null;
let getState: (() => RootState) | null = null;
type RootConfig = NonNullable<Parameters<ReconcilerRoot<OffscreenCanvas>["configure"]>[0]>;
let config: RootConfig = {};

/** configure() takes the whole configuration each time; omitted keys reset (e.g. shadows turn off). */
function configure(size: Size) {
  return root!.configure({
    ...config,
    dpr: size.dpr,
    size: { width: size.width, height: size.height, top: size.top, left: size.left },
  });
}

const covers = new Map<string, (t: THREE.Texture | null) => void>();

setHost({
  setCursor: (value) => post({ type: "cursor", value }),
  // The page decodes covers (img-src allows the cover hosts) and hands over bitmaps.
  loadCover: (url) =>
    new Promise((resolve) => {
      covers.set(url, resolve);
      post({ type: "cover", url });
    }),
});

function render() {
  if (!root || !scene) return;
  root.render(
    createElement(Scene, {
      ...scene,
      onBookClick: (id: string) => post({ type: "click", id }),
      onBookHover: (id: string | null) => post({ type: "hover", id }),
      onFirstFrame: () => post({ type: "frame" }),
    })
  );
}

function applySize(size: Size) {
  proxy.width = size.width;
  proxy.height = size.height;
  proxy.left = size.left;
  proxy.top = size.top;
}

async function init(msg: Extract<ToWorker, { type: "init" }>) {
  const fonts = (self as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fonts || typeof FontFace === "undefined") return post({ type: "fail", reason: "no worker fonts" });

  applySize(msg.size);
  scene = {
    shelves: msg.shelves,
    pulledId: msg.pulledId,
    compact: msg.compact,
    reducedMotion: msg.reducedMotion,
    fontsReady: false,
  };

  // The page resolves the DPR range (workers can't see devicePixelRatio).
  const { dpr: _range, ...settings } = canvasSettings(msg.compact);
  config = {
    ...settings,
    events: createPointerEvents,
    onPointerMissed: (e) => {
      if ((e as MouseEvent).type === "click") post({ type: "missed" });
    },
  };
  root = createRoot(msg.canvas);
  try {
    await configure(msg.size);
    // Connect before the first render: in a worker R3F's onCreated runs after the
    // children's effects, and OrbitControls would bind to the bare OffscreenCanvas.
    const store = _roots.get(msg.canvas)!.store;
    getState = store.getState;
    store.getState().events.connect?.(proxy as unknown as HTMLElement);
  } catch (err) {
    return post({ type: "fail", reason: String(err) });
  }
  render();

  // Spines are lettered in Garamond: register the page's faces here and wait for them.
  setTextureFont(msg.fontFamily);
  for (const f of msg.faces) {
    try {
      fonts.add(new FontFace(f.family, f.source, f.descriptors));
    } catch {
      // a malformed rule just leaves that face out
    }
  }
  await Promise.all([
    fonts.load(`600 40px ${msg.fontFamily}`),
    fonts.load(`italic 500 20px ${msg.fontFamily}`),
  ]).catch(() => null);
  scene.fontsReady = true;
  render();
}

/** Scene stats and a clickable book, for the headless harness (scripts/study-shot.mjs). */
function probe(): ProbeResult | null {
  const s = getState?.();
  if (!s) return null;
  const isBook = (o: THREE.Object3D) =>
    o instanceof THREE.Group &&
    o.children.length > 0 &&
    o.children.every((c) => c instanceof THREE.Mesh && Array.isArray(c.material));
  let books = 0;
  let best: { d: number; x: number; y: number } | null = null;
  s.scene.traverse((o) => {
    if (!isBook(o)) return;
    books++;
    const v = o.getWorldPosition(new THREE.Vector3()).project(s.camera);
    if (Math.abs(v.x) > 0.6 || Math.abs(v.y) > 0.6 || v.z > 1) return;
    const d = Math.hypot(v.x + 0.1, v.y);
    if (!best || d < best.d) best = { d, x: v.x, y: v.y };
  });
  const b = best as { d: number; x: number; y: number } | null;
  const canvas = s.gl.domElement as unknown as OffscreenCanvas;
  return {
    canvas: [canvas.width, canvas.height],
    calls: s.gl.info.render.calls,
    tris: s.gl.info.render.triangles,
    textures: s.gl.info.memory.textures,
    books,
    target: b
      ? { x: Math.round(((b.x + 1) / 2) * s.size.width), y: Math.round(((1 - b.y) / 2) * s.size.height) }
      : null,
  };
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      void init(msg);
      break;
    case "props":
      if (!scene) return;
      scene.shelves = msg.shelves;
      scene.pulledId = msg.pulledId;
      render();
      break;
    case "resize":
      applySize(msg.size);
      if (root) void configure(msg.size);
      break;
    case "event":
      proxy.dispatch(msg.event);
      break;
    case "cover": {
      const resolve = covers.get(msg.url);
      covers.delete(msg.url);
      if (!resolve) return;
      if (!msg.bitmap) return resolve(null);
      const t = new THREE.Texture(msg.bitmap);
      t.flipY = false; // the page flipped it while decoding
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
      resolve(t);
      break;
    }
    case "probe":
      post({ type: "probe", id: msg.id, result: probe()! });
      break;
  }
};
