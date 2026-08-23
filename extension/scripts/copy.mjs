import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

if (process.argv.includes("--clean")) {
  rmSync(dist, { recursive: true, force: true });
  console.log("cleaned dist/");
  process.exit(0);
}

// Copy static assets into dist. tsc emits the compiled JS to dist before this
// runs, so dist is never deleted here - only statics are added/overwritten.
mkdirSync(dist, { recursive: true });

const statics = [
  ["manifest.json", "manifest.json"],
  ["icons", "icons"],
  ["src/popup/index.html", "popup/index.html"],
  ["src/popup/styles.css", "popup/styles.css"],
];

for (const [from, to] of statics) {
  const src = path.join(root, from);
  if (!existsSync(src)) {
    console.warn(`skip missing static: ${from}`);
    continue;
  }
  const dest = path.join(dist, to);
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

console.log("built dist/");