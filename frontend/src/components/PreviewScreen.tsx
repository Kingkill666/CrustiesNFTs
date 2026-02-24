"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
  USDC_TOKEN_ADDRESS,
  ERC20_ABI,
} from "@/lib/contract";
import { useCrusties } from "@/hooks/useCrusties";

type PaymentMethod = "ETH" | "USDC";

interface TraitItem {
  label: string;
  value: string;
  emoji: string;
}

const TRAIT_EMOJIS: Record<string, string> = {
  crust: "🍞",
  cheese: "🧀",
  topping: "🍖",
  eyes: "😴",
  vibe: "💰",
  rarity: "⭐",
  sauce: "🍅",
  background: "🎨",
  accessories: "🎩",
  mouth: "👄",
  nose: "👃",
};

function formatTraitName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveIpfsUrl(url: string): string {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return url;
}

interface PreviewScreenProps {
  imageUrl: string;
  ipfsUri: string;
  traits: Record<string, string>;
  onBack: () => void;
  onReroll: () => void;
  onMintStarted: (hash: string) => void;
  onMintSuccess: (hash: string, tokenId?: string) => void;
  onMintError: (error: string) => void;
}

export function PreviewScreen({
  imageUrl,
  ipfsUri,
  traits,
  onBack,
  onReroll,
  onMintStarted,
  onMintSuccess,
  onMintError,
}: PreviewScreenProps) {
  const { address } = useAccount();
  const { minEthPrice, minTokenPrice } = useCrusties();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ETH");
  const [isApproved, setIsApproved] = useState(false);

  const {
    data: mintHash,
    writeContract: writeMint,
    isPending: isMinting,
    error: mintError,
  } = useWriteContract();

  const {
    writeContract: writeApprove,
    isPending: isApproving,
    data: approveHash,
  } = useWriteContract();

  const { isLoading: isConfirmingMint, isSuccess: isMintSuccess } =
    useWaitForTransactionReceipt({
      hash: mintHash,
    });

  const { isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Watch for mint success
  if (isMintSuccess && mintHash) {
    onMintSuccess(mintHash);
  }

  // Watch for errors
  if (mintError) {
    const msg = mintError.message.includes("Cannot mint")
      ? "You've reached the max mints per wallet (3)"
      : "Transaction failed. Please try again.";
    onMintError(msg);
  }

  const traitItems: TraitItem[] = Object.entries(traits).map(([key, value]) => ({
    label: formatTraitName(key),
    value: formatTraitName(String(value)),
    emoji: TRAIT_EMOJIS[key.toLowerCase()] || "✨",
  }));

  const handleMint = () => {
    if (paymentMethod === "ETH") {
      if (!minEthPrice) return;
      writeMint({
        address: CRUSTIES_CONTRACT_ADDRESS,
        abi: CRUSTIES_ABI,
        functionName: "mintWithETH",
        args: [ipfsUri],
        value: minEthPrice,
      });
      if (mintHash) onMintStarted(mintHash);
    } else {
      if (!minTokenPrice) return;
      if (!isApproved) {
        writeApprove(
          {
            address: USDC_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CRUSTIES_CONTRACT_ADDRESS, minTokenPrice],
          },
          {
            onSuccess: () => {
              setIsApproved(true);
            },
          }
        );
      } else {
        writeMint({
          address: CRUSTIES_CONTRACT_ADDRESS,
          abi: CRUSTIES_ABI,
          functionName: "mintWithToken",
          args: [ipfsUri, minTokenPrice],
        });
        if (mintHash) onMintStarted(mintHash);
      }
    }
  };

  const isLoading = isMinting || isConfirmingMint || isApproving || isConfirmingApprove;

  const getButtonText = () => {
    if (isApproving || isConfirmingApprove) return "Approving...";
    if (isMinting) return "Minting...";
    if (isConfirmingMint) return "Confirming...";
    if (paymentMethod === "USDC" && !isApproved) return "Approve USDC";
    if (paymentMethod === "USDC") return "Mint for $3 USDC";
    return "Mint for 0.001 ETH";
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-cheese-yellow relative overflow-hidden">
      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="px-5 py-5 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-orange-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-orange-primary font-display" style={{ fontSize: "32px" }}>
            Your Crustie
          </h2>
          <div className="w-8" />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-40">
          {/* PFP Preview Card */}
          <div className="crusties-card p-5 mb-5">
            <div
              className="aspect-square rounded-2xl overflow-hidden mb-5 border-4 border-cheese-yellow bg-white"
              style={{ boxShadow: "4px 4px 0px rgba(255, 209, 102, 0.4)" }}
            >
              <img
                src={resolveIpfsUrl(imageUrl)}
                alt="Your Crustie"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-orange-primary mb-2 font-display" style={{ fontSize: "28px" }}>
                Your Crustie is Ready!
              </h2>
              <p className="text-crust-brown font-medium font-body">
                That&apos;s amore! Here&apos;s your one-of-a-kind slice.
              </p>
            </div>
          </div>

          {/* Traits Section */}
          <div className="crusties-card p-5 mb-5">
            <h3 className="text-orange-primary mb-4 flex items-center gap-2 font-display" style={{ fontSize: "24px" }}>
              <span className="text-2xl">✨</span>
              <span>Traits</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {traitItems.map((trait, i) => (
                <div
                  key={i}
                  className="bg-cheese-yellow text-crust-brown rounded-2xl px-4 py-3 text-center border-3 border-orange-primary"
                  style={{ boxShadow: "3px 3px 0px rgba(232, 93, 4, 0.3)" }}
                >
                  <div className="text-2xl mb-1">{trait.emoji}</div>
                  <div className="text-xs text-muted-text font-bold mb-1">{trait.label}</div>
                  <div className="text-sm font-bold">{trait.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Selector */}
          <div className="crusties-card p-5">
            <h3 className="text-orange-primary mb-4 font-display" style={{ fontSize: "24px" }}>
              Choose Payment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* ETH Option */}
              <button
                onClick={() => setPaymentMethod("ETH")}
                className={`p-4 rounded-2xl border-4 transition-all ${
                  paymentMethod === "ETH"
                    ? "border-orange-primary bg-cheese-yellow scale-105"
                    : "border-crust-brown bg-orange-light hover:scale-105"
                }`}
                style={{
                  boxShadow:
                    paymentMethod === "ETH"
                      ? "4px 4px 0px rgba(232, 93, 4, 0.4)"
                      : "3px 3px 0px rgba(139, 94, 60, 0.3)",
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#627EEA] to-[#4C63D2] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white text-2xl font-bold">◆</span>
                  </div>
                  <div className="text-2xl text-charcoal font-display">0.001</div>
                  <div className="text-xs text-crust-brown font-bold uppercase">ETH</div>
                </div>
              </button>

              {/* USDC Option */}
              <button
                onClick={() => {
                  setPaymentMethod("USDC");
                  setIsApproved(false);
                }}
                className={`p-4 rounded-2xl border-4 transition-all ${
                  paymentMethod === "USDC"
                    ? "border-orange-primary bg-cheese-yellow scale-105"
                    : "border-crust-brown bg-orange-light hover:scale-105"
                }`}
                style={{
                  boxShadow:
                    paymentMethod === "USDC"
                      ? "4px 4px 0px rgba(232, 93, 4, 0.4)"
                      : "3px 3px 0px rgba(139, 94, 60, 0.3)",
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-[#2775CA] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white text-2xl font-bold">$</span>
                  </div>
                  <div className="text-2xl text-charcoal font-display">$3</div>
                  <div className="text-xs text-crust-brown font-bold uppercase">USDC</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Section */}
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-8"
          style={{ background: "linear-gradient(to top, #FFD166 60%, transparent)" }}
        >
          <div className="max-w-[480px] mx-auto">
            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={isLoading || !address}
              className="crusties-btn mb-4"
            >
              {isLoading && (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{getButtonText()}</span>
            </button>

            {/* Re-roll Link */}
            <button
              onClick={onReroll}
              className="w-full text-center text-orange-primary hover:text-orange-dark font-bold text-lg transition-colors font-display"
            >
              🔄 Not your vibe? Re-roll!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
