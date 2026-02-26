'use client';

import type { GalleryEntry } from '@/features/app/types';

// Placeholder gallery using the 9 real Crustie grid images
// In production this pulls from a live API endpoint
const PLACEHOLDER_GALLERY: GalleryEntry[] = [
  { tokenId: 7,   imageUrl: '/images/grid/crustie-007.png', minterUsername: 'pizza_degen',   rotation: '-3deg', flipX: false, filter: 'none' },
  { tokenId: 18,  imageUrl: '/images/grid/crustie-018.png', minterUsername: 'basebuilder',   rotation: '2deg',  flipX: true,  filter: 'hue-rotate(30deg)' },
  { tokenId: 33,  imageUrl: '/images/grid/crustie-033.png', minterUsername: 'slice_maxi',    rotation: '-1deg', flipX: false, filter: 'hue-rotate(200deg) saturate(1.3)' },
  { tokenId: 42,  imageUrl: '/images/grid/crustie-042.png', minterUsername: 'cryptoslice',   rotation: '3deg',  flipX: true,  filter: 'hue-rotate(280deg) saturate(1.2)' },
  { tokenId: 75,  imageUrl: '/images/grid/crustie-075.png', minterUsername: 'nft_goblin',    rotation: '-2deg', flipX: false, filter: 'hue-rotate(120deg) saturate(1.4)' },
  { tokenId: 115, imageUrl: '/images/grid/crustie-115.png', minterUsername: 'wagmi_pizza',   rotation: '1deg',  flipX: true,  filter: 'none' },
  { tokenId: 130, imageUrl: '/images/grid/crustie-130.png', minterUsername: 'farcaster_fan', rotation: '-4deg', flipX: false, filter: 'hue-rotate(60deg) saturate(1.2)' },
  { tokenId: 155, imageUrl: '/images/grid/crustie-155.png', minterUsername: 'onchain_vibes', rotation: '2deg',  flipX: true,  filter: 'hue-rotate(160deg) saturate(1.3)' },
  { tokenId: 177, imageUrl: '/images/grid/crustie-177.png', minterUsername: 'base_enjoyer',  rotation: '-1deg', flipX: false, filter: 'hue-rotate(310deg) saturate(1.1)' },
];

export function useGallery(limit = 10) {
  const entries = PLACEHOLDER_GALLERY.slice(0, limit);
  return { entries, isLoading: false };
}
