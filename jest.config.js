// Uses Next.js's built-in Jest preset (SWC-powered, handles TS + ESM out of
// the box, picks up tsconfig paths). The data + utility tests in `lib/` only
// need a Node environment — no jsdom required.
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/lib/**/*.test.ts", "<rootDir>/lib/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

module.exports = createJestConfig(config);
