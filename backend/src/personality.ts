import type { FarcasterUser } from "./farcaster.js";
import type { OnChainData } from "./onchain.js";

export interface CrustiesTraits {
  // The 10 trait signals mapped to pizza attributes
  crust: string;        // Account age proxy (tx count)
  sauce: string;        // Cast tone (positive/negative sentiment proxy)
  cheese: string;       // Engagement rate (likes / casts)
  topping: string;      // Topics (keywords in casts)
  eyes: string;         // Neynar score proxy (follower count)
  nose: string;         // Cast frequency (cast count)
  background: string;   // Social presence (follower count tier)
  accessory: string;    // Follower count
  drizzle: string;      // Follower ratio (follower/following ratio)
  vibe: string;         // Everything combined
  rarityScore: number;
}

// ─── Trait pools ───────────────────────────────────────────────────────────────

// Crust ← Account age (tx count as proxy: more txs = older account)
const CRUSTS = ["thin", "thick", "stuffed", "deep_dish", "cauliflower"];

// Sauce ← Cast tone (keyword-based sentiment)
const SAUCES = ["classic_red", "white_alfredo", "pesto", "bbq", "hot_honey"];

// Cheese ← Engagement rate
const CHEESES = [
  "classic_mozzarella",
  "extra_melty",
  "four_cheese",
  "vegan_cashew",
  "smoked_gouda",
];

// Topping ← Topics from casts
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

// Eyes ← Neynar score proxy (follower count tier)
const EYES = ["wide_open", "sleepy", "laser", "heart", "pizza_eyes"];

// Nose ← Cast frequency
const NOSES = ["button", "triangle", "dot", "pepperoni_nose"];

// Background ← Social presence (follower count absolute)
const BACKGROUNDS = [
  "pepperoni_red",
  "cheese_yellow",
  "basil_green",
  "night_blue",
  "cosmic_purple",
  "plain_white",
];

// Accessory ← On-chain activity (NFTs, DeFi)
const ACCESSORIES = [
  "none",
  "chef_hat",
  "sunglasses",
  "gold_chain",
  "crown",
  "headphones",
];

// Drizzle ← Follower ratio (follower/following)
const DRIZZLES = [
  "olive_oil",     // neutral ratio (~1:1)
  "hot_sauce",     // high ratio (many followers, few following = influencer)
  "ranch",         // low ratio (following many, few follow back = lurker)
  "balsamic",      // very high ratio (mega influencer)
  "garlic_butter", // unknown / new account
];

// Vibe ← Composite of everything
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

// ─── Seeded RNG ────────────────────────────────────────────────────────────────

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

// ─── Main trait computation ────────────────────────────────────────────────────

