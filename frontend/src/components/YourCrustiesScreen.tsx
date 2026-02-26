"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AppHeader } from "./AppHeader";
import { useOwnedCrusties } from "@/hooks/useOwnedCrusties";

interface YourCrustiesScreenProps {
  isConnected: boolean;
  pfpUrl?: string | null;
  onMintAnother: () => void;
  onBack: () => void;
}

export function YourCrustiesScreen({
  isConnected,
  pfpUrl,
  onMintAnother,
  onBack,
}: YourCrustiesScreenProps) {
  const { ownedCrusties, balance, isLoading } = useOwnedCrusties();

  return (
    <div
      className="w-full max-w-[480px] mx-auto min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#FFFBF5" }}
    >
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
          showBack
          onBack={onBack}
          title="Your Crusties"
          variant="light"
          rightElement={
            isConnected && pfpUrl ? (
              <img
                src={pfpUrl}
                alt="Profile"
                className="w-11 h-11 rounded-full border-[3px] border-orange-primary object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border-[3px] border-orange-primary bg-white flex items-center justify-center text-2xl">
                🍕
              </div>
            )
          }
        />

        {/* Header bar */}
        <div
          className="mx-5 mt-4 mb-4 rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(90deg, #C44900 0%, #E85D04 100%)",
            boxShadow: "4px 4px 0px rgba(0,0,0,0.2)",
          }}
        >
          <div>
            <h2 className="text-white font-display text-2xl">YOUR CRUSTIES</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/90 text-sm">Your wallet</span>
              <span
                className="rounded-full px-3 py-0.5 text-sm font-bold text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              >
                {balance} Crustie{balance !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {isConnected && pfpUrl ? (
            <img
              src={pfpUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-[3px] border-white object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-white/20 flex items-center justify-center text-2xl">
              🍕
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pb-8">
          <div
            className="rounded-2xl border-2 border-dashed border-orange-primary/40 p-8 min-h-[200px] flex flex-col items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
          >
            {!isConnected ? (
              <div className="text-center">
                <div className="text-5xl mb-4">🍕</div>
                <p className="text-orange-primary font-display text-xl mb-2">
                  Connect to view your Crusties
                </p>
                <p className="text-crust-brown text-sm mb-6">
                  Connect your wallet to see your collection
                </p>
                <ConnectButton />
              </div>
            ) : isLoading ? (
              <div className="text-center">
                <div className="text-5xl mb-4 animate-pulse">🍕</div>
                <p className="text-orange-primary font-display text-lg">
                  Loading your Crusties...
                </p>
              </div>
            ) : balance === 0 ? (
              <div className="text-center">
                <div className="text-5xl mb-4">🍕</div>
                <p className="text-orange-primary font-display text-2xl mb-2">
                  NO CRUSTIES YET!
                </p>
                <p className="text-muted-text text-sm mb-6">
                  Your unique pizza PFP is waiting to be generated. Get baking!
                </p>
                <button
                  onClick={onMintAnother}
                  className="crusties-btn w-full max-w-xs"
                >
                  <span className="text-2xl">🍕</span>
                  <span>MINT YOUR FIRST CRUSTIE</span>
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  {ownedCrusties.map((c) => (
                    <div
                      key={c.tokenId}
                      className="aspect-square rounded-2xl overflow-hidden border-4 border-orange-primary bg-white"
                      style={{
                        boxShadow: "4px 4px 0px rgba(232, 93, 4, 0.3)",
                      }}
                    >
                      <img
                        src={c.imageUrl}
                        alt={c.name ?? `Crustie #${c.tokenId}`}
                        className="w-full h-full object-cover object-[center_25%]"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={onMintAnother}
                  className="crusties-btn w-full"
                >
                  <span className="text-2xl">🍕</span>
                  <span>MINT ANOTHER CRUSTIE</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
