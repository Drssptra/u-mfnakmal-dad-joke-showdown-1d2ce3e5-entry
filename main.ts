// SPDX-License-Identifier: MIT
// Dad Joke Showdown — one fixed entry line, written to /output/entry.txt.
//
// The entry is a single fixed joke string. Before writing it out we run it
// through validateEntry(), which enforces the competition's entry rules so
// a bad entry fails loudly instead of being submitted silently.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "My son asked why I keep a pencil behind my ear. I said it's in case I need to draw the line somewhere.";

// Competition limits for a showdown entry.
const MIN_LENGTH = 1;
const MAX_LENGTH = 200;

// Characters that are never allowed inside an entry: newlines, carriage
// returns, tabs, and any other control character (U+0000–U+001F, U+007F).
const CONTROL_CHAR = /[\u0000-\u001F\u007F]/;

// True when the string contains at least one letter or digit — i.e. it is
// more than just punctuation and whitespace.
function hasAlphanumeric(entry: string): boolean {
  return /[\p{L}\p{N}]/u.test(entry);
}

// A single entry rule: a human-readable name plus the test itself. When a
// rule fails, validateEntry reports the rule's name so the exact broken
// rule is obvious from the error message.
type EntryRule = { name: string; passes: (entry: string) => boolean };

function buildRules(): EntryRule[] {
  return [
    {
      name: "length",
      passes: (entry) => {
        const count = [...entry].length;
        return count >= MIN_LENGTH && count <= MAX_LENGTH;
      },
    },
    {
      name: "not-blank",
      passes: (entry) => entry.trim().length > 0,
    },
    {
      name: "no-leading-or-trailing-whitespace",
      passes: (entry) => entry === entry.trim(),
    },
    {
      name: "single-line",
      passes: (entry) => !entry.includes("\n") && !entry.includes("\r"),
    },
    {
      name: "no-control-characters",
      passes: (entry) => !CONTROL_CHAR.test(entry),
    },
    {
      name: "not-only-punctuation",
      passes: (entry) => hasAlphanumeric(entry),
    },
  ];
}

// Validate the entry against every rule. Throws an Error naming the exact
// rule that failed and the entry length; returns nothing when valid.
function validateEntry(entry: string): void {
  const length = [...entry].length;
  for (const rule of buildRules()) {
    if (!rule.passes(entry)) {
      throw new Error(
        `entry failed rule "${rule.name}" ` +
          `(entry is ${length} code points; ` +
          `must be ${MIN_LENGTH}-${MAX_LENGTH} chars, one line, ` +
          `no leading/trailing whitespace, no control characters, ` +
          `and contain at least one letter or digit)`,
      );
    }
  }
}

validateEntry(ENTRY);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), ENTRY, "utf8");
