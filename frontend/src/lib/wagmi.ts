import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  connectors: [
    // Farcaster Mini App wallet (auto-detected inside Farcaster clients)
    farcasterFrame(),
    // Fallback connectors for standalone web usage
    coinbaseWallet({ appName: "Crusties" }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});
