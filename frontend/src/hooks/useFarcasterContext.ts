"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FarcasterContext {
  fid: number | null;
  username: string | null;
  isInMiniApp: boolean;
  location: string | null;
  isAdded: boolean;
}

export function useFarcasterContext(): FarcasterContext {
  const [context, setContext] = useState<FarcasterContext>({
    fid: null,
    username: null,
    isInMiniApp: false,
    location: null,
    isAdded: false,
  });

  useEffect(() => {
    async function loadContext() {
      try {
        const ctx = await sdk.context;

        if (ctx?.user) {
          setContext({
            fid: ctx.user.fid,
            username: ctx.user.username ?? null,
            isInMiniApp: true,
            location: ctx.location?.type ?? null,
            isAdded: ctx.client?.added ?? false,
          });
        }
      } catch {
        // Not in a Farcaster client — running as standalone web app
      }
    }

    loadContext();
  }, []);

  return context;
}
