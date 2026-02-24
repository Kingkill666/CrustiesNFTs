import { describe, it, expect } from "vitest";
import { computeTraits } from "../personality.js";
import type { FarcasterUser } from "../farcaster.js";
import type { OnChainData } from "../onchain.js";

function mockUser(overrides: Partial<FarcasterUser> = {}): FarcasterUser {
  return {
    fid: 12345,
    username: "testuser",
    displayName: "Test User",
    bio: "Just a test user",
    followerCount: 100,
    followingCount: 50,
    verifiedAddresses: ["0x1234567890abcdef1234567890abcdef12345678"],
    castCount: 25,
    recastCount: 10,
    likeCount: 50,
    recentCasts: [],
    ...overrides,
  };
}

function mockOnChain(overrides: Partial<OnChainData> = {}): OnChainData {
  return {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    ethBalance: "0.5",
    txCount: 30,
    hasNFTs: true,
    hasDeFiActivity: false,
    usdcBalance: "500",
    ...overrides,
  };
}

describe("computeTraits", () => {
  it("returns all required trait fields", () => {
    const traits = computeTraits(mockUser(), mockOnChain());

    expect(traits).toHaveProperty("crust");
    expect(traits).toHaveProperty("cheese");
    expect(traits).toHaveProperty("topping");
    expect(traits).toHaveProperty("sauce");
    expect(traits).toHaveProperty("eyes");
    expect(traits).toHaveProperty("nose");
    expect(traits).toHaveProperty("background");
    expect(traits).toHaveProperty("accessory");
    expect(traits).toHaveProperty("vibe");
    expect(traits).toHaveProperty("rarityScore");
  });

  it("is deterministic — same FID produces same traits", () => {
    const traits1 = computeTraits(mockUser(), mockOnChain());
    const traits2 = computeTraits(mockUser(), mockOnChain());

    expect(traits1).toEqual(traits2);
  });

  it("different FIDs produce different traits", () => {
    const traits1 = computeTraits(mockUser({ fid: 1 }), mockOnChain());
    const traits2 = computeTraits(mockUser({ fid: 9999 }), mockOnChain());

    // At least some traits should differ
    const allSame =
      traits1.crust === traits2.crust &&
      traits1.topping === traits2.topping &&
      traits1.nose === traits2.nose &&
      traits1.background === traits2.background;

    expect(allSame).toBe(false);
  });

  it("assigns DeFi Degen vibe for heavy on-chain users", () => {
    const traits = computeTraits(
      mockUser(),
      mockOnChain({ hasDeFiActivity: true, txCount: 300 })
    );

    expect(traits.vibe).toBe("DeFi Degen");
  });

  it("assigns NFT Collector vibe for NFT holders", () => {
    const traits = computeTraits(
      mockUser({ castCount: 3, likeCount: 5 }),
      mockOnChain({ hasNFTs: true, hasDeFiActivity: false, txCount: 30 })
    );

    expect(traits.vibe).toBe("NFT Collector");
  });

  it("assigns Lurker vibe for inactive users", () => {
    const traits = computeTraits(
      mockUser({ castCount: 2, likeCount: 1 }),
      mockOnChain({ hasNFTs: false, hasDeFiActivity: false, txCount: 5 })
    );

    expect(traits.vibe).toBe("Lurker");
  });

  it("assigns cosmic_purple background for high USDC holders", () => {
    const traits = computeTraits(
      mockUser(),
      mockOnChain({ usdcBalance: "50000" })
    );

    expect(traits.background).toBe("cosmic_purple");
  });

  it("assigns gold_chain accessory for DeFi + NFT users", () => {
    const traits = computeTraits(
      mockUser(),
      mockOnChain({ hasDeFiActivity: true, hasNFTs: true })
    );

    expect(traits.accessory).toBe("gold_chain");
  });

  it("rarity score is between 0 and 100", () => {
    const traits = computeTraits(mockUser(), mockOnChain());
    expect(traits.rarityScore).toBeGreaterThanOrEqual(0);
    expect(traits.rarityScore).toBeLessThanOrEqual(100);
  });

  it("picks truffle topping for DeFi-related casts", () => {
    const traits = computeTraits(
      mockUser({
        recentCasts: [
          { text: "Just did a defi swap!", timestamp: "", likes: 0, recasts: 0, replies: 0 },
        ],
      }),
      mockOnChain()
    );

    expect(traits.topping).toBe("truffle");
  });
});
