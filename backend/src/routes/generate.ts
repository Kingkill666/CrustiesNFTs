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

  console.log("[generate] Request received:", { fid, minterAddress });

  if (!fid || typeof fid !== "number") {
    console.log("[generate] Invalid fid:", fid);
    return c.json({ error: "fid (number) is required" }, 400);
  }

  try {
    // 1. Assign a crustie index to this FID (0-498, one-to-one)
    const crustieIndex = getOrAssign(fid);
    console.log("[generate] Assignment:", { fid, crustieIndex });
    if (crustieIndex === null) {
      console.log("[generate] All crusties assigned — sold out");
      return c.json(
        { error: "All 499 Crusties have been assigned. The collection is sold out!" },
        410
      );
    }

    // 2. Convert to crustie number (skips 103 which has no image)
    const crustieNumber = indexToCrustieNumber(crustieIndex);
    console.log("[generate] Crustie number:", crustieNumber);

    // 3. Look up pre-pinned IPFS URIs
    const prePinned = getPrePinnedUri(crustieNumber);
    console.log("[generate] Pre-pinned:", prePinned ? { metadataUri: prePinned.metadataUri.slice(0, 40), imageUri: prePinned.imageUri.slice(0, 40) } : "NOT FOUND");
    if (!prePinned) {
      return c.json(
        { error: "Metadata not yet pinned for this crustie. Run batch-pin.ts first." },
        503
      );
    }

    // 4. Look up curated traits for the frontend
    const curatedEntry = getCuratedTraits(crustieNumber);
    console.log("[generate] Curated traits:", curatedEntry ? curatedEntry.name : "NOT FOUND");
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

    console.log("[generate] Signing check:", {
      minterAddress,
      hasSIGNER_PRIVATE_KEY: !!process.env.SIGNER_PRIVATE_KEY,
      hasCONTRACT_ADDRESS: !!process.env.CRUSTIES_CONTRACT_ADDRESS,
    });

    if (
      minterAddress &&
      minterAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      console.log("[generate] Fetching nonce for", minterAddress);
      const currentNonce = await getNonce(minterAddress as Hex);
      console.log("[generate] Nonce:", currentNonce.toString());

      console.log("[generate] Signing mint permit...");
      signature = await signMintPermit(
        minterAddress as Hex,
        prePinned.metadataUri,
        currentNonce
      );
      console.log("[generate] Signature generated:", signature?.slice(0, 20) + "...");
      nonce = currentNonce.toString();
    } else {
      console.log("[generate] No minterAddress provided — skipping signature");
    }

    // Convert ipfs:// URI to gateway URL for frontend display
    const imageGatewayUrl = prePinned.imageUri.replace(
      "ipfs://",
      "https://gateway.pinata.cloud/ipfs/"
    );

    const response = {
      ipfsUri: prePinned.metadataUri,
      imageUrl: imageGatewayUrl,
      traits,
      crustieIndex,
      signature,
      nonce,
    };
    console.log("[generate] Returning response:", {
      ipfsUri: response.ipfsUri.slice(0, 40),
      hasSignature: !!response.signature,
      crustieIndex: response.crustieIndex,
    });

    return c.json(response);
  } catch (err) {
    console.error("[generate] FAILED:", err);
    return c.json({ error: "Generation failed" }, 500);
  }
});

export { generateRoute };
