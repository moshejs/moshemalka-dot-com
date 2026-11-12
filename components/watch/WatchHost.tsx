import { useEffect } from "react";
import { setWatch } from "./store";

function canWebGL(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Loads the 3D watch once the page is idle and seats it over the SVG dial.
 * There is one watch and two seats: the hero, and (on wide screens) the rail
 * beside the Work list. It moves to the rail once the hero has scrolled
 * away; whichever seat it leaves shows its SVG dial again.
 *
 * Renders nothing. Without WebGL, or with data saver on, the SVG stays.
 */
export function WatchHost() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-watch-slot="hero"]');
    if (!hero) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || !canWebGL()) return;

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
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", idle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      teardown();
    };
  }, []);
  return null;
}
