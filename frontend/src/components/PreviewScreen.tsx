"use client";

import { useState, useEffect, useRef } from "react";
import { AppHeader } from "./AppHeader";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
  USDC_TOKEN_ADDRESS,
  ERC20_ABI,
} from "@/lib/contract";
import { useCrusties } from "@/hooks/useCrusties";

type PaymentMethod = "ETH" | "USDC";

const TRAIT_EMOJIS: Record<string, string> = {
  crust: "🍞",
  sauce: "🍅",
  cheese: "🧀",
  topping: "🍖",
  eyes: "👀",
  nose: "👃",
  background: "🎨",
  accessory: "🎩",
  drizzle: "💧",
  vibe: "💫",
  rarityscore: "⭐",
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
  traits: Record<string, string | number>;
  signature?: string;
  onBack: () => void;
  onMintStarted: (hash: string) => void;
  onMintSuccess: (hash: string, tokenId: string) => void;
  onMintError: (error: string) => void;
}

export function PreviewScreen({
  imageUrl,
  ipfsUri,
  traits,
  signature,
  onBack,
  onMintStarted,
  onMintSuccess,
  onMintError,
}: PreviewScreenProps) {
  const { address } = useAccount();
  const { minEthPrice, minTokenPrice } = useCrusties();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ETH");
  const [isApproved, setIsApproved] = useState(false);

  // Refs to prevent double-firing callbacks
  const mintStartedFired = useRef(false);
  const mintSuccessFired = useRef(false);

  // ── Mint write ──────────────────────────────────────────────────────────────
  const {
    data: mintHash,
    writeContract: writeMint,
    isPending: isMintPending,
    error: mintWriteError,
  } = useWriteContract();

  // ── Approve write ───────────────────────────────────────────────────────────
  const {
    writeContract: writeApprove,
    isPending: isApprovePending,
    data: approveHash,
    error: approveWriteError,
  } = useWriteContract();

  // ── Wait for approval tx ────────────────────────────────────────────────────
  const {
    isLoading: isConfirmingApprove,
    isSuccess: isApproveConfirmed,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  // ── Wait for mint tx ────────────────────────────────────────────────────────
  const {
    isLoading: isConfirmingMint,
    isSuccess: isMintConfirmed,
    data: mintReceipt,
  } = useWaitForTransactionReceipt({ hash: mintHash });

  // When the mint tx is submitted to the mempool, move to minting screen
  useEffect(() => {
    if (mintHash && !mintStartedFired.current) {
      mintStartedFired.current = true;
      onMintStarted(mintHash);
    }
  }, [mintHash, onMintStarted]);

  // When the approval tx confirms, auto-trigger the mint
  useEffect(() => {
    if (isApproveConfirmed && !isApproved) {
      setIsApproved(true);
    }
  }, [isApproveConfirmed, isApproved]);

  // When the mint tx is confirmed on-chain, extract tokenId and move to success
  useEffect(() => {
    if (isMintConfirmed && mintReceipt && mintHash && !mintSuccessFired.current) {
      mintSuccessFired.current = true;

      // Extract the tokenId from the transaction logs.
      // The ERC-721 Transfer event is: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      // It's the 3rd topic (index 2) of the Transfer log — topics[2] is the tokenId as a hex uint256.
      let tokenId = "";
      try {
        const transferLog = mintReceipt.logs.find(
          (log) =>
            // Transfer event topic0
            log.topics[0] ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );
        if (transferLog?.topics[2]) {
          tokenId = BigInt(transferLog.topics[2]).toString();
        }
      } catch {
        // Non-critical — success screen can show without token ID
      }

      onMintSuccess(mintHash, tokenId);
    }
  }, [isMintConfirmed, mintReceipt, mintHash, onMintSuccess]);

  // Handle write errors
  useEffect(() => {
    if (mintWriteError) {
      const msg = mintWriteError.message.includes("Cannot mint")
        ? "You've reached the max mints per wallet (3)"
        : mintWriteError.message.includes("user rejected")
        ? "Transaction cancelled."
        : "Transaction failed. Please try again.";
      onMintError(msg);
    }
  }, [mintWriteError, onMintError]);

  useEffect(() => {
    if (approveWriteError) {
      const msg = approveWriteError.message.includes("user rejected")
        ? "Approval cancelled."
        : "USDC approval failed. Please try again.";
      onMintError(msg);
    }
  }, [approveWriteError, onMintError]);

  const handleMint = () => {
    if (!signature) {
      onMintError("Missing mint signature. Please try generating again.");
      return;
    }
    const sigBytes = signature as `0x${string}`;

    if (paymentMethod === "ETH") {
      if (!minEthPrice) return;
      writeMint({
        address: CRUSTIES_CONTRACT_ADDRESS,
        abi: CRUSTIES_ABI,
        functionName: "mintWithETH",
        args: [ipfsUri, sigBytes],
        value: minEthPrice,
      });
    } else {
      if (!minTokenPrice) return;

      if (!isApproved) {
        // Step 1: Approve USDC spend
        writeApprove({
          address: USDC_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CRUSTIES_CONTRACT_ADDRESS, minTokenPrice],
        });
      } else {
        // Step 2: Mint with token (approval already confirmed)
        writeMint({
          address: CRUSTIES_CONTRACT_ADDRESS,
          abi: CRUSTIES_ABI,
          functionName: "mintWithToken",
          args: [ipfsUri, minTokenPrice, sigBytes],
        });
      }
    }
  };

  const isLoading =
    isMintPending ||
    isConfirmingMint ||
    isApprovePending ||
    isConfirmingApprove;

  const getButtonText = () => {
    if (isApprovePending) return "Confirm in Wallet...";
    if (isConfirmingApprove) return "Approving USDC...";
    if (isMintPending) return "Confirm in Wallet...";
    if (isConfirmingMint) return "Confirming...";
    if (paymentMethod === "USDC" && !isApproved) return "Approve USDC";
    if (paymentMethod === "USDC" && isApproved) return "Bake My Crustie — $3 USDC";
    return "Bake My Crustie — 0.001 ETH";
  };

  const traitEntries = Object.entries(traits).filter(
    ([key]) => key !== "rarityScore"
  );
  const rarityScore = traits.rarityScore;

  return (
    <div
      className="w-full max-w-[480px] mx-auto min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#FFFBF5" }}
    >
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
        <AppHeader showBack onBack={onBack} title="Your Crustie" variant="light" />

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
              <h2
                className="text-orange-primary mb-2 font-display"
                style={{ fontSize: "28px" }}
              >
                Your Crustie is Ready!
              </h2>
              <p className="text-[#D42806] font-extrabold font-display">
                That&apos;s amore! Here&apos;s your one-of-a-kind slice.
              </p>
            </div>
          </div>

          {/* Traits Section */}
          <div className="crusties-card p-5 mb-5">
            <h3
              className="text-orange-primary mb-4 flex items-center gap-2 font-display"
              style={{ fontSize: "24px" }}
            >
              <span className="text-2xl">✨</span>
              <span>Your 10 Traits</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {traitEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-cheese-yellow text-crust-brown rounded-2xl px-4 py-3 text-center border-3 border-orange-primary"
                  style={{ boxShadow: "3px 3px 0px rgba(232, 93, 4, 0.3)" }}
                >
                  <div className="text-2xl mb-1">
                    {TRAIT_EMOJIS[key.toLowerCase()] ?? "✨"}
                  </div>
                  <div className="text-xs text-muted-text font-bold mb-1">
                    {formatTraitName(key)}
                  </div>
                  <div className="text-sm font-bold">
                    {formatTraitName(String(value))}
                  </div>
                </div>
              ))}
            </div>
            {rarityScore !== undefined && (
              <div className="mt-3 bg-orange-primary text-white rounded-2xl px-4 py-3 text-center">
                <span className="font-display text-lg">
                  ⭐ Rarity Score: {rarityScore}/100
                </span>
              </div>
            )}
          </div>

          {/* Payment Selector */}
          <div className="crusties-card p-5">
            <h3
              className="text-orange-primary mb-4 font-display"
              style={{ fontSize: "24px" }}
            >
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
                  <div className="text-2xl text-charcoal font-display">
                    0.001
                  </div>
                  <div className="text-xs text-crust-brown font-bold uppercase">
                    ETH
                  </div>
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
                  <div className="text-xs text-crust-brown font-bold uppercase">
                    USDC
                  </div>
                </div>
              </button>
            </div>

            {/* USDC step indicator */}
            {paymentMethod === "USDC" && (
              <div className="mt-4 flex items-center gap-3 justify-center text-sm font-bold text-crust-brown">
                <span
                  className={`px-3 py-1 rounded-full ${
                    isApproved
                      ? "bg-basil-green text-white"
                      : "bg-cheese-yellow text-orange-primary"
                  }`}
                >
                  1. Approve
                </span>
                <span className="text-muted-text">→</span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    isApproved
                      ? "bg-cheese-yellow text-orange-primary"
                      : "bg-orange-light text-muted-text"
                  }`}
                >
                  2. Mint
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Mint Button */}
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-8"
          style={{
            background: "linear-gradient(to top, #FFD166 60%, transparent)",
          }}
        >
          <div className="max-w-[480px] mx-auto">
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

            {!address && (
              <p className="text-center text-crust-brown font-bold text-sm">
                Connect your wallet to mint
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
