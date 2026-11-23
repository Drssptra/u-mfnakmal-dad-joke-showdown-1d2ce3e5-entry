// SPDX-License-Identifier: MIT
// Dad Joke Showdown — one fixed entry line, written to /output/entry.txt.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "My son asked why I keep a pencil behind my ear. I said it's in case I need to draw the line somewhere.";

const codePoints = [...ENTRY];
if (codePoints.length < 1 || codePoints.length > 200) {
  throw new Error(
    `entry must be 1-200 characters, got ${codePoints.length}`,
  );
}
if (ENTRY.trim().length === 0) {
  throw new Error("entry must not be only whitespace");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), ENTRY, "utf8");