export function computeTraits(
  user: FarcasterUser,
  onChain: OnChainData
): CrustiesTraits {
  // Deterministic seed based on FID
  const rand = seededRandom(user.fid * 7919 + 42);

  const allText = user.recentCasts.map((c) => c.text.toLowerCase()).join(" ");
  const engagementRate =
    user.castCount > 0 ? user.likeCount / user.castCount : 0;
  const followerRatio =
    user.followingCount > 0
      ? user.followerCount / user.followingCount
      : user.followerCount > 0
      ? 99
      : 0;
  const usdcBalance = parseFloat(onChain.usdcBalance);

  // ── 1. Crust ← Account age (tx count proxy) ──────────────────────────────
  const crustIndex = Math.min(
    Math.floor(onChain.txCount / 100),
    CRUSTS.length - 1
  );
  const crust = CRUSTS[crustIndex];

  // ── 2. Sauce ← Cast tone (keyword-based sentiment proxy) ─────────────────
  let sauce: string;
  if (
    allText.includes("love") ||
    allText.includes("great") ||
    allText.includes("happy") ||
    allText.includes("excited")
  ) {
    sauce = "hot_honey"; // positive / enthusiastic
  } else if (
    allText.includes("build") ||
    allText.includes("ship") ||
    allText.includes("deploy")
  ) {
    sauce = "pesto"; // builder / technical
  } else if (
    allText.includes("defi") ||
    allText.includes("yield") ||
    allText.includes("apy")
  ) {
    sauce = "white_alfredo"; // defi-brained
  } else if (
    allText.includes("wen") ||
    allText.includes("gm") ||
    allText.includes("wagmi")
  ) {
    sauce = "bbq"; // crypto culture
  } else {
    sauce = pick(SAUCES, rand);
  }

  // ── 3. Cheese ← Engagement rate (likes per cast) ─────────────────────────
  // CHEESES = ["classic_mozzarella", "extra_melty", "four_cheese", "vegan_cashew", "smoked_gouda"]
  let cheese: string;
  if (engagementRate >= 10) {
    cheese = CHEESES[4]; // smoked_gouda — very high engagement
  } else if (engagementRate >= 5) {
    cheese = CHEESES[2]; // four_cheese
  } else if (engagementRate >= 2) {
    cheese = CHEESES[1]; // extra_melty
  } else if (engagementRate >= 0.5) {
    cheese = CHEESES[0]; // classic_mozzarella
  } else {
    cheese = CHEESES[3]; // vegan_cashew — low engagement
  }

  // ── 4. Topping ← Topics (keywords in casts) ──────────────────────────────
  let topping: string;
  if (allText.includes("defi") || allText.includes("swap") || allText.includes("lp")) {
    topping = "truffle";
  } else if (allText.includes("art") || allText.includes("design") || allText.includes("nft")) {
    topping = "basil";
  } else if (allText.includes("sport") || allText.includes("game") || allText.includes("gaming")) {
    topping = "pepperoni";
  } else if (allText.includes("hot take") || allText.includes("actually") || allText.includes("unpopular")) {
    topping = "pineapple";
  } else if (allText.includes("gm") || allText.includes("wagmi") || allText.includes("wen")) {
    topping = "buffalo_chicken";
  } else if (allText.includes("build") || allText.includes("code") || allText.includes("dev")) {
    topping = "mushroom";
  } else {
    topping = pick(TOPPINGS, rand);
  }

  // ── 5. Eyes ← Neynar score proxy (follower count tier) ───────────────────
  // EYES = ["wide_open", "sleepy", "laser", "heart", "pizza_eyes"]
  let eyes: string;
  if (user.followerCount >= 10000) {
    eyes = EYES[2]; // laser — big account
  } else if (user.followerCount >= 2000) {
    eyes = EYES[3]; // heart
  } else if (user.followerCount >= 500) {
    eyes = EYES[0]; // wide_open
  } else if (user.followerCount >= 100) {
    eyes = EYES[4]; // pizza_eyes
  } else {
    eyes = EYES[1]; // sleepy — small / new account
  }

  // ── 6. Nose ← Cast frequency (casts per recent batch) ────────────────────
  // NOSES = ["button", "triangle", "dot", "pepperoni_nose"]
  let nose: string;
  if (user.castCount >= 40) {
    nose = NOSES[3]; // pepperoni_nose — very active
  } else if (user.castCount >= 20) {
    nose = NOSES[0]; // button
  } else if (user.castCount >= 5) {
    nose = NOSES[1]; // triangle
  } else {
    nose = NOSES[2]; // dot — rarely casts
  }

  // ── 7. Background ← Social presence (follower count tier) ────────────────
  let background: string;
  if (usdcBalance > 10000) {
    background = "cosmic_purple"; // whale
  } else if (user.followerCount >= 5000) {
    background = "night_blue"; // notable presence
  } else if (user.followerCount >= 1000) {
    background = "cheese_yellow"; // solid presence
  } else if (user.followerCount >= 200) {
    background = "basil_green"; // growing
  } else if (onChain.hasDeFiActivity) {
    background = "pepperoni_red"; // on-chain active
  } else {
    background = pick(BACKGROUNDS, rand);
  }

  // ── 8. Accessory ← On-chain activity ─────────────────────────────────────
  let accessory: string;
  if (onChain.hasDeFiActivity && onChain.hasNFTs) {
    accessory = "gold_chain"; // full degen
  } else if (onChain.hasDeFiActivity) {
    accessory = "sunglasses"; // defi user
  } else if (onChain.hasNFTs) {
    accessory = "crown"; // nft holder
  } else if (user.followerCount > 1000) {
    accessory = "chef_hat"; // social influencer
  } else {
    accessory = pick(ACCESSORIES, rand);
  }

  // ── 9. Drizzle ← Follower ratio ──────────────────────────────────────────
  // DRIZZLES = ["olive_oil", "hot_sauce", "ranch", "balsamic", "garlic_butter"]
  let drizzle: string;
  if (user.followingCount === 0 && user.followerCount === 0) {
    drizzle = DRIZZLES[4]; // garlic_butter — brand new / ghost account
  } else if (followerRatio >= 10) {
    drizzle = DRIZZLES[3]; // balsamic — mega influencer
  } else if (followerRatio >= 3) {
    drizzle = DRIZZLES[1]; // hot_sauce — influencer
  } else if (followerRatio >= 0.8) {
    drizzle = DRIZZLES[0]; // olive_oil — balanced ratio
  } else {
    drizzle = DRIZZLES[2]; // ranch — lurker / new
  }

  // ── 10. Vibe ← Composite ─────────────────────────────────────────────────
  let vibe: string;
  if (onChain.hasDeFiActivity && onChain.txCount > 200) {
    vibe = "DeFi Degen";
  } else if (onChain.hasNFTs && user.followerCount > 500) {
    vibe = "NFT Collector";
  } else if (user.castCount > 40 && engagementRate > 5) {
    vibe = "Shitposter Supreme";
  } else if (user.castCount < 5) {
    vibe = "Lurker";
  } else if (allText.includes("build") || allText.includes("ship") || allText.includes("dev")) {
    vibe = "Builder";
  } else if (allText.includes("art") || allText.includes("design") || allText.includes("creative")) {
    vibe = "Artist";
  } else if (
    allText.includes("govern") ||
    allText.includes("proposal") ||
    allText.includes("vote")
  ) {
    vibe = "Governance Gigachad";
  } else {
    vibe = pick(VIBES, rand);
  }

  // ── Rarity score: 0–100 ───────────────────────────────────────────────────
  const rarityScore = Math.min(
    100,
    Math.floor(
      rand() * 30 +
        (onChain.txCount > 100 ? 20 : 0) +
        (user.followerCount > 500 ? 15 : 0) +
        (usdcBalance > 1000 ? 15 : 0) +
        (user.castCount > 30 ? 10 : 0) +
        (engagementRate > 5 ? 10 : 0)
    )
  );

  return {
    crust,
    sauce,
    cheese,
    topping,
    eyes,
    nose,
    background,
    accessory,
    drizzle,
    vibe,
    rarityScore,
  };
}
