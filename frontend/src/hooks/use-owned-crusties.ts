'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { CRUSTIES_CONTRACT_ADDRESS, CRUSTIES_ABI } from '@/lib/contract';
import type { OwnedCrustie, RarityTier } from '@/features/app/types';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice(7);
  return uri;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Retry an async fn up to `retries` times with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[withRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
  throw new Error('unreachable');
}

export function useOwnedCrusties(_fid?: number) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [crusties, setCrusties] = useState<OwnedCrustie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient || CRUSTIES_CONTRACT_ADDRESS === '0x') {
      setCrusties([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchOwned() {
      setIsLoading(true);
      try {
        // 1. Get balance (number of NFTs owned)
        const balance = await withRetry(() =>
          publicClient!.readContract({
            address: CRUSTIES_CONTRACT_ADDRESS,
            abi: CRUSTIES_ABI,
            functionName: 'balanceOf',
            args: [address!],
          })
        );

        const count = Number(balance);
        console.log('[useOwnedCrusties] balanceOf:', count);

        if (count === 0) {
          if (!cancelled) {
            setCrusties([]);
            setIsLoading(false);
          }
          return;
        }

        // 2. Get each token ID via tokenOfOwnerByIndex (ERC721Enumerable)
        const tokenIds: bigint[] = [];
        for (let i = 0; i < count; i++) {
          const tokenId = await withRetry(() =>
            publicClient!.readContract({
              address: CRUSTIES_CONTRACT_ADDRESS,
              abi: CRUSTIES_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address!, BigInt(i)],
            })
          );
          tokenIds.push(tokenId as bigint);
        }

        console.log('[useOwnedCrusties] tokenIds:', tokenIds.map(id => Number(id)));

        // 3. Fetch tokenURI + metadata for each
        const results: OwnedCrustie[] = [];

        for (const tokenId of tokenIds) {
          try {
            const uri = await withRetry(() =>
              publicClient!.readContract({
                address: CRUSTIES_CONTRACT_ADDRESS,
                abi: CRUSTIES_ABI,
                functionName: 'tokenURI',
                args: [tokenId],
              })
            ) as string;

            console.log('[useOwnedCrusties] tokenURI for', Number(tokenId), ':', uri);

            // Fetch the metadata JSON from IPFS
            let imageUrl = '';
            let vibe = 'Classic Crustie';
            let rarity: RarityTier = 'Common';

            try {
              const metadataUrl = ipfsToHttp(uri);
              const res = await fetch(metadataUrl);
              if (res.ok) {
                const metadata = await res.json();
                imageUrl = metadata.image ? ipfsToHttp(metadata.image) : '';
                // Extract vibe and rarity from attributes
                if (Array.isArray(metadata.attributes)) {
                  for (const attr of metadata.attributes) {
                    if (attr.trait_type === 'Vibe') vibe = attr.value;
                    if (attr.trait_type === 'Rarity') rarity = attr.value as RarityTier;
                  }
                }
              }
            } catch (err) {
              console.warn('[useOwnedCrusties] Failed to fetch metadata for token', Number(tokenId), err);
            }

            results.push({
              tokenId: Number(tokenId),
              imageUrl,
              vibe,
              rarity,
              tokenURI: uri,
            });
          } catch (err) {
            console.warn('[useOwnedCrusties] Failed to read tokenURI for', Number(tokenId), err);
          }
        }

        if (!cancelled) {
          setCrusties(results);
        }
      } catch (err) {
        console.error('[useOwnedCrusties] Error:', err);
        if (!cancelled) {
          setCrusties([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchOwned();

    return () => {
      cancelled = true;
    };
  }, [address, publicClient]);

  return { crusties, isLoading };
}
