import { Hono } from "hono";
import { getOrAssign, indexToCrustieNumber } from "../assignment.js";
import { getPrePinnedUri, getCuratedTraits } from "../ipfs-lookup.js";
import { signMintPermit } from "../signer.js";
import { getNonce } from "../nonce.js";
import type { Hex } from "viem";

const generateRoute = new Hono();

generateRoute.post("/generate", async (c) => {
  const body = await c.req.json();
  const fid = body.fid as number;
  const minterAddress = body.minterAddress as string | undefined;

  if (!fid || typeof fid !== "number") {
    return c.json({ error: "fid (number) is required" }, 400);
  }

  try {
    // 1. Assign a crustie index to this FID (0-498, one-to-one)
    const crustieIndex = getOrAssign(fid);
    if (crustieIndex === null) {
      return c.json(
        { error: "All 499 Crusties have been assigned. The collection is sold out!" },
        410
      );
    }

    // 2. Convert to crustie number (skips 103 which has no image)
    const crustieNumber = indexToCrustieNumber(crustieIndex);

    // 3. Look up pre-pinned IPFS URIs
    const prePinned = getPrePinnedUri(crustieNumber);
    if (!prePinned) {
      return c.json(
        { error: "Metadata not yet pinned for this crustie. Run batch-pin.ts first." },
        503
      );
    }

    // 4. Look up curated traits for the frontend
    const curatedEntry = getCuratedTraits(crustieNumber);
    const traits = curatedEntry
      ? {
          name: curatedEntry.name,
          cheese: curatedEntry.cheese,
          eyes: curatedEntry.eyes,
          toppings: curatedEntry.toppings,
          background: curatedEntry.background,
          crust: curatedEntry.crust,
          vibe: curatedEntry.vibe,
          rarity: curatedEntry.rarity,
        }
      : {};

    // 5. Sign mint permit if minterAddress provided
    let signature: string | undefined;
    let nonce: string | undefined;

    if (
      minterAddress &&
      minterAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      const currentNonce = await getNonce(minterAddress as Hex);
      signature = await signMintPermit(
        minterAddress as Hex,
        prePinned.metadataUri,
        currentNonce
      );
      nonce = currentNonce.toString();
    }

    // Convert ipfs:// URI to gateway URL for frontend display
    const imageGatewayUrl = prePinned.imageUri.replace(
      "ipfs://",
      "https://gateway.pinata.cloud/ipfs/"
    );

    return c.json({
      ipfsUri: prePinned.metadataUri,
      imageUrl: imageGatewayUrl,
      traits,
      crustieIndex,
      signature,
      nonce,
    });
  } catch (err) {
    console.error("Generation failed:", err);
    return c.json({ error: "Generation failed" }, 500);
  }
});

export { generateRoute };
