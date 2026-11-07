import * as THREE from "three";

// The scene runs either on the main thread (fallback) or in a Web Worker on an
// OffscreenCanvas. Everything it needs from the page goes through here, so the
// scene code never touches `document` or `window` directly.

/** A 2D canvas for procedural textures: a DOM canvas on the page, an OffscreenCanvas in a worker. */
export function makeCanvas(width: number, height: number) {
  const c =
    typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(width, height);
  c.width = width;
  c.height = height;
  // The 2D APIs the textures use are identical on both; type them as the DOM one.
  return { c: c as HTMLCanvasElement, ctx: c.getContext("2d") as CanvasRenderingContext2D };
}

type Host = {
  setCursor: (cursor: string) => void;
  loadCover: (url: string) => Promise<THREE.Texture | null>;
};

const coverLoader = new THREE.TextureLoader();
coverLoader.setCrossOrigin("anonymous");

export const host: Host = {
  setCursor: (cursor) => {
    document.body.style.cursor = cursor;
  },
  loadCover: (url) =>
    coverLoader
      .loadAsync(url)
      .then((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      })
      .catch(() => null),
};

/** The worker swaps in message-passing versions. */
export function setHost(overrides: Partial<Host>) {
  Object.assign(host, overrides);
}
