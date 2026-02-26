import type { CrustiesTraits } from "./personality.js";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

function formatTraitValue(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * @param crustieIndex  The 0-indexed crustie number (0–499). Used as the NFT name.
 * @param imageUrl      The ipfs:// URI for the image.
 * @param traits        The computed personality traits.
 */
export function buildMetadata(
  crustieIndex: number,
  imageUrl: string,
  traits: CrustiesTraits
): NFTMetadata {
  // Display as 1-indexed for human-friendly names (#1 through #500)
  const displayNumber = crustieIndex + 1;

  return {
    name: `Crusties #${displayNumber}`,
    description:
      "A one-of-a-kind pizza PFP based on your Farcaster vibe. Your traits are determined by 10 signals: account age, cast tone, engagement rate, topics, Neynar score, cast frequency, social presence, follower count, follower ratio, and your overall vibe.",
    image: imageUrl,
    external_url: `https://crusties.xyz/nft/${displayNumber}`,
    attributes: [
      // The 10 trait signals → pizza attributes
      {
        trait_type: "Crust",
        value: formatTraitValue(traits.crust),
      },
      {
        trait_type: "Sauce",
        value: formatTraitValue(traits.sauce),
      },
      {
        trait_type: "Cheese",
        value: formatTraitValue(traits.cheese),
      },
      {
        trait_type: "Topping",
        value: formatTraitValue(traits.topping),
      },
      {
        trait_type: "Eyes",
        value: formatTraitValue(traits.eyes),
      },
      {
        trait_type: "Nose",
        value: formatTraitValue(traits.nose),
      },
      {
        trait_type: "Background",
        value: formatTraitValue(traits.background),
      },
      {
        trait_type: "Accessory",
        value: formatTraitValue(traits.accessory),
      },
      {
        trait_type: "Drizzle",
        value: formatTraitValue(traits.drizzle),
      },
      {
        trait_type: "Vibe",
        value: traits.vibe,
      },
      {
        trait_type: "Rarity Score",
        display_type: "number",
        value: traits.rarityScore,
      },
    ],
  };
}
