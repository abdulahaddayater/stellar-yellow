import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "frontend", "dist");

mkdirSync(outDir, { recursive: true });

writeFileSync(
  join(outDir, "index.js"),
  "export { default } from '../../api/index.js';\n"
);

console.log("Vercel entrypoint ready at frontend/dist/index.js");
