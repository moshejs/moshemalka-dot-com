// Imported first by the scene worker. Next compiles `typeof window` to
// "object" in client bundles, so library guards like three's
// `if (typeof window !== "undefined") window.__THREE__ = …` run unguarded in a
// worker. Alias `window` to the worker scope; it has no `document`, which the
// libraries still check for before touching the DOM.
const scope = globalThis as unknown as { window?: unknown };
if (typeof scope.window === "undefined") scope.window = globalThis;

export {};
