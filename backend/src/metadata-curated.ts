/**
 * metadata-curated.ts
 *
 * Builds ERC-721 standard metadata JSON from the artist's curated trait data
 * (parsed from the RTF file). Used by the batch-pin script and the generate route.
 */

import type { NFTMetadata } from "./metadata.js";

export interface CuratedCrustieEntry {
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

/**
 * Build an OpenSea-compatible ERC-721 metadata JSON from a curated entry.
 *
 * @param entry        The curated trait data from crusties-metadata.json
 * @param imageIpfsUri The IPFS URI of the pinned image (e.g. "ipfs://QmXyz...")
 */
export function buildCuratedMetadata(
  entry: CuratedCrustieEntry,
  imageIpfsUri: string
): NFTMetadata {
  const displayNumber = parseInt(entry.id, 10); // 1-500

  return {
    name: `Crusties #${displayNumber}`,
    description:
      "A one-of-a-kind pizza NFT from the Crusties collection on Base. 500 hand-crafted pizza characters with unique vibes.",
    image: imageIpfsUri,
    external_url: `https://crusties.xyz/nft/${displayNumber}`,
    attributes: [
      { trait_type: "Name", value: entry.name },
      { trait_type: "Cheese", value: entry.cheese },
      { trait_type: "Eyes", value: entry.eyes },
      { trait_type: "Toppings", value: entry.toppings },
      { trait_type: "Background", value: entry.background },
      { trait_type: "Crust", value: entry.crust },
      { trait_type: "Vibe", value: entry.vibe },
      { trait_type: "Rarity", value: entry.rarity },
    ],
  };
}
