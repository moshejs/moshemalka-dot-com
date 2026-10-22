// Build-time only (getStaticProps / scripts) — reads the filesystem.
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { Library } from "./types";
import { demoLibrary } from "./demo";

export const LIBRARY_FILE = join(process.cwd(), "data/library.json");

export function loadLibrary(): { library: Library; source: "library" | "demo" } {
  if (!existsSync(LIBRARY_FILE)) return { library: demoLibrary, source: "demo" };
  const library = JSON.parse(readFileSync(LIBRARY_FILE, "utf8")) as Library;
  return { library, source: "library" };
}
