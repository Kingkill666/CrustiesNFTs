"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { PizzaPreview } from "@/components/PizzaPreview";
import { MintButton } from "@/components/MintButton";
import { useCrusties } from "@/hooks/useCrusties";
import { useFarcasterContext } from "@/hooks/useFarcasterContext";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { fid, isInMiniApp } = useFarcasterContext();
  const {
    generatedData,
    isGenerating,
    generate,
    remainingMints,
    remainingSupply,
    totalMinted,
  } = useCrusties();

  // Signal to Farcaster client that the app is ready to display
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <main
      className="flex min-h-screen flex-col items-center px-4 py-8"
      style={
        isInMiniApp
          ? { paddingTop: `calc(2rem + env(safe-area-inset-top, 0px))` }
          : undefined
      }
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-5xl font-bold text-pizza-cheese">Crusties</h1>
        <p className="text-lg text-gray-400">
          AI-generated pizza PFPs on Base
        </p>
        {totalMinted !== undefined && (
          <p className="mt-2 text-sm text-gray-500">
            {totalMinted.toString()} / 3,333 minted
          </p>
        )}
      </div>

      {/* Wallet Connect */}
      <div className="mb-8">
        <ConnectButton />
      </div>

      {/* Main Content */}
      {isConnected && address ? (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          {/* Mint Info */}
          {remainingMints !== undefined && (
            <p className="text-sm text-gray-400">
              You can mint {remainingMints.toString()} more
              {remainingSupply !== undefined &&
                ` · ${remainingSupply.toString()} remaining`}
            </p>
          )}

          {/* FID display in Mini App context */}
          {fid && (
            <p className="text-xs text-gray-600">
              Farcaster ID: {fid}
            </p>
          )}

          {/* Generate Button */}
          {!generatedData && (
            <button
              onClick={() => generate(fid ?? undefined)}
              disabled={isGenerating}
              className="w-full rounded-xl bg-pizza-red px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:bg-red-600 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? "Baking your pizza..." : "Generate My Crusties"}
            </button>
          )}

          {/* Pizza Preview */}
          {generatedData && (
            <>
              <PizzaPreview
                imageUrl={generatedData.imageUrl}
                traits={generatedData.traits}
              />
              <MintButton ipfsUri={generatedData.ipfsUri} />
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500">Connect your wallet to get started</p>
      )}
    </main>
  );
}
