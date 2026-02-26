/**
 * ipfs-lookup.ts
 *
 * Loads pre-pinned IPFS URI mappings and curated trait data.
 * Used by the generate route to skip dynamic generation entirely.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { CuratedCrustieEntry } from "./metadata-curated.js";

interface IpfsEntry {
  imageCid: string;
  imageUri: string;
  metadataCid: string;
  metadataUri: string;
  pinnedAt: string;
}

type IpfsUriMapping = Record<string, IpfsEntry | { totalPinned: number; lastUpdated: string }>;

const IPFS_URIS_FILE =
  process.env.IPFS_URIS_FILE ||
  resolve(process.cwd(), "data/ipfs-uris.json");

const CURATED_METADATA_FILE =
  process.env.CURATED_METADATA_FILE ||
  resolve(process.cwd(), "data/crusties-metadata.json");

let cachedMapping: IpfsUriMapping | null = null;
let cachedMetadata: CuratedCrustieEntry[] | null = null;

/**
 * Look up the pre-pinned IPFS metadata URI for a crustie by its 1-indexed number.
 * Returns null if not found (not yet pinned).
 */
export function getPrePinnedUri(
  crustieNumber: number
): { metadataUri: string; imageUri: string } | null {
  if (!cachedMapping) {
    if (!existsSync(IPFS_URIS_FILE)) return null;
    cachedMapping = JSON.parse(readFileSync(IPFS_URIS_FILE, "utf-8"));
  }

  const key = String(crustieNumber).padStart(3, "0");
  const entry = cachedMapping![key] as IpfsEntry | undefined;
  if (!entry?.metadataUri || !entry?.imageUri) return null;
  return { metadataUri: entry.metadataUri, imageUri: entry.imageUri };
}

/**
 * Look up the curated trait data for a crustie by its 1-indexed number.
 * Returns null if not found.
 */
export function getCuratedTraits(
  crustieNumber: number
): CuratedCrustieEntry | null {
  if (!cachedMetadata) {
    if (!existsSync(CURATED_METADATA_FILE)) return null;
    cachedMetadata = JSON.parse(
      readFileSync(CURATED_METADATA_FILE, "utf-8")
    );
  }

  return (
    cachedMetadata!.find(
      (e) => parseInt(e.id, 10) === crustieNumber
    ) ?? null
  );
}
