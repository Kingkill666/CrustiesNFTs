"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { sdk } from "@farcaster/miniapp-sdk";
import { config } from "@/lib/wagmi";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Signal ready to Farcaster client to hide the splash screen
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
        console.log("[Providers] sdk.actions.ready() succeeded");
      } catch (err) {
        console.warn("[Providers] sdk.actions.ready() failed:", err);
      }
    };
    init();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#E85D04",
            accentColorForeground: "white",
            borderRadius: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
