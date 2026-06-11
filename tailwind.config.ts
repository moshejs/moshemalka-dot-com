import type { Config } from "tailwindcss";
import path from "path";

// Globs are anchored to this file's directory so the content scan works
// regardless of the dev server's working directory.
const config: Config = {
  content: [
    path.join(__dirname, "pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "components/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
