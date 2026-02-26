'use client';

import { useState, useEffect } from 'react';
import type { OwnedCrustie } from '@/features/app/types';

// Stub — returns empty list until a real API endpoint exists
export function useOwnedCrusties(fid?: number) {
  const [crusties, setCrusties] = useState<OwnedCrustie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fid) {
      setIsLoading(false);
      setCrusties([]);
      return;
    }
    setIsLoading(false);
    setCrusties([]);
  }, [fid]);

  return { crusties, isLoading };
}
