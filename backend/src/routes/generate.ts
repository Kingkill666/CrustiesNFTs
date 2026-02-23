import { Hono } from "hono";
import { fetchFarcasterUser } from "../farcaster.js";
import { fetchOnChainData } from "../onchain.js";
import { computeTraits } from "../personality.js";
import { generateImage } from "../generator.js";
import { pinToIPFS } from "../ipfs.js";
import { buildMetadata } from "../metadata.js";

const generateRoute = new Hono();

const generationCache = new Map<
  number,
  { ipfsUri: string; imageUrl: string; traits: Record<string, string> }
>();

generateRoute.post("/generate", async (c) => {
  const body = await c.req.json();
  const fid = body.fid as number;

  if (!fid || typeof fid !== "number") {
    return c.json({ error: "fid (number) is required" }, 400);
  }

  // Check cache — same FID produces same Crusties
  const cached = generationCache.get(fid);
  if (cached) {
    return c.json(cached);
  }

  try {
    // 1. Fetch Farcaster profile + cast data
    const farcasterData = await fetchFarcasterUser(fid);

    // 2. Fetch on-chain activity from Base
    const onChainData = await fetchOnChainData(
      farcasterData.verifiedAddresses[0]
    );

    // 3. Compute trait vector from personality analysis
    const traits = computeTraits(farcasterData, onChainData);

    // 4. Generate AI pizza image
    const imageBuffer = await generateImage(traits);

    // 5. Pin image to IPFS
    const imageCid = await pinToIPFS(imageBuffer, `crusties-${fid}.png`);
    const imageUrl = `ipfs://${imageCid}`;

    // 6. Build metadata JSON and pin to IPFS
    const metadata = buildMetadata(fid, imageUrl, traits);
    const metadataCid = await pinToIPFS(
      Buffer.from(JSON.stringify(metadata)),
      `crusties-${fid}-metadata.json`
    );
    const ipfsUri = `ipfs://${metadataCid}`;

    const result = { ipfsUri, imageUrl, traits };

    // Cache the result
    generationCache.set(fid, result);

    return c.json(result);
  } catch (err) {
    console.error("Generation failed:", err);
    return c.json({ error: "Generation failed" }, 500);
  }
});

export { generateRoute };
