'use client';

import { useReadContract } from 'wagmi';
import { CRUSTIES_CONTRACT_ADDRESS, CRUSTIES_ABI } from '@/lib/contract';

export function useSupply() {
  const { data: totalMinted } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: 'totalMinted',
  });

  const minted = totalMinted ? Number(totalMinted) : 0;
  const total  = 500;

  return { total, minted };
}
