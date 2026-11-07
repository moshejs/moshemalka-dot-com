import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { RoomShelf } from "./Room";
import {
  COMPACT_BELOW,
  dprRange,
  type FontFaceSpec,
  type ForwardedEvent,
  type FromWorker,
  type ProbeResult,
  type Size,
  type ToWorker,
} from "./protocol";

function Lamp() {
  return (
    <div className="grid h-full w-full place-items-center">
      <p className="font-garamond italic text-lg text-[#c9a36a]/80 animate-pulse">lighting the lamp…</p>
    </div>
  );
}

// Browsers that can't run WebGL in a worker render the same scene here instead.
const Room = dynamic(() => import("./Room"), { ssr: false, loading: Lamp });

type Props = {
  shelves: RoomShelf[];
  pulledId: string | null;
  onBookClick: (id: string) => void;
  onBackgroundClick: () => void;
  onBookHover: (id: string | null) => void;
  fontFamily: string;
};

let support: boolean | undefined;
/** WebGL2 on an OffscreenCanvas, i.e. the scene can run in a worker. Checked once. */
function workerWebGL() {
  return (support ??= detectWorkerWebGL());
}
function detectWorkerWebGL() {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return false;
  if (!("transferControlToOffscreen" in HTMLCanvasElement.prototype)) return false;
  try {
    const gl = new OffscreenCanvas(1, 1).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

const noop = () => () => {};

const unquote = (s: string) => s.trim().replace(/^['"]|['"]$/g, "");

/** The page's @font-face rules for a family, with absolute URLs, to re-register in the worker. */
function fontFaces(fontFamily: string): FontFaceSpec[] {
  const family = unquote(fontFamily.split(",")[0]);
  const faces: FontFaceSpec[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const st = rule.style;
      if (unquote(st.getPropertyValue("font-family")) !== family) continue;
      const base = sheet.href ?? location.href;
      const source = st
        .getPropertyValue("src")
        .replace(/url\((['"]?)([^'")]+)\1\)/g, (_, _q, u: string) => `url("${new URL(u, base).href}")`);
      const descriptors: FontFaceDescriptors = {
        style: st.getPropertyValue("font-style") || "normal",
        weight: st.getPropertyValue("font-weight") || "normal",
      };
      const range = st.getPropertyValue("unicode-range");
      if (range) descriptors.unicodeRange = range;
      faces.push({ family, source, descriptors });
    }
  }
  return faces;
}

function forwarded(e: PointerEvent | WheelEvent | MouseEvent, rect: DOMRect): ForwardedEvent {
  const p = e as Partial<PointerEvent>;
  const w = e as Partial<WheelEvent>;
  return {
    type: e.type,
    pointerId: p.pointerId ?? 1,
    pointerType: p.pointerType ?? "mouse",
    isPrimary: p.isPrimary ?? true,
    button: e.button,
    buttons: e.buttons,
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.pageX,
    pageY: e.pageY,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    deltaX: w.deltaX ?? 0,
    deltaY: w.deltaY ?? 0,
    deltaMode: w.deltaMode ?? 0,
  };
}

const FORWARD = [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "pointerleave",
  "lostpointercapture",
  "click",
  "dblclick",
  "contextmenu",
  "wheel",
] as const;

/**
 * The study's 3D room. Rendered in a Web Worker on an OffscreenCanvas so the
 * scene's boot (three.js, lettered spines, shader compiles) never blocks the
 * page; falls back to the main thread where workers can't do WebGL.
 */
export default function StudyCanvas(props: Props) {
  const { shelves, pulledId } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  // The server assumes the worker; a browser without it re-renders into the fallback.
  const supported = useSyncExternalStore(noop, workerWebGL, () => true);
  const [failed, setFailed] = useState(false);
  const mode = supported && !failed ? "worker" : "main";
  const [drawn, setDrawn] = useState(false);

  // Callbacks change identity with page state; the worker always calls the latest.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || mode !== "worker") return;

    // Created here, not in JSX: a canvas can hand its control off only once,
    // and StrictMode replays effects.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    wrap.prepend(canvas);
    const offscreen = canvas.transferControlToOffscreen();

    const worker = new Worker(new URL("./study.worker.tsx", import.meta.url), { type: "module" });
    workerRef.current = worker;
    const send = (msg: ToWorker, transfer: Transferable[] = []) => worker.postMessage(msg, transfer);

    const compact = window.innerWidth < COMPACT_BELOW;
    const [minDpr, maxDpr] = dprRange(compact);
    let rect = wrap.getBoundingClientRect();
    const size = (): Size => ({
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      dpr: Math.min(Math.max(minDpr, window.devicePixelRatio || 1), maxDpr),
    });

    let failed = false;
    const fail = (reason: unknown) => {
      if (failed) return;
      failed = true;
      console.warn("[study] rendering on the main thread:", reason);
      worker.terminate();
      canvas.remove();
      setFailed(true);
    };

    const probes = new Map<number, (r: ProbeResult) => void>();
    worker.onerror = (e) => fail(e.message || "worker error");
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      const p = latest.current;
      switch (msg.type) {
        case "frame":
          setDrawn(true);
          break;
        case "fail":
          fail(msg.reason);
          break;
        case "click":
          p.onBookClick(msg.id);
          break;
        case "hover":
          p.onBookHover(msg.id);
          break;
        case "missed":
          p.onBackgroundClick();
          break;
        case "cursor":
          document.body.style.cursor = msg.value;
          break;
        case "cover": {
          // Decoded here because the page's CSP lets images (not fetches) reach the cover hosts.
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = msg.url;
          img
            .decode()
            .then(() => createImageBitmap(img, { imageOrientation: "flipY" }))
            .then((bitmap) => send({ type: "cover", url: msg.url, bitmap }, [bitmap]))
            .catch(() => send({ type: "cover", url: msg.url, bitmap: null }));
          break;
        }
        case "probe":
          probes.get(msg.id)?.(msg.result);
          probes.delete(msg.id);
          break;
      }
    };

    send(
      {
        type: "init",
        canvas: offscreen,
        size: size(),
        compact,
        reducedMotion: !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
        fontFamily: latest.current.fontFamily,
        faces: fontFaces(latest.current.fontFamily),
        shelves: latest.current.shelves,
        pulledId: latest.current.pulledId,
      },
      [offscreen]
    );

    const ro = new ResizeObserver(() => {
      rect = wrap.getBoundingClientRect();
      send({ type: "resize", size: size() });
    });
    ro.observe(wrap);

    const onEvent = (e: Event) => {
      const ev = e as PointerEvent;
      if (e.type === "pointerdown") canvas.setPointerCapture(ev.pointerId); // drags keep orbiting past the edge
      if (e.type === "wheel" || e.type === "contextmenu") e.preventDefault();
      send({ type: "event", event: forwarded(ev, rect) });
    };
    for (const t of FORWARD) canvas.addEventListener(t, onEvent, { passive: t !== "wheel" && t !== "contextmenu" });

    // Hook for the headless verification harness (scripts/study-shot.mjs).
    let probeId = 0;
    (window as unknown as Record<string, unknown>).__studyProbe = () =>
      new Promise<ProbeResult>((resolve) => {
        probes.set(++probeId, resolve);
        send({ type: "probe", id: probeId });
      });

    return () => {
      ro.disconnect();
      for (const t of FORWARD) canvas.removeEventListener(t, onEvent);
      worker.terminate();
      workerRef.current = null;
      canvas.remove();
      document.body.style.cursor = "";
      delete (window as unknown as Record<string, unknown>).__studyProbe;
    };
  }, [mode]);

  useEffect(() => {
    workerRef.current?.postMessage({ type: "props", shelves, pulledId } satisfies ToWorker);
  }, [shelves, pulledId]);

  if (mode === "main") {
    const { shelves, pulledId, onBookClick, onBackgroundClick, onBookHover, fontFamily } = props;
    return (
      <Room
        shelves={shelves}
        pulledId={pulledId}
        onBookClick={onBookClick}
        onBackgroundClick={onBackgroundClick}
        onBookHover={onBookHover}
        fontFamily={fontFamily}
      />
    );
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      {!drawn && (
        <div className="pointer-events-none absolute inset-0">
          <Lamp />
        </div>
      )}
    </div>
  );
}
