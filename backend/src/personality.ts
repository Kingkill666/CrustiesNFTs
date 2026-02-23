import type { FarcasterUser } from "./farcaster.js";
import type { OnChainData } from "./onchain.js";

export interface CrustiesTraits {
  crust: string;
  cheese: string;
  topping: string;
  sauce: string;
  eyes: string;
  nose: string;
  background: string;
  accessory: string;
  vibe: string;
  rarityScore: number;
}

const CRUSTS = ["thin", "thick", "stuffed", "deep_dish", "cauliflower"];
const CHEESES = [
  "classic_mozzarella",
  "extra_melty",
  "four_cheese",
  "vegan_cashew",
  "smoked_gouda",
];
const TOPPINGS = [
  "pepperoni",
  "mushroom",
  "pineapple",
  "basil",
  "jalapeño",
  "truffle",
  "anchovy",
  "buffalo_chicken",
];
const SAUCES = ["classic_red", "white_alfredo", "pesto", "bbq", "hot_honey"];
const EYES = ["wide_open", "sleepy", "laser", "heart", "pizza_eyes"];
const NOSES = ["button", "triangle", "dot", "pepperoni_nose"];
const BACKGROUNDS = [
  "pepperoni_red",
  "cheese_yellow",
  "basil_green",
  "night_blue",
  "cosmic_purple",
  "plain_white",
];
const ACCESSORIES = [
  "none",
  "chef_hat",
  "sunglasses",
  "gold_chain",
  "crown",
  "headphones",
];
const VIBES = [
  "DeFi Degen",
  "NFT Collector",
  "Governance Gigachad",
  "Lurker",
  "Shitposter Supreme",
  "Builder",
  "Artist",
  "Normie",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function computeTraits(
  user: FarcasterUser,
  onChain: OnChainData
): CrustiesTraits {
  // Seed based on FID for deterministic output
  const rand = seededRandom(user.fid * 7919 + 42);

  // Crust: based on cast frequency
  const crustIndex = Math.min(
    Math.floor(user.castCount / 10),
    CRUSTS.length - 1
  );
  const crust = CRUSTS[crustIndex];

  // Cheese: based on engagement (likes received)
  const cheeseIndex = Math.min(
    Math.floor(user.likeCount / 20),
    CHEESES.length - 1
  );
  const cheese = CHEESES[cheeseIndex];

  // Topping: based on cast content keywords
  const allText = user.recentCasts.map((c) => c.text.toLowerCase()).join(" ");
  let topping: string;
  if (allText.includes("defi") || allText.includes("swap")) {
    topping = "truffle";
  } else if (allText.includes("art") || allText.includes("design")) {
    topping = "basil";
  } else if (allText.includes("sport") || allText.includes("game")) {
    topping = "pepperoni";
  } else if (allText.includes("hot take") || allText.includes("contrarian")) {
    topping = "pineapple";
  } else {
    topping = pick(TOPPINGS, rand);
  }

  // Sauce: based on wallet age (tx count as proxy)
  const sauceIndex = Math.min(
    Math.floor(onChain.txCount / 100),
    SAUCES.length - 1
  );
  const sauce = SAUCES[sauceIndex];

  // Eyes: based on follower count
  const eyeIndex = Math.min(
    Math.floor(user.followerCount / 500),
    EYES.length - 1
  );
  const eyes = EYES[eyeIndex];

  // Nose: seeded random
  const nose = pick(NOSES, rand);

  // Background: based on token holdings
  const pizzaBalance = parseFloat(onChain.pizzaBalance);
  let background: string;
  if (pizzaBalance > 10000) {
    background = "cosmic_purple";
  } else if (pizzaBalance > 1000) {
    background = "cheese_yellow";
  } else if (onChain.hasDeFiActivity) {
    background = "night_blue";
  } else {
    background = pick(BACKGROUNDS, rand);
  }

  // Accessory: based on on-chain activity
  let accessory: string;
  if (onChain.hasDeFiActivity && onChain.hasNFTs) {
    accessory = "gold_chain";
  } else if (onChain.hasDeFiActivity) {
    accessory = "sunglasses";
  } else if (onChain.hasNFTs) {
    accessory = "crown";
  } else if (user.followerCount > 1000) {
    accessory = "chef_hat";
  } else {
    accessory = pick(ACCESSORIES, rand);
  }

  // Vibe: composite
  let vibe: string;
  if (onChain.hasDeFiActivity && onChain.txCount > 200) {
    vibe = "DeFi Degen";
  } else if (onChain.hasNFTs) {
    vibe = "NFT Collector";
  } else if (user.castCount > 40 && user.likeCount > 100) {
    vibe = "Shitposter Supreme";
  } else if (user.castCount < 5) {
    vibe = "Lurker";
  } else if (allText.includes("build") || allText.includes("ship")) {
    vibe = "Builder";
  } else {
    vibe = pick(VIBES, rand);
  }

  // Rarity score: 0-100 based on trait uniqueness
  const rarityScore = Math.min(
    100,
    Math.floor(
      rand() * 30 +
        (onChain.txCount > 100 ? 20 : 0) +
        (user.followerCount > 500 ? 20 : 0) +
        (pizzaBalance > 1000 ? 15 : 0) +
        (user.castCount > 30 ? 15 : 0)
    )
  );

  return {
    crust,
    cheese,
    topping,
    sauce,
    eyes,
    nose,
    background,
    accessory,
    vibe,
    rarityScore,
  };
}
