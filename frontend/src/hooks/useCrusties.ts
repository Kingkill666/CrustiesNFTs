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

if (typeof window !== "undefined" && API_URL.includes("localhost")) {
  console.warn(
    "[Crusties] WARNING: NEXT_PUBLIC_API_URL is not set! API calls will go to localhost and fail in production. Set NEXT_PUBLIC_API_URL in Vercel env vars."
  );
}

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

    console.log("[Crusties] generate() called", { fid: userFid, minterAddress, API_URL });

    try {
      // Guard: if we're on a deployed site but API_URL points to localhost, fail fast
      if (
        typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost") &&
        API_URL.includes("localhost")
      ) {
        console.error(
          "[Crusties] Cannot call localhost API from deployed site. Set NEXT_PUBLIC_API_URL env var."
        );
        throw new Error(
          "Backend not configured. Set NEXT_PUBLIC_API_URL in Vercel."
        );
      }

      const url = `${API_URL}/api/generate`;
      const payload = { fid: userFid, minterAddress };
      console.log("[Crusties] POST", url, JSON.stringify(payload));

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[Crusties] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorBody = await res.text();
        console.error("[Crusties] Backend error response:", res.status, errorBody);
        throw new Error(`Generation failed: ${res.status} ${errorBody}`);
      }

      const data: GeneratedData = await res.json();
      console.log("[Crusties] Backend response:", {
        ipfsUri: data.ipfsUri,
        imageUrl: data.imageUrl?.slice(0, 80),
        traits: data.traits,
        crustieIndex: data.crustieIndex,
        hasSignature: !!data.signature,
        signaturePrefix: data.signature?.slice(0, 20),
        nonce: data.nonce,
      });

      setGeneratedData(data);
      return data;
    } catch (err) {
      console.error("[Crusties] Generate error:", err);
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
