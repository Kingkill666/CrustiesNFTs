// ─── Crusties App Types ───────────────────────────────────────────────────────

export type Screen =
  | 'landing'
  | 'mint'
  | 'minting'
  | 'success'
  | 'owned';

export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type PaymentMethod = 'eth' | 'usdc';

export interface Trait {
  label: string;
  value: string;
  rarity: RarityTier;
  pct: number;
}

export interface GalleryEntry {
  tokenId: number;
  imageUrl: string;
  minterUsername: string;
  rotation: string;
  flipX: boolean;
  filter: string;
}

export interface OwnedCrustie {
  tokenId: number;
  imageUrl: string;
  vibe: string;
  rarity: RarityTier;
  txHash?: string;
  tokenURI?: string;
  traits?: { label: string; value: string }[];
}
