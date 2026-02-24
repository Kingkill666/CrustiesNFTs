"use client";

interface MintingScreenProps {
  imageUrl: string;
  txHash: string;
}

function resolveIpfsUrl(url: string): string {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return url;
}

export function MintingScreen({ imageUrl, txHash }: MintingScreenProps) {
  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-primary to-orange-dark items-center justify-center px-6 relative overflow-hidden">
        {/* Floating pizza elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-7xl animate-float">🍕</div>
          <div
            className="absolute bottom-20 right-10 text-8xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            🍕
          </div>
        </div>

        {/* Animated Crustie with Overlay */}
        <div className="relative mb-10 z-10">
          <div className="absolute inset-0 bg-cheese-yellow rounded-3xl blur-3xl opacity-50 animate-pulse" />
          <div
            className="relative w-72 h-72 rounded-3xl overflow-hidden border-[6px] border-white bg-white"
            style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.3)" }}
          >
            <img
              src={resolveIpfsUrl(imageUrl)}
              alt="Your Crustie"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
              <div className="relative">
                <div
                  className="w-20 h-20 border-[6px] border-white border-t-transparent rounded-full"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl">🔥</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-10 max-w-md z-10">
          <h1
            className="text-white mb-5 font-display"
            style={{ fontSize: "48px", textShadow: "4px 4px 0px rgba(0,0,0,0.2)" }}
          >
            In The Oven...
          </h1>
          <p className="text-white text-xl leading-relaxed font-medium font-body">
            Your transaction is being confirmed on Base. This won&apos;t take long!
          </p>
        </div>

        {/* Transaction Link */}
        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 bg-white hover:bg-cheese-yellow border-4 border-white rounded-2xl text-orange-primary font-bold transition-all z-10 transform hover:scale-105 font-display"
            style={{ boxShadow: "4px 4px 0px rgba(0,0,0,0.2)", fontSize: "18px" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            <span>View on BaseScan</span>
          </a>
        )}

        {/* Animated Dots */}
        <div className="flex gap-3 mt-10 z-10">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
