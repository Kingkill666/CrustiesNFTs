"use client";

interface ErrorScreenProps {
  errorMessage: string;
  onRetry: () => void;
  onBackHome: () => void;
}

export function ErrorScreen({ errorMessage, onRetry, onBackHome }: ErrorScreenProps) {
  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-orange-primary to-crust-brown flex flex-col items-center justify-center px-6">
        {/* Burnt Pizza */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-crust-brown rounded-3xl blur-3xl opacity-50 animate-pulse" />
          <div
            className="relative w-64 h-64 rounded-3xl overflow-hidden border-[6px] border-orange-dark bg-charcoal flex items-center justify-center grayscale"
            style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.4)" }}
          >
            <span className="text-[120px] opacity-60">🍕</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-4 -right-4 text-7xl animate-bounce">🔥</div>
          <div className="absolute -top-4 -left-4 text-6xl">😢</div>
        </div>

        {/* Error Text */}
        <div className="text-center mb-10 max-w-md">
          <h1
            className="text-white mb-5 font-display"
            style={{ fontSize: "44px" }}
          >
            That Crust Crumbled
          </h1>
          <p className="text-white text-xl leading-relaxed font-extrabold font-display">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md flex flex-col gap-4 mb-8">
          <button
            onClick={onRetry}
            className="w-full h-16 bg-white hover:bg-cheese-yellow text-orange-primary rounded-3xl flex items-center justify-center gap-3 transition-all border-4 border-white transform hover:scale-105 active:scale-95 font-display"
            style={{ boxShadow: "6px 6px 0px rgba(0,0,0,0.3)", fontSize: "24px" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            <span>Try Again</span>
          </button>

          <button
            onClick={onBackHome}
            className="crusties-btn-secondary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* Encouraging Message */}
        <p className="text-white text-center text-lg max-w-sm font-extrabold font-display">
          Don&apos;t worry! Even the best pizzas sometimes need a second try. 🍕
        </p>
      </div>
    </div>
  );
}
