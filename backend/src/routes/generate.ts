import { Hono } from "hono";
import {
  getOrAssign,
  getOrAssignByTier,
  reassignByTier,
  getAssignment,
  indexToCrustieNumber,
} from "../assignment.js";
import { getPrePinnedUri, getCuratedTraits } from "../ipfs-lookup.js";
import { signMintPermit } from "../signer.js";
import { getNonce } from "../nonce.js";
import { fetchFarcasterUser } from "../farcaster.js";
import { fetchOnChainData } from "../onchain.js";
import { computeTraits, rarityScoreToTier } from "../personality.js";
import type { CrustiesTraits } from "../personality.js";
import type { Hex } from "viem";

const generateRoute = new Hono();

generateRoute.post("/generate", async (c) => {
  const body = await c.req.json();
  const fid = body.fid as number;
  const minterAddress = body.minterAddress as string | undefined;
  const forceRegenerate = body.forceRegenerate === true;

  console.log("[generate] Request received:", { fid, minterAddress, forceRegenerate });

  if (!fid || typeof fid !== "number") {
    console.log("[generate] Invalid fid:", fid);
    return c.json({ error: "fid (number) is required" }, 400);
  }

  try {
    // ── Fast path: FID already assigned and not re-rolling ──────────────
    const existingIdx = getAssignment(fid);
    if (existingIdx !== null && !forceRegenerate) {
      console.log("[generate] Returning cached assignment for fid", fid);
      return c.json(await buildResponse(existingIdx, fid, minterAddress));
    }

    // ── Dynamic personality pipeline ────────────────────────────────────
    let rarityTier = "Common";
    let personalityTraits = null;

    try {
      // 1. Fetch Farcaster user data
      console.log("[generate] Fetching Farcaster data for fid", fid);
      const fcUser = await fetchFarcasterUser(fid);
      console.log("[generate] Farcaster user:", fcUser.username, "| followers:", fcUser.followerCount, "| neynarScore:", fcUser.neynarScore);

      // 2. Fetch on-chain data using first verified address
      const walletAddress = minterAddress || fcUser.verifiedAddresses[0];
      console.log("[generate] Fetching on-chain data for", walletAddress || "no address");
      const onChainData = await fetchOnChainData(walletAddress);
      console.log("[generate] On-chain:", { txCount: onChainData.txCount, hasNFTs: onChainData.hasNFTs, hasDeFi: onChainData.hasDeFiActivity });

      // 3. Compute personality traits
      const traits = computeTraits(fcUser, onChainData);
      console.log("[generate] Computed traits:", { vibe: traits.vibe, rarityScore: traits.rarityScore });

      // 4. Map rarity score to tier
      rarityTier = rarityScoreToTier(traits.rarityScore);
      console.log("[generate] Rarity tier:", rarityTier, "(score:", traits.rarityScore, ")");

      personalityTraits = traits;
    } catch (err) {
      // Personality pipeline failed — fall back to random assignment
      console.warn("[generate] Personality pipeline failed, falling back to random assignment:", err);
    }

    // ── Assign crustie by tier ──────────────────────────────────────────
    let crustieIndex: number | null;

    if (forceRegenerate && existingIdx !== null) {
      // Re-roll: release current and pick new one in the same tier
      console.log("[generate] Re-rolling for fid", fid, "in tier", rarityTier);
      crustieIndex = reassignByTier(fid, rarityTier);
    } else if (personalityTraits) {
      // New assignment by computed tier
      crustieIndex = getOrAssignByTier(fid, rarityTier);
    } else {
      // Fallback: random assignment (personality pipeline failed)
      crustieIndex = getOrAssign(fid);
    }

    console.log("[generate] Assignment:", { fid, crustieIndex, rarityTier });

    if (crustieIndex === null) {
      console.log("[generate] All crusties assigned — sold out");
      return c.json(
        { error: "All 499 Crusties have been assigned. The collection is sold out!" },
        410
      );
    }

    return c.json(
      await buildResponse(crustieIndex, fid, minterAddress, personalityTraits, rarityTier)
    );
  } catch (err) {
    console.error("[generate] FAILED:", err);
    return c.json({ error: "Generation failed" }, 500);
  }
});

/** Build the JSON response for a given crustie index. */
async function buildResponse(
  crustieIndex: number,
  fid: number,
  minterAddress?: string,
  personalityTraits?: CrustiesTraits | null,
  rarityTier?: string
) {
  const crustieNumber = indexToCrustieNumber(crustieIndex);
  console.log("[generate] Crustie number:", crustieNumber);

  // Look up pre-pinned IPFS URIs
  const prePinned = getPrePinnedUri(crustieNumber);
  if (!prePinned) {
    throw new Error(`Metadata not yet pinned for crustie ${crustieNumber}`);
  }

  // Look up curated visual traits
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

  // Sign mint permit if minterAddress provided
  let signature: string | undefined;
  let nonce: string | undefined;

  if (
    minterAddress &&
    minterAddress !== "0x0000000000000000000000000000000000000000"
  ) {
    console.log("[generate] Signing mint permit for", minterAddress);
    const currentNonce = await getNonce(minterAddress as Hex);
    signature = await signMintPermit(
      minterAddress as Hex,
      prePinned.metadataUri,
      currentNonce
    );
    console.log("[generate] Signature generated:", signature?.slice(0, 20) + "...");
    nonce = currentNonce.toString();
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
    // Include personality data when available
    ...(personalityTraits && { personalityTraits }),
    ...(rarityTier && { rarityTier }),
  };

  console.log("[generate] Response:", {
    ipfsUri: response.ipfsUri.slice(0, 40),
    hasSignature: !!response.signature,
    crustieIndex: response.crustieIndex,
    rarityTier: rarityTier || "cached",
  });

  return response;
}

export { generateRoute };
