import { Hono } from "hono";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fetchFarcasterUser } from "../farcaster.js";
import { fetchOnChainData } from "../onchain.js";
import { computeTraits, type CrustiesTraits } from "../personality.js";
import { pinToIPFS } from "../ipfs.js";
import { buildMetadata } from "../metadata.js";
import { getOrAssign } from "../assignment.js";
import { signMintPermit } from "../signer.js";
import { getNonce } from "../nonce.js";
import type { Hex } from "viem";

const generateRoute = new Hono();

// Cache: FID → generation result (survives the request but not server restart)
// The image/metadata are already pinned to IPFS so this is just for deduplication
// within a server session. Assignments are persisted to disk via assignment.ts.
const generationCache = new Map<
  number,
  { ipfsUri: string; imageUrl: string; traits: CrustiesTraits; crustieIndex: number }
>();

// Path to the pre-generated crustie PNG files.
// At runtime (dev via tsx from src/routes/, or built from dist/routes/),
// we resolve relative to the process working directory (repo root).
// CRUSTIES_IMAGE_DIR env var lets you override in production.
const CRUSTIES_DIR =
  process.env.CRUSTIES_IMAGE_DIR ||
  resolve(process.cwd(), "public/images/Crusties");

function crustieFilePath(index: number): string {
  const padded = String(index).padStart(3, "0");
  return resolve(CRUSTIES_DIR, `crustie-${padded}.png`);
}

generateRoute.post("/generate", async (c) => {
  const body = await c.req.json();
  const fid = body.fid as number;
  const minterAddress = body.minterAddress as string | undefined;

  if (!fid || typeof fid !== "number") {
    return c.json({ error: "fid (number) is required" }, 400);
  }

  try {
    // Check in-memory cache for the generation result (keyed by FID)
    let genResult = generationCache.get(fid);

    if (!genResult) {
      // 1. Assign a crustie index to this FID (one-to-one, never reused)
      const crustieIndex = getOrAssign(fid);
      if (crustieIndex === null) {
        return c.json({ error: "All 501 Crusties have been assigned. The collection is sold out!" }, 410);
      }

      // 2. Fetch Farcaster profile + cast data
      const farcasterData = await fetchFarcasterUser(fid);

      // 3. Fetch on-chain activity from Base
      const onChainData = await fetchOnChainData(
        farcasterData.verifiedAddresses[0]
      );

      // 4. Compute trait vector from personality analysis
      const traits = computeTraits(farcasterData, onChainData);

      // 5. Load the pre-generated PNG for this crustie index
      const imageBuffer = readFileSync(crustieFilePath(crustieIndex));

      // 6. Pin image to IPFS
      const padded = String(crustieIndex).padStart(3, "0");
      const imageCid = await pinToIPFS(
        Buffer.from(imageBuffer),
        `crustie-${padded}.png`
      );
      const imageUrl = `ipfs://${imageCid}`;

      // 7. Build metadata JSON with the crustie index as the NFT number
      const metadata = buildMetadata(crustieIndex, imageUrl, traits);
      const metadataCid = await pinToIPFS(
        Buffer.from(JSON.stringify(metadata)),
        `crustie-${padded}-metadata.json`
      );
      const ipfsUri = `ipfs://${metadataCid}`;

      genResult = { ipfsUri, imageUrl, traits, crustieIndex };
      generationCache.set(fid, genResult);
    }

    // 8. Sign a mint permit if minterAddress is provided
    //    Always sign fresh (nonce may have changed since last call)
    let signature: string | undefined;
    let nonce: string | undefined;

    if (minterAddress && minterAddress !== "0x0000000000000000000000000000000000000000") {
      const currentNonce = await getNonce(minterAddress as Hex);
      signature = await signMintPermit(
        minterAddress as Hex,
        genResult.ipfsUri,
        currentNonce
      );
      nonce = currentNonce.toString();
    }

    return c.json({
      ...genResult,
      signature,
      nonce,
    });
  } catch (err) {
    console.error("Generation failed:", err);
    return c.json({ error: "Generation failed" }, 500);
  }
});

export { generateRoute };
