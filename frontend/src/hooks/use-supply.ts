'use client';

import { useReadContract } from 'wagmi';
import { CRUSTIES_CONTRACT_ADDRESS, CRUSTIES_ABI } from '@/lib/contract';

export function useSupply() {
  const { data: totalMinted } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: 'totalMinted',
    query: {
      enabled: CRUSTIES_CONTRACT_ADDRESS !== '0x',
      refetchInterval: 15000, // Poll every 15s so bar updates as others mint
    },
  });

  const { data: maxSupply } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: 'maxSupply',
    query: {
      enabled: CRUSTIES_CONTRACT_ADDRESS !== '0x',
    },
  });

  const minted = totalMinted ? Number(totalMinted) : 0;
  const total  = maxSupply ? Number(maxSupply) : 500;

  return { total, minted };
}
