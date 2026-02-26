/**
 * verify-pins.ts
 *
 * Verifies that all 499 Crusties have been pinned to IPFS correctly.
 * Spot-checks a random sample by fetching metadata from a Pinata gateway.
 *
 * Run: cd backend && npx tsx scripts/verify-pins.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const URIS_FILE = resolve(process.cwd(), "data/ipfs-uris.json");
const GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const SAMPLE_SIZE = 10;

async function main() {
  if (!existsSync(URIS_FILE)) {
    console.error("Error: ipfs-uris.json not found. Run batch-pin.ts first.");
    process.exit(1);
  }

  const mapping = JSON.parse(readFileSync(URIS_FILE, "utf-8"));
  const meta = mapping._meta;

  // Count fully pinned entries
  const entries: string[] = [];
  const missing: string[] = [];

  for (let i = 1; i <= 500; i++) {
    if (i === 103) continue; // No crustie-103
    const key = String(i).padStart(3, "0");
    const entry = mapping[key];
    if (entry?.imageCid && entry?.metadataCid) {
      entries.push(key);
    } else {
      missing.push(key);
    }
  }

  console.log(`=== IPFS Pin Verification ===`);
  console.log(`Total pinned: ${entries.length}/499`);
  if (meta) {
    console.log(`Last updated: ${meta.lastUpdated}`);
  }

  if (missing.length > 0) {
    console.log(`\nMissing entries (${missing.length}):`);
    console.log(`  ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`);
  }

  if (entries.length === 0) {
    console.log("\nNo entries to verify.");
    return;
  }

  // Spot-check random sample
  const sampleSize = Math.min(SAMPLE_SIZE, entries.length);
  const shuffled = entries.sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, sampleSize);

  console.log(`\nSpot-checking ${sampleSize} random metadata JSONs...`);

  let passed = 0;
  let failed = 0;

  for (const key of sample) {
    const entry = mapping[key];
    const url = `${GATEWAY}${entry.metadataCid}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.error(`  [${key}] FAIL: HTTP ${res.status} from gateway`);
        failed++;
        continue;
      }

      const json = await res.json();

      // Validate structure
      const errors: string[] = [];
      if (!json.name) errors.push("missing name");
      if (!json.description) errors.push("missing description");
      if (!json.image) errors.push("missing image");
      if (!json.external_url) errors.push("missing external_url");
      if (!Array.isArray(json.attributes)) errors.push("missing attributes array");
      if (json.image !== entry.imageUri)
        errors.push(`image mismatch: ${json.image} != ${entry.imageUri}`);
      if (json.attributes?.length !== 8)
        errors.push(`expected 8 attributes, got ${json.attributes?.length}`);

      if (errors.length > 0) {
        console.error(`  [${key}] FAIL: ${errors.join(", ")}`);
        failed++;
      } else {
        console.log(`  [${key}] OK: ${json.name} — ${json.attributes.find((a: any) => a.trait_type === "Vibe")?.value}`);
        passed++;
      }
    } catch (err) {
      console.error(`  [${key}] FAIL: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${sampleSize} checked`);

  if (missing.length === 0 && failed === 0) {
    console.log("\nAll 499 Crusties pinned and verified!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
