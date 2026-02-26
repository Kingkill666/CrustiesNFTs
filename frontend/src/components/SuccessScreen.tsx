"use client";

import { useEffect, useState } from "react";

interface SuccessScreenProps {
  imageUrl: string;
  txHash: string;
  tokenId?: string;
  remainingMints: number;
  onMintAnother: () => void;
}

function resolveIpfsUrl(url: string): string {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return url;
}

export function SuccessScreen({
  imageUrl,
  txHash,
  tokenId,
  remainingMints,
  onMintAnother,
}: SuccessScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = () => {
    const text = `I just minted my Crustie! 🍕 #Crusties #Base`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-primary via-orange-dark to-crust-brown relative overflow-hidden">
        <AppHeader variant="dark" />
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-20px",
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 1.5}s`,
                }}
              >
                <div
                  className={`w-3 h-3 rounded-sm ${
                    i % 5 === 0
                      ? "bg-cheese-yellow"
                      : i % 5 === 1
                      ? "bg-orange-light"
                      : i % 5 === 2
                      ? "bg-basil-green"
                      : i % 5 === 3
                      ? "bg-white"
                      : "bg-orange-primary"
                  }`}
                  style={{ transform: `rotate(${Math.random() * 360}deg)` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative z-0">
          {/* Celebration Emoji */}
          <div className="text-8xl mb-8 animate-bounce">🎉</div>

          {/* PFP Image with Glow */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-cheese-yellow rounded-3xl blur-3xl opacity-70 animate-pulse" />
            <div
              className="relative w-72 h-72 rounded-3xl overflow-hidden border-[6px] border-cheese-yellow bg-white"
              style={{
                boxShadow: "0 0 60px rgba(255, 209, 102, 0.8), 8px 8px 0px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={resolveIpfsUrl(imageUrl)}
                alt="Your Crustie"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Success Text */}
          <div className="text-center mb-8">
            <h1
              className="text-white mb-4 font-display"
              style={{ fontSize: "52px" }}
            >
              You&apos;re a Crustie!
            </h1>
            <p className="text-white text-xl font-extrabold mb-5 font-display">
              You&apos;re officially a slice of the collection.
            </p>
            {tokenId && (
              <div
                className="inline-block bg-white px-6 py-3 rounded-full border-4 border-cheese-yellow"
                style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}
              >
                <p className="text-orange-primary font-display" style={{ fontSize: "24px" }}>
                  Crustie #{tokenId}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-md flex flex-col gap-4 mb-8">
            <button
              onClick={handleShare}
              className="w-full h-16 bg-white hover:bg-cheese-yellow text-orange-primary rounded-3xl flex items-center justify-center gap-3 transition-all border-4 border-white transform hover:scale-105 active:scale-95 font-display"
              style={{ boxShadow: "6px 6px 0px rgba(0,0,0,0.3)", fontSize: "22px" }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              <span>Share on Farcaster</span>
            </button>

            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="crusties-btn-secondary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              <span>View on BaseScan</span>
            </a>
          </div>

          {/* Mint Another */}
          {remainingMints > 0 && (
            <div className="text-center">
              <button
                onClick={onMintAnother}
                className="text-white text-2xl hover:text-cheese-yellow transition-colors underline mb-3 font-display"
              >
                🍕 Mint Another Slice
              </button>
              <p className="text-white text-lg font-extrabold font-display">
                You have {remainingMints}/3 mints left
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
