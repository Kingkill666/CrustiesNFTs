"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

interface HomeScreenProps {
  totalMinted: bigint | undefined;
  userMintCount: bigint | undefined;
  isConnected: boolean;
  username: string | null;
  pfpUrl?: string | null;
  onGetSlice: () => void;
}

export function HomeScreen({
  totalMinted,
  userMintCount,
  isConnected,
  onGetSlice,
}: HomeScreenProps) {
  const minted = totalMinted ? Number(totalMinted) : 0;
  const userMints = userMintCount ? Number(userMintCount) : 0;
  const canMint = userMints < 3;

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-cheese-yellow relative overflow-hidden">
      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🍕</span>
            <h2 className="text-orange-primary font-display" style={{ fontSize: "32px" }}>
              Crusties
            </h2>
          </div>
          <div className="scale-75 origin-right">
            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-5 pb-6">
          {/* Hero Text */}
          <div className="text-center mb-6 mt-4">
            <h1
              className="text-orange-primary mb-3 font-display"
              style={{
                fontSize: "48px",
                textShadow: "3px 3px 0px rgba(0,0,0,0.1)",
                lineHeight: "1",
              }}
            >
              Every Slice
              <br />
              Tells a Story
            </h1>
            <p className="text-crust-brown text-lg font-medium font-body">
              Your vibe. Your toppings. Your Crustie.
            </p>
          </div>

          {/* Pizza Grid Placeholder */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-3xl overflow-hidden border-4 border-orange-primary bg-white flex items-center justify-center text-4xl"
                style={{ boxShadow: "4px 4px 0px rgba(232, 93, 4, 0.3)" }}
              >
                {["🍕", "🧀", "🍅", "🌶️", "🫒", "🍄", "🧅", "🌿", "🥓"][i]}
              </div>
            ))}
          </div>

          {/* Stats Card */}
          <div className="crusties-card p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 divide-x-2 divide-cheese-yellow">
              <div className="text-center">
                <div className="text-3xl mb-1 text-orange-primary font-display">
                  {minted}
                </div>
                <div className="text-xs text-crust-brown font-bold uppercase tracking-wide">
                  Minted
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1 text-orange-primary font-display">
                  0.001
                </div>
                <div className="text-xs text-crust-brown font-bold uppercase tracking-wide">
                  ETH
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1 text-orange-primary font-display">
                  {userMints}/3
                </div>
                <div className="text-xs text-crust-brown font-bold uppercase tracking-wide">
                  Your Mints
                </div>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center mb-6">
            <p className="text-crust-brown leading-relaxed font-medium font-body">
              We analyze your Farcaster identity to bake a one-of-a-kind pizza PFP
              just for you.
            </p>
          </div>

          {/* CTA Button */}
          {isConnected ? (
            <button
              onClick={onGetSlice}
              disabled={!canMint}
              className="crusties-btn"
            >
              <span className="text-3xl">🍕</span>
              <span>{canMint ? "Get Your Slice" : "Oven's Full!"}</span>
            </button>
          ) : (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-crust-brown font-medium font-body">
              Minting on Base &bull; 2.5% creator royalty
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
