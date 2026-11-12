import { useEffect } from "react";
import { setWatch } from "./store";

// Software rendering (no GPU, or a blocked driver) draws each frame on the
// CPU: about a third of a second per frame, which freezes the page. The
// poster stays instead. Browsers refuse the context when they fall back to
// software on their own; a renderer that was chosen deliberately (SwiftShader
// in headless Chromium, llvmpipe on Linux) is caught by name.
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function canWebGL(allowSoftware: boolean): boolean {
  try {
    const gl = document
      .createElement("canvas")
      .getContext("webgl2", { failIfMajorPerformanceCaveat: !allowSoftware });
    if (!gl) return false;
    if (allowSoftware) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    return !SOFTWARE_GL.test(renderer);
  } catch {
    return false;
  }
}

/**
 * Loads the 3D watch once the page is idle (on phones: after the first
 * touch or scroll) and seats it over the poster image.
 * There is one watch and two seats: the hero, and (on wide screens) the rail
 * beside the Work list. It moves to the rail once the hero has scrolled
 * away; whichever seat it leaves shows its poster again.
 *
 * Renders nothing. Without hardware-accelerated WebGL, or with data saver
 * on, the poster stays.
 */
export function WatchHost() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-watch-slot="hero"]');
    if (!hero) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    // scripts/watch-poster.mjs captures the still in headless Chromium, which
    // only has software rendering.
    const capturing = window.location.hash === "#watch-poster";
    if (saveData || !canWebGL(capturing)) return;

    const host = document.createElement("div");
    host.className = "c-watch3d";
    const wide = window.matchMedia("(min-width: 1100px)");
    let seat: HTMLElement | null = null;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    let raf = 0;

    const place = () => {
      raf = 0;
      const work = document.querySelector<HTMLElement>('[data-watch-slot="work"]');
      const gone = hero.getBoundingClientRect().bottom < window.innerHeight * 0.35;
      const want = wide.matches && work && gone ? work : hero;
      if (want === seat) return;
      const moved = seat !== null;
      seat = want;
      want.prepend(host);
      setWatch({ slot: want === hero ? "hero" : "work" });
      if (moved) {
        host.classList.remove("c-watch3d--arrive");
        void host.offsetWidth; // restart the arrival animation
        host.classList.add("c-watch3d--arrive");
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };

    const teardown = () => {
      dispose?.();
      dispose = null;
      host.remove();
      seat = null;
    };

    const start = () => {
      if (cancelled) return;
      import("./mount").then(({ mountWatch }) => {
        if (cancelled) return;
        place();
        try {
          dispose = mountWatch(host, teardown);
        } catch {
          teardown();
          return;
        }
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
      });
    };
    const idle = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (ric) ric(start, { timeout: 2500 });
      else window.setTimeout(start, 300);
    };
    // On phones, building the model costs a few hundred ms of main thread.
    // Hold it until the visitor first touches the page; the poster shows
    // until then. Wide screens with a mouse load as soon as the page is idle.
    const phone = window.matchMedia("(max-width: 1099px), (pointer: coarse)").matches;
    const wakeEvents = ["scroll", "pointerdown", "touchstart", "keydown"] as const;
    const wake = () => {
      for (const type of wakeEvents) window.removeEventListener(type, wake);
      idle();
    };
    const begin = () => {
      if (!phone) idle();
      else for (const type of wakeEvents) window.addEventListener(type, wake, { passive: true });
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", begin);
      for (const type of wakeEvents) window.removeEventListener(type, wake);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      teardown();
    };
  }, []);
  return null;
}
