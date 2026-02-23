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

export function buildMetadata(
  fid: number,
  imageUrl: string,
  traits: CrustiesTraits
): NFTMetadata {
  return {
    name: `Crusties #${fid}`,
    description:
      "A one-of-a-kind AI-generated pizza PFP based on your Farcaster vibe.",
    image: imageUrl,
    external_url: `https://crusties.xyz/nft/${fid}`,
    attributes: [
      { trait_type: "Crust", value: formatTraitValue(traits.crust) },
      { trait_type: "Cheese", value: formatTraitValue(traits.cheese) },
      { trait_type: "Topping", value: formatTraitValue(traits.topping) },
      { trait_type: "Sauce", value: formatTraitValue(traits.sauce) },
      { trait_type: "Eyes", value: formatTraitValue(traits.eyes) },
      { trait_type: "Nose", value: formatTraitValue(traits.nose) },
      { trait_type: "Background", value: formatTraitValue(traits.background) },
      { trait_type: "Accessory", value: formatTraitValue(traits.accessory) },
      { trait_type: "Vibe", value: traits.vibe },
      {
        trait_type: "Rarity Score",
        display_type: "number",
        value: traits.rarityScore,
      },
    ],
  };
}
