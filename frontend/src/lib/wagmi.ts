import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  connectors: [
    // Farcaster Mini App wallet (auto-detected inside Farcaster clients)
    farcasterMiniApp(),
    // Fallback connectors for standalone web usage
    coinbaseWallet({ appName: "Crusties" }),
    injected(),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || undefined),
  },
  ssr: true,
});
