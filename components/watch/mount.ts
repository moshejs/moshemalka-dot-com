import {
  ACESFilmicToneMapping,
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { handAngles, nyTime } from "@/lib/nyTime";
import { calendarHourDeg, mod360, nearestEquivalent } from "@/lib/timeTravel";
import { buildWatch } from "./scene";
import { getWatch, setWatch } from "./store";

/**
 * Draws the 3D watch into `host` and keeps it running. Plain three.js with
 * its own loop: a frame is rendered only when something moved (a hand, the
 * tilt, the crown), and nothing runs while the watch is off screen or the
 * tab is hidden.
 *
 * Returns a function that tears everything down.
 */
export function mountWatch(host: HTMLElement, onLost: () => void): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  // #watch-poster holds a fixed pose at 10:10 so scripts/watch-poster.mjs can
  // capture the still that stands in for the watch before it loads.
  const poster = window.location.hash === "#watch-poster";

  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: poster,
    // never animate on a software renderer (see WatchHost)
    failIfMajorPerformanceCaveat: !poster,
  });
  renderer.setPixelRatio(poster ? 3 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.03);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.55;

  const key = new DirectionalLight(0xffffff, 1.7);
  key.position.set(-2.6, 3.4, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 2;
  key.shadow.camera.bottom = -2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 5;
  scene.add(key);

  const camera = new PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0, 10.6);

  const watch = buildWatch(renderer.capabilities.getMaxAnisotropy());
  scene.add(watch.group);

  /* ── Sizing ── */
  let width = 0;
  let height = 0;
  let dirty = true;
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole case in frame when the slot is taller than it is wide
    camera.position.z = 10.6 * Math.max(1, h / w);
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /* ── Pointer tilt ── */
  let px = 0;
  let py = 0;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* ── Animated values ── */
  const live = () => handAngles(nyTime());
  let liveAt = 0;
  let liveBase = live();
  const first = liveBase;
  let h = first.hour;
  let m = first.minute;
  let s = first.second;
  let baseH = 0;
  let baseM = 0;
  let mode: "live" | "travel" = "live";
  let pull = 0;
  // start turned away, then settle into the product pose: the one entrance
  const settled = reduced.matches || poster;
  let rx = settled ? -0.16 : -0.5;
  let ry = settled ? -0.3 : -1.25;
  let scale = settled ? 1 : 0.86;

  const calNow = calendarHourDeg(Date.now());
  let last = performance.now();
  let raf = 0;
  let firstFrame = true;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const rect = host.getBoundingClientRect();
    if (rect.bottom < -40 || rect.top > window.innerHeight + 40 || !rect.width) {
      last = now;
      return;
    }
    // the first frame can be stamped before `last` while shaders compile
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const still = reduced.matches || poster;
    const ease = (k: number) => (still ? 1 : 1 - Math.exp(-dt * k));
    const st = getWatch();

    // re-read the New York clock once a second; interpolate between reads
    if (now - liveAt > 1000) {
      liveBase = live();
      liveAt = now;
    }
    const sec = liveBase.second + ((now - liveAt) / 1000) * 6;

    let th: number;
    let tm: number;
    let ts: number;
    if (st.mode === "travel") {
      if (mode !== "travel") {
        baseH = nearestEquivalent(mod360(calNow), h);
        baseM = nearestEquivalent(mod360(calNow * 12), m);
      }
      th = baseH + st.wind;
      tm = baseM + st.wind * 12;
      ts = nearestEquivalent(0, s); // crown out: the seconds hand stops at twelve
    } else {
      th = nearestEquivalent(liveBase.hour, h);
      tm = nearestEquivalent(liveBase.minute, m);
      // eight beats a second, like the movement; held still under reduced motion
      ts = still ? nearestEquivalent(first.second, s) : nearestEquivalent(Math.floor((sec / 6) * 8) * 0.75, s);
    }
    mode = st.mode;
    if (poster) {
      th = 305;
      tm = 61;
      ts = 222;
    }

    const nh = h + (th - h) * ease(7);
    const nm = m + (tm - m) * ease(7);
    const ns = st.mode === "travel" && !poster ? s + (ts - s) * ease(9) : ts;
    const np = pull + ((st.mode === "travel" && !poster ? 1 : 0) - pull) * ease(10);

    // pose: a three-quarter product view that leans toward the pointer
    const inRail = st.slot === "work";
    const scrollLean = inRail || poster ? 0 : Math.min(1, Math.max(0, window.scrollY / 700));
    const trx = (inRail ? -0.1 : -0.16) + (still ? 0 : py * 0.16) - scrollLean * 0.42;
    const tryy = (inRail ? -0.2 : -0.3) + (still ? 0 : px * 0.3) + scrollLean * 0.25;
    const nrx = rx + (trx - rx) * ease(4);
    const nry = ry + (tryy - ry) * ease(4);
    const nsc = scale + (1 - scale) * ease(4);

    const moved =
      Math.abs(nh - h) > 1e-3 ||
      Math.abs(nm - m) > 1e-3 ||
      Math.abs(ns - s) > 1e-3 ||
      Math.abs(np - pull) > 1e-4 ||
      Math.abs(nrx - rx) > 1e-4 ||
      Math.abs(nry - ry) > 1e-4 ||
      Math.abs(nsc - scale) > 1e-4;
    h = nh;
    m = nm;
    s = ns;
    pull = np;
    rx = nrx;
    ry = nry;
    scale = nsc;
    if (!moved && !dirty) return;
    dirty = false;

    watch.setHands(h, m, s);
    watch.setCrown(pull, m * 0.5);
    watch.group.rotation.set(rx, ry, 0);
    watch.group.scale.setScalar(scale);
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      host.dataset.ready = "true";
      setWatch({ ready: true });
    }
  };
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    setWatch({ ready: false });
    delete host.dataset.ready;
    watch.dispose();
    env.dispose();
    room.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
