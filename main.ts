// SPDX-License-Identifier: MIT
//
// Dad Joke Showdown — v2 resubmission.
//
// The program produces exactly one artifact: the fixed joke below, written
// byte-for-byte to $MAKEFUN_OUTPUT_DIR/entry.txt. There is no trailing
// newline, no extra file, and nothing else on disk. Everything in this
// file exists to make sure the joke that gets written is the joke we
// intended: one line, within the length limit, free of stray whitespace
// or control characters, and different from the v1 pencil joke.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry itself. Do not edit this string: the competition judges the
// exact text, punctuation included.
const JOKE =
  "My wife asked why I keep a ladder in the garage. I said in case I ever need to take things to the next level.";

// The v1 entry. This file must never emit it again; the check in main()
// exists so a bad merge can only fail, never silently resubmit v1.
const PREVIOUS_JOKE =
  "My son asked why I keep a pencil behind my ear. I said it's in case I need to draw the line somewhere.";

// Competition bounds for one entry line.
const LIMITS = { minChars: 1, maxChars: 200 } as const;

// Fallback used only when the runner did not set MAKEFUN_OUTPUT_DIR.
const DEFAULT_OUTPUT_DIR = "/output";

// Every problem found with a candidate entry, in one place, so a failure
// message lists all of them instead of stopping at the first one.
interface EntryProblems {
  tooShort: boolean;
  tooLong: boolean;
  blank: boolean;
  hasLeadingSpace: boolean;
  hasTrailingSpace: boolean;
  hasLineBreak: boolean;
  hasControlChar: boolean;
  hasNoLettersOrDigits: boolean;
}

// One left-to-right scan of the entry. Counting code points (not UTF-16
// code units) keeps the length honest for any non-ASCII text, and walking
// the string once means every check below shares the same pass.
function scanEntry(text: string): EntryProblems {
  let charCount = 0;
  let seenLetterOrDigit = false;
  let seenControlChar = false;
  let seenLineBreak = false;

  for (const ch of text) {
    charCount += 1;
    const code = ch.codePointAt(0) as number;
    if (code === 0x0a || code === 0x0d) {
      seenLineBreak = true;
    } else if (code < 0x20 || code === 0x7f) {
      seenControlChar = true;
    }
    // ASCII letters/digits plus any Unicode letter/number. A cheap ASCII
    // test first; the regex only runs for the rare non-ASCII character.
    if (
      (code >= 0x30 && code <= 0x39) ||
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      /[\p{L}\p{N}]/u.test(ch)
    ) {
      seenLetterOrDigit = true;
    }
  }

  return {
    tooShort: charCount < LIMITS.minChars,
    tooLong: charCount > LIMITS.maxChars,
    blank: text.trim().length === 0,
    hasLeadingSpace: text.trimStart().length !== text.length,
    hasTrailingSpace: text.trimEnd().length !== text.length,
    hasLineBreak: seenLineBreak,
    hasControlChar: seenControlChar,
    hasNoLettersOrDigits: !seenLetterOrDigit,
  };
}

// Turn the scan result into a readable list of failures. Empty means the
// entry is good to write.
function describeProblems(p: EntryProblems): string[] {
  const found: string[] = [];
  if (p.tooShort) found.push("shorter than the minimum length");
  if (p.tooLong) found.push(`longer than ${LIMITS.maxChars} characters`);
  if (p.blank) found.push("blank or whitespace-only");
  if (p.hasLeadingSpace) found.push("starts with whitespace");
  if (p.hasTrailingSpace) found.push("ends with whitespace");
  if (p.hasLineBreak) found.push("contains a line break");
  if (p.hasControlChar) found.push("contains a control character");
  if (p.hasNoLettersOrDigits) found.push("contains no letter or digit");
  return found;
}

// Where the entry goes. The environment variable wins; anything else is a
// configuration error, because writing to the wrong directory would mean
// submitting nothing at all.
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv === undefined || fromEnv === "") {
    return DEFAULT_OUTPUT_DIR;
  }
  return fromEnv;
}

function main(): void {
  const problems = describeProblems(scanEntry(JOKE));
  if (problems.length > 0) {
    throw new Error(
      `invalid entry (${problems.length} problem${
        problems.length === 1 ? "" : "s"
      }): ${problems.join("; ")}`,
    );
  }

  if (JOKE === PREVIOUS_JOKE) {
    throw new Error("entry must differ from the v1 entry");
  }

  const outDir = resolveOutputDir();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), JOKE, { encoding: "utf8" });
  console.log(`wrote entry.txt (${[...JOKE].length} chars) to ${outDir}`);
}

main();
