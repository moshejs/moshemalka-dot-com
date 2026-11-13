/**
 * A still of the 3D watch: what shows before the real one has loaded and
 * where it never loads (no hardware WebGL, data saver).
 * Regenerate with scripts/watch-poster.mjs after changing the model.
 */
export function WatchPoster() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="c-poster"
      src="/watch.webp"
      alt="A steel watch with a blue sunray dial, a green sapphire crystal and an orange lightning-bolt seconds hand"
      width="880"
      height="880"
      decoding="async"
    />
  );
}
