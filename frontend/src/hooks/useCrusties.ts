"use client";

import { useState, useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
} from "@/lib/contract";

interface GeneratedData {
  ipfsUri: string;
  imageUrl: string;
  traits: Record<string, string | number>;
  crustieIndex?: number;
  signature?: string;
  nonce?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useCrusties() {
  const { address } = useAccount();
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: remainingMints } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "remainingMintsForWallet",
    args: address ? [address] : undefined,
    query: { enabled: !!address && CRUSTIES_CONTRACT_ADDRESS !== "0x" },
  });

  const { data: remainingSupply } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "remainingSupply",
    query: {
      enabled: CRUSTIES_CONTRACT_ADDRESS !== "0x",
      refetchInterval: 15000, // Poll every 15s so progress bar updates as others mint
    },
  });

  const { data: totalMinted } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "totalMinted",
    query: {
      enabled: CRUSTIES_CONTRACT_ADDRESS !== "0x",
      refetchInterval: 15000, // Poll every 15s so progress bar updates as others mint
    },
  });

  const { data: minEthPrice } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "minEthPrice",
    query: { enabled: CRUSTIES_CONTRACT_ADDRESS !== "0x" },
  });

  const { data: minTokenPrice } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: "minTokenPrice",
    query: { enabled: CRUSTIES_CONTRACT_ADDRESS !== "0x" },
  });

  const generate = useCallback(async (fid?: number, minterAddress?: string): Promise<GeneratedData | null> => {
    const userFid = fid ?? 1; // Falls back to 1 for testing outside Farcaster
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: userFid, minterAddress }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data: GeneratedData = await res.json();
      setGeneratedData(data);
      return data;
    } catch (err) {
      console.error("Generate error:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatedData,
    isGenerating,
    generate,
    remainingMints,
    remainingSupply,
    totalMinted,
    minEthPrice,
    minTokenPrice,
  };
}
