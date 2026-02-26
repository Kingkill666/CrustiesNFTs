"use client";

import { useMemo, useState, useEffect } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
} from "@/lib/contract";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

function resolveIpfsUrl(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", IPFS_GATEWAY);
  }
  return uri;
}

export interface OwnedCrustie {
  tokenId: string;
  tokenURI: string;
  imageUrl: string;
  name?: string;
}

export function useOwnedCrusties() {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CRUSTIES_CONTRACT_ADDRESS !== "0x",
      refetchInterval: 15000,
    },
  });

  const count = balance ? Number(balance) : 0;

  const tokenIndexContracts = useMemo(
    () =>
      address
        ? Array.from({ length: count }, (_, i) => ({
            address: CRUSTIES_CONTRACT_ADDRESS,
            abi: CRUSTIES_ABI,
            functionName: "tokenOfOwnerByIndex" as const,
            args: [address, BigInt(i)] as const,
          }))
        : [],
    [address, count]
  );

  const { data: tokenIdResults } = useReadContracts({
    contracts: tokenIndexContracts,
    query: {
      enabled: !!address && count > 0 && CRUSTIES_CONTRACT_ADDRESS !== "0x",
    },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdResults) return [];
    return tokenIdResults
      .filter((r) => r.status === "success" && r.result !== undefined)
      .map((r) => String((r.result as bigint) ?? 0));
  }, [tokenIdResults]);

  const tokenURIContracts = useMemo(
    () =>
      tokenIds.map((tokenId) => ({
        address: CRUSTIES_CONTRACT_ADDRESS,
        abi: CRUSTIES_ABI,
        functionName: "tokenURI" as const,
        args: [BigInt(tokenId)] as const,
      })),
    [tokenIds]
  );

  const { data: uriResults } = useReadContracts({
    contracts: tokenURIContracts,
    query: {
      enabled: tokenIds.length > 0 && CRUSTIES_CONTRACT_ADDRESS !== "0x",
    },
  });

  const [ownedCrusties, setOwnedCrusties] = useState<OwnedCrustie[]>([]);

  useEffect(() => {
    if (!uriResults || uriResults.length === 0) {
      setOwnedCrusties([]);
      return;
    }

    const fetchMetadata = async () => {
      const results: OwnedCrustie[] = [];
      for (let i = 0; i < uriResults.length; i++) {
        const r = uriResults[i];
        const tokenId = tokenIds[i];
        if (!tokenId || r.status !== "success" || !r.result) continue;

        const metadataUri = resolveIpfsUrl(r.result as string);
        try {
          const res = await fetch(metadataUri);
          const json = await res.json();
          const imageRaw = json.image ?? "";
          const imageUrl = resolveIpfsUrl(imageRaw);
          results.push({
            tokenId,
            tokenURI: r.result as string,
            imageUrl,
            name: json.name,
          });
        } catch {
          results.push({
            tokenId,
            tokenURI: r.result as string,
            imageUrl: "",
            name: `Crustie #${tokenId}`,
          });
        }
      }
      setOwnedCrusties(results);
    };

    fetchMetadata();
  }, [uriResults, tokenIds]);

  return {
    ownedCrusties,
    balance: count,
    isLoading: count > 0 && ownedCrusties.length === 0 && uriResults !== undefined,
  };
}
