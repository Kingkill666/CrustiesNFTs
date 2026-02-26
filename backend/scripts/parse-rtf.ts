/**
 * parse-rtf.ts
 *
 * Parses the RTF metadata file and extracts 500 curated Crustie entries
 * into a clean JSON file at backend/data/crusties-metadata.json.
 *
 * Run: cd backend && npx tsx scripts/parse-rtf.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

interface CuratedCrustieEntry {
  id: string;
  file: string;
  name: string;
  cheese: string;
  eyes: string;
  toppings: string;
  background: string;
  crust: string;
  vibe: string;
  rarity: string;
}

const RTF_PATH = resolve(
  process.cwd(),
  "../public/images/Crusties/metadata.txt.rtfd/TXT.rtf"
);
const OUTPUT_PATH = resolve(process.cwd(), "data/crusties-metadata.json");
const IMAGES_DIR = resolve(process.cwd(), "../public/images/Crusties");

function parseRtf(rtfContent: string): CuratedCrustieEntry[] {
  // 1. Find the JSON array boundaries
  const firstBracket = rtfContent.indexOf("[");
  const lastBracket = rtfContent.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error("Could not find JSON array brackets in RTF content");
  }

  let jsonStr = rtfContent.slice(firstBracket, lastBracket + 1);

  // 2. Strip RTF control sequences
  // Remove color/formatting codes like \cf2, \cf3, \strokec2, \strokec3
  jsonStr = jsonStr.replace(/\\cf\d+\s*/g, "");
  jsonStr = jsonStr.replace(/\\strokec\d+\s*/g, "");
  jsonStr = jsonStr.replace(/\\expnd\d+\\expndtw\d+\\kerning\d+\s*/g, "");
  jsonStr = jsonStr.replace(/\\outl\d+\\strokewidth\d+\s*/g, "");
  jsonStr = jsonStr.replace(/\\f\d+\\fs\d+\s*/g, "");
  jsonStr = jsonStr.replace(/\\pard[^\n]*/g, "");
  jsonStr = jsonStr.replace(/\\pardeftab\d+\\partightenfactor\d+\s*/g, "");

  // 3. Handle RTF escaped braces and special chars
  jsonStr = jsonStr.replace(/\\\{/g, "{");
  jsonStr = jsonStr.replace(/\\\}/g, "}");

  // 4. Handle RTF backslash-newlines (\ followed by newline)
  jsonStr = jsonStr.replace(/\\\n/g, "");
  jsonStr = jsonStr.replace(/\\\r\n/g, "");
  jsonStr = jsonStr.replace(/\\\r/g, "");

  // 5. Handle RTF hex character escapes like \'f1 -> ñ
  jsonStr = jsonStr.replace(/\\'([0-9a-fA-F]{2})/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // 6. Remove any remaining RTF control words (\word or \word0)
  // But be careful not to remove valid JSON backslashes
  // RTF control words start with \ followed by a letter
  jsonStr = jsonStr.replace(/\\[a-zA-Z]+\d*\s?/g, "");

  // 7. Clean up any remaining RTF artifacts
  jsonStr = jsonStr.replace(/\r/g, "");

  // 8. Parse the cleaned JSON
  let entries: CuratedCrustieEntry[];
  try {
    entries = JSON.parse(jsonStr);
  } catch (err) {
    // If parsing fails, try to debug by showing the problematic area
    const error = err as Error;
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      console.error(
        "Parse error near:",
        jsonStr.slice(Math.max(0, pos - 100), pos + 100)
      );
    }
    throw new Error(`Failed to parse cleaned JSON: ${error.message}`);
  }

  return entries;
}

function validate(entries: CuratedCrustieEntry[]): void {
  const SKIP_IDS = new Set(["103"]); // No image for crustie-103
  const VALID_RARITIES = [
    "Common",
    "Uncommon",
    "Rare",
    "Epic",
    "Legendary",
  ];
  const REQUIRED_FIELDS: (keyof CuratedCrustieEntry)[] = [
    "id",
    "file",
    "name",
    "cheese",
    "eyes",
    "toppings",
    "background",
    "crust",
    "vibe",
    "rarity",
  ];

  if (entries.length !== 499) {
    throw new Error(`Expected 499 entries (500 minus 103), got ${entries.length}`);
  }

  const ids = new Set<string>();
  const rarityCounts: Record<string, number> = {};

  for (const entry of entries) {
    // Check all required fields exist and are non-empty
    for (const field of REQUIRED_FIELDS) {
      if (!entry[field] || typeof entry[field] !== "string") {
        throw new Error(
          `Entry ${entry.id}: missing or empty field "${field}"`
        );
      }
    }

    // Check for duplicate IDs
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate ID: ${entry.id}`);
    }
    ids.add(entry.id);

    // Validate rarity
    if (!VALID_RARITIES.includes(entry.rarity)) {
      throw new Error(
        `Entry ${entry.id}: invalid rarity "${entry.rarity}"`
      );
    }
    rarityCounts[entry.rarity] = (rarityCounts[entry.rarity] || 0) + 1;

    // Check corresponding image exists
    const padded = entry.id;
    const imagePath = resolve(IMAGES_DIR, `crustie-${padded}.png`);
    if (!existsSync(imagePath)) {
      console.warn(`⚠ Entry ${entry.id}: image not found at ${imagePath}`);
    }
  }

  // Check sequential IDs 001-500 (except skipped)
  for (let i = 1; i <= 500; i++) {
    const expectedId = String(i).padStart(3, "0");
    if (SKIP_IDS.has(expectedId)) continue;
    if (!ids.has(expectedId)) {
      throw new Error(`Missing entry for ID ${expectedId}`);
    }
  }

  console.log("\nValidation passed!");
  console.log(`  Total entries: ${entries.length}`);
  console.log(`  Rarity breakdown:`);
  for (const [rarity, count] of Object.entries(rarityCounts).sort()) {
    console.log(`    ${rarity}: ${count}`);
  }
}

function main() {
  console.log("Reading RTF file...");
  const rtfContent = readFileSync(RTF_PATH, "utf-8");
  console.log(`  File size: ${(rtfContent.length / 1024).toFixed(1)} KB`);

  console.log("Parsing RTF...");
  const allEntries = parseRtf(rtfContent);
  console.log(`  Extracted ${allEntries.length} entries`);

  // Filter out entry 103 (no image exists for crustie-103)
  const entries = allEntries.filter((e) => e.id !== "103");
  console.log(`  Filtered to ${entries.length} entries (removed 103)`);

  console.log("Validating...");
  validate(entries);

  // Write output
  const outDir = dirname(OUTPUT_PATH);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`\nWritten to: ${OUTPUT_PATH}`);

  // Show first and last entries as samples
  console.log("\nSample entries:");
  console.log(`  First: ${JSON.stringify(entries[0])}`);
  console.log(`  Last:  ${JSON.stringify(entries[entries.length - 1])}`);
}

main();
