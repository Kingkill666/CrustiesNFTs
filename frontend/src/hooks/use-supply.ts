'use client';

import { useReadContract } from 'wagmi';
import { CRUSTIES_CONTRACT_ADDRESS, CRUSTIES_ABI } from '@/lib/contract';

export function useSupply() {
  const { data: totalMinted } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: 'totalMinted',
  });

  const { data: maxSupply } = useReadContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: CRUSTIES_ABI,
    functionName: 'maxSupply',
  });

  const minted = totalMinted ? Number(totalMinted) : 0;
  const total  = maxSupply ? Number(maxSupply) : 500;

  return { total, minted };
}
