/**
 * batch-pin.ts
 *
 * Batch-pins all 499 Crustie images + metadata JSONs to IPFS via Pinata.
 * Resumable: saves progress after each entry. Re-run to continue from where it left off.
 *
 * Prerequisites:
 *   1. Run parse-rtf.ts first to generate backend/data/crusties-metadata.json
 *   2. Set PINATA_JWT in your .env
 *
 * Run: cd backend && npx tsx scripts/batch-pin.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { config } from "dotenv";

// Load env from repo root
config({ path: resolve(process.cwd(), "../.env") });

// Dynamic imports for ESM modules
async function main() {
  const { pinToIPFS } = await import("../src/ipfs.js");
  const { buildCuratedMetadata } = await import("../src/metadata-curated.js");

  const METADATA_FILE = resolve(process.cwd(), "data/crusties-metadata.json");
  const URIS_FILE = resolve(process.cwd(), "data/ipfs-uris.json");
  const IMAGES_DIR = resolve(process.cwd(), "../public/images/Crusties");
  const RATE_LIMIT_MS = 500;

  // Validate prerequisites
  if (!process.env.PINATA_JWT) {
    console.error("Error: PINATA_JWT not set in .env");
    process.exit(1);
  }
  if (!existsSync(METADATA_FILE)) {
    console.error(
      "Error: crusties-metadata.json not found. Run parse-rtf.ts first."
    );
    process.exit(1);
  }

  // Load curated metadata
  const entries = JSON.parse(
    readFileSync(METADATA_FILE, "utf-8")
  ) as Array<{
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
  }>;
  console.log(`Loaded ${entries.length} curated entries`);

  // Load or create URI mapping
  let uriMapping: Record<string, any> = {};
  if (existsSync(URIS_FILE)) {
    uriMapping = JSON.parse(readFileSync(URIS_FILE, "utf-8"));
    const pinned = Object.keys(uriMapping).filter(
      (k) => k !== "_meta" && uriMapping[k]?.metadataCid
    ).length;
    console.log(`Resuming: ${pinned}/${entries.length} already pinned`);
  }

  function save() {
    mkdirSync(dirname(URIS_FILE), { recursive: true });
    writeFileSync(URIS_FILE, JSON.stringify(uriMapping, null, 2), "utf-8");
  }

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const startTime = Date.now();
  let pinCount = 0;

  for (const entry of entries) {
    const id = entry.id;

    // Skip if already fully pinned
    if (uriMapping[id]?.metadataCid) {
      continue;
    }

    const imagePath = resolve(IMAGES_DIR, `crustie-${id}.png`);
    if (!existsSync(imagePath)) {
      console.error(`[${id}] Image not found: ${imagePath}`);
      save();
      process.exit(1);
    }

    // Pin image (if not already pinned)
    let imageCid = uriMapping[id]?.imageCid;
    if (!imageCid) {
      try {
        console.log(`[${id}] Pinning image crustie-${id}.png...`);
        const imageBuffer = readFileSync(imagePath);
        imageCid = await pinToIPFS(
          Buffer.from(imageBuffer),
          `crustie-${id}.png`
        );
        uriMapping[id] = {
          ...uriMapping[id],
          imageCid,
          imageUri: `ipfs://${imageCid}`,
          pinnedAt: new Date().toISOString(),
        };
        save();
        pinCount++;
        await delay(RATE_LIMIT_MS);
      } catch (err) {
        console.error(`[${id}] Image pin failed:`, err);
        save();
        console.log("Progress saved. Re-run to resume.");
        process.exit(1);
      }
    }

    // Build metadata JSON
    const imageUri = `ipfs://${imageCid}`;
    const metadata = buildCuratedMetadata(entry, imageUri);

    // Pin metadata
    try {
      console.log(`[${id}] Pinning metadata...`);
      const metadataCid = await pinToIPFS(
        Buffer.from(JSON.stringify(metadata)),
        `crustie-${id}-metadata.json`
      );
      uriMapping[id] = {
        ...uriMapping[id],
        metadataCid,
        metadataUri: `ipfs://${metadataCid}`,
        pinnedAt: new Date().toISOString(),
      };
      save();
      pinCount++;
      await delay(RATE_LIMIT_MS);
    } catch (err) {
      console.error(`[${id}] Metadata pin failed:`, err);
      save();
      console.log("Progress saved. Re-run to resume.");
      process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[${id}] Done -> ${uriMapping[id].metadataUri} (${elapsed}s elapsed)`
    );
  }

  // Update meta
  const totalPinned = Object.keys(uriMapping).filter(
    (k) => k !== "_meta" && uriMapping[k]?.metadataCid
  ).length;
  uriMapping._meta = {
    totalPinned,
    lastUpdated: new Date().toISOString(),
  };
  save();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\nBatch pinning complete! ${totalPinned}/499 crusties pinned. ${pinCount} new pins. ${totalTime}s total.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
