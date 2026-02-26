'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CRUSTIES_CONTRACT_ADDRESS, CRUSTIES_ABI } from '@/lib/contract';
import type { GalleryEntry } from '@/features/app/types';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
const GALLERY_SIZE = 9;

function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice(7);
  return uri;
}

// Placeholder gallery using the 9 real Crustie grid images
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

const ROTATIONS = ['-3deg', '2deg', '-1deg', '3deg', '-2deg', '1deg', '-4deg', '2deg', '-1deg'];

/**
 * Fetches real minted Crusties from the contract and merges them into the gallery.
 * Real mints take the first slots, placeholders fill the rest up to 9.
 */
export function useGallery(limit = GALLERY_SIZE) {
  const publicClient = usePublicClient();
  const [entries, setEntries] = useState<GalleryEntry[]>(PLACEHOLDER_GALLERY.slice(0, limit));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || CRUSTIES_CONTRACT_ADDRESS === '0x') {
      setEntries(PLACEHOLDER_GALLERY.slice(0, limit));
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGallery() {
      setIsLoading(true);
      try {
        // Read totalMinted from the contract
        const totalMinted = await publicClient!.readContract({
          address: CRUSTIES_CONTRACT_ADDRESS,
          abi: CRUSTIES_ABI,
          functionName: 'totalMinted',
        });

        const count = Number(totalMinted);
        console.log('[useGallery] totalMinted:', count);

        if (count === 0) {
          if (!cancelled) {
            setEntries(PLACEHOLDER_GALLERY.slice(0, limit));
            setIsLoading(false);
          }
          return;
        }

        // Fetch the most recent minted tokens (up to `limit`)
        // Token IDs are sequential: 1, 2, 3, ..., totalMinted
        const fetchCount = Math.min(count, limit);
        const realEntries: GalleryEntry[] = [];

        // Fetch newest first
        for (let i = count; i > count - fetchCount && i >= 1; i--) {
          try {
            const tokenId = BigInt(i);

            // Get owner address
            const ownerAddr = await publicClient!.readContract({
              address: CRUSTIES_CONTRACT_ADDRESS,
              abi: CRUSTIES_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }) as string;

            // Get tokenURI
            const uri = await publicClient!.readContract({
              address: CRUSTIES_CONTRACT_ADDRESS,
              abi: CRUSTIES_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }) as string;

            // Fetch metadata from IPFS
            let imageUrl = '';
            let minterUsername = `${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)}`;

            try {
              const metadataUrl = ipfsToHttp(uri);
              const res = await fetch(metadataUrl);
              if (res.ok) {
                const metadata = await res.json();
                imageUrl = metadata.image ? ipfsToHttp(metadata.image) : '';
              }
            } catch (err) {
              console.warn('[useGallery] Failed to fetch metadata for token', i, err);
            }

            // Try to resolve owner to Farcaster username via Neynar
            try {
              const neynarRes = await fetch(
                `https://api.neynar.com/v2/farcaster/user/by_verification?address=${ownerAddr}`,
                { headers: { 'x-api-key': 'NEYNAR_API_DOCS' } }
              );
              if (neynarRes.ok) {
                const neynarData = await neynarRes.json();
                if (neynarData?.user?.username) {
                  minterUsername = neynarData.user.username;
                }
              }
            } catch {
              // Non-critical — fall back to shortened address
            }

            const idx = realEntries.length;
            realEntries.push({
              tokenId: Number(tokenId),
              imageUrl,
              minterUsername,
              rotation: ROTATIONS[idx % ROTATIONS.length],
              flipX: idx % 2 === 1,
              filter: 'none',
            });
          } catch (err) {
            console.warn('[useGallery] Failed to read token', i, err);
          }
        }

        if (cancelled) return;

        // Fill remaining slots with placeholders (newest mints first, then placeholders)
        const remaining = limit - realEntries.length;
        const fillerPlaceholders = PLACEHOLDER_GALLERY.slice(0, Math.max(0, remaining));
        setEntries([...realEntries, ...fillerPlaceholders]);
      } catch (err) {
        console.error('[useGallery] Error:', err);
        if (!cancelled) {
          setEntries(PLACEHOLDER_GALLERY.slice(0, limit));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchGallery();

    return () => { cancelled = true; };
  }, [publicClient, limit]);

  return { entries, isLoading };
}
