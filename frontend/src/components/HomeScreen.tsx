"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AppHeader } from "./AppHeader";

const MAX_SUPPLY = 3333;

interface HomeScreenProps {
  totalMinted: bigint | undefined;
  remainingSupply: bigint | undefined;
  userMintCount: bigint | undefined;
  isConnected: boolean;
  username: string | null;
  pfpUrl?: string | null;
  onGetSlice: () => void;
  onOpenYourCrusties?: () => void;
}

function mintedLabel(n: number): string {
  return n === 1 ? "1 minted" : `${n.toLocaleString()} minted`;
}

export function HomeScreen({
  totalMinted,
  remainingSupply,
  userMintCount,
  isConnected,
  pfpUrl,
  onGetSlice,
  onOpenYourCrusties,
}: HomeScreenProps) {
  const minted = totalMinted ? Number(totalMinted) : 0;
  const remaining = remainingSupply !== undefined ? Number(remainingSupply) : MAX_SUPPLY;
  const userMints = userMintCount ? Number(userMintCount) : 0;
  const canMint = userMints < 3;
  const progressPercent = MAX_SUPPLY > 0 ? (minted / MAX_SUPPLY) * 100 : 0;

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen relative overflow-hidden" style={{ backgroundColor: "#FFFBF5" }}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.22]"
        style={{
          backgroundImage: "url(/images/toppings-pattern.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />

      <div className="min-h-screen flex flex-col relative z-10">
        <AppHeader
          title="Crusties"
          variant="light"
          rightElement={
            isConnected && pfpUrl ? (
              <img
                src={pfpUrl}
                alt="Profile"
                className="w-11 h-11 rounded-full border-[3px] border-orange-primary object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border-[3px] border-orange-primary bg-white flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>
            )
          }
        />

        {/* Main Content */}
        <div className="flex-1 px-5 pb-6">
          {/* Hero Text */}
          <div className="text-center mb-6 mt-2">
            <h1
              className="text-orange-primary mb-3 font-display"
              style={{
                fontSize: "52px",
                lineHeight: "1",
              }}
            >
              Every Slice
              <br />
              Tells a Story
            </h1>
            <p className="text-[#D42806] text-xl font-extrabold font-display">
              Your vibe. Your toppings. Your Crustie.
            </p>
          </div>

          {/* CRUSTIES IN THE WILD */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-crust-brown font-display text-xl">
              CRUSTIES IN THE WILD
            </h2>
            <span className="rounded-lg bg-orange-light px-2 py-1 text-xs font-bold text-tomato-red flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-tomato-red" />
              LIVE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6 overflow-x-auto">
            {[
              "crustie-007",
              "crustie-018",
              "crustie-033",
              "crustie-042",
              "crustie-075",
              "crustie-115",
              "crustie-130",
              "crustie-155",
              "crustie-177",
            ].map((name) => (
              <div
                key={name}
                className="aspect-square rounded-2xl overflow-hidden border-4 border-orange-primary bg-white"
                style={{ boxShadow: "4px 4px 0px rgba(232, 93, 4, 0.3)" }}
              >
                <img
                  src={`/images/grid/${name}.png`}
                  alt={name}
                  className="w-full h-full object-cover object-[center_25%]"
                />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="crusties-card p-5 mb-6">
            <div className="mb-4">
              <div className="text-2xl mb-1 text-orange-primary font-display">
                🍕 {mintedLabel(minted)}
              </div>
              <div className="flex justify-between text-sm text-crust-brown font-bold">
                <span>{MAX_SUPPLY.toLocaleString()} total</span>
                <span>{remaining.toLocaleString()} remaining</span>
              </div>
            </div>
            <div
              className="h-3 rounded-full bg-cheese-yellow/30 overflow-hidden border-2 border-orange-primary"
              style={{ boxShadow: "2px 2px 0px rgba(232, 93, 4, 0.3)" }}
            >
              <div
                className="h-full bg-orange-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 divide-x-2 divide-cheese-yellow">
              <div className="text-center">
                <div className="text-2xl mb-1 text-orange-primary font-display">
                  0.001
                </div>
                <div className="text-xs text-crust-brown font-bold uppercase tracking-wide">
                  ETH
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1 text-orange-primary font-display">
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
            <p className="text-[#D42806] text-lg leading-relaxed font-extrabold font-display">
              We analyze your Farcaster identity to bake a one-of-a-kind pizza PFP
              just for you.
            </p>
          </div>

          {/* CTA Buttons */}
          {isConnected ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={onGetSlice}
                disabled={!canMint}
                className="crusties-btn"
              >
                <span className="text-3xl">🍕</span>
                <span>{canMint ? "Get Your Slice" : "Oven's Full!"}</span>
              </button>
              {onOpenYourCrusties && (
                <button
                  onClick={onOpenYourCrusties}
                  className="w-full h-14 rounded-3xl flex items-center justify-center gap-2 transition-all border-4 border-orange-primary bg-white hover:bg-orange-light text-orange-primary font-display text-xl transform hover:scale-[1.02]"
                  style={{ boxShadow: "4px 4px 0px rgba(232, 93, 4, 0.3)" }}
                >
                  YOUR CRUSTIES
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
