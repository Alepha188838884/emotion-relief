import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const filesToCopy = ["index.html", "styles.css", "script.js"];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const file of filesToCopy) {
  await cp(path.join(rootDir, file), path.join(distDir, file));
}

console.log(`Build complete: ${distDir}`);
