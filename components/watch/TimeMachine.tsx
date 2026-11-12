import { useEffect, type RefObject } from "react";
import { ROLES } from "@/lib/portfolio";
import { buildStops, dateAt, locate, travelLabel, windDeg } from "@/lib/timeTravel";
import { setWatch, useWatch } from "./store";

/**
 * Turns the Work list into the watch's winding crown: the row under the
 * middle of the screen decides what moment the watch shows. Above the list
 * the watch tells live New York time.
 */
export function useTimeMachine(listRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const now = Date.now();
    const stops = buildStops(ROLES, now);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;
      const rows = Array.from(list.children, (el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      const at = locate(rows, window.innerHeight * 0.5);
      if (!at) {
        setWatch({ mode: "live", wind: 0, label: "", roleId: null, company: null });
        return;
      }
      const stop = stops[at.index];
      // reduced motion: one step per role instead of a continuous wind
      const t = dateAt(stop, reduced.matches ? 1 : at.frac);
      setWatch({
        mode: "travel",
        wind: windDeg(now, t),
        label: travelLabel(t),
        roleId: stop.id,
        company: stop.company,
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // rows open and close, which moves every row below them
    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      setWatch({ mode: "live", wind: 0, label: "", roleId: null, company: null });
    };
  }, [listRef]);
}

/**
 * A still of the 3D watch: what shows before the real one has loaded, in
 * the seat the real one isn't in, and where WebGL is unavailable.
 * Regenerate with scripts/watch-poster.mjs after changing the model.
 */
export function WatchPoster({ eager = false }: { eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="c-poster"
      src="/watch.webp"
      alt="A steel watch with a blue sunray dial, a green sapphire crystal and an orange lightning-bolt seconds hand"
      width="880"
      height="880"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

/**
 * The watch's seat beside the Work list, with the date it has been wound to.
 * Decorative: the same dates are in the list itself.
 */
export function TravelRail() {
  const mode = useWatch((s) => s.mode);
  const label = useWatch((s) => s.label);
  const company = useWatch((s) => s.company);
  const travelling = mode === "travel";
  return (
    <aside className="c-rail" aria-hidden="true" data-mode={mode}>
      <div className="c-rail__inner">
        <div className="c-rail__stage" data-watch-slot="work">
          <WatchPoster />
        </div>
        <div className="c-rail__read">
          <span className="c-rail__date">{travelling ? label : "NOW"}</span>
          <span className="c-rail__who">{travelling ? company : "Scroll to wind it back"}</span>
        </div>
      </div>
    </aside>
  );
}
