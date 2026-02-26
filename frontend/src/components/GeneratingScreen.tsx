"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./AppHeader";

const pizzaPuns = [
  "Analyzing your on-chain flavor profile...",
  "Selecting the perfect toppings...",
  "Adding extra cheese for good measure...",
  "Preheating the blockchain oven...",
  "Almost ready — just a bit more crust...",
];

interface GeneratingScreenProps {
  onBack: () => void;
}

export function GeneratingScreen({ onBack }: GeneratingScreenProps) {
  const [punIndex, setPunIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const punInterval = setInterval(() => {
      setPunIndex((prev) => (prev + 1) % pizzaPuns.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 1;
      });
    }, 200);

    return () => {
      clearInterval(punInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-primary to-orange-dark relative overflow-hidden">
        {/* Floating ingredients */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 text-5xl animate-float">🧀</div>
          <div
            className="absolute top-40 right-20 text-4xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            🍅
          </div>
          <div
            className="absolute bottom-40 left-20 text-4xl animate-float"
            style={{ animationDelay: "2s" }}
          >
            🌶️
          </div>
          <div
            className="absolute bottom-20 right-10 text-5xl animate-float"
            style={{ animationDelay: "0.5s" }}
          >
            🫒
          </div>
        </div>

        <AppHeader showBack onBack={onBack} title="Baking..." variant="dark" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
          {/* Spinning Pizza */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-cheese-yellow rounded-full blur-3xl opacity-50 animate-pulse" />
            <div
              className="relative text-[180px] leading-none"
              style={{
                animation: "spin 3s linear infinite",
                filter: "drop-shadow(0 0 30px rgba(255, 209, 102, 0.6))",
              }}
            >
              🍕
            </div>
            {/* Sparkles */}
            <div className="absolute -top-4 -left-4 text-4xl animate-ping">✨</div>
            <div
              className="absolute -top-4 -right-4 text-4xl animate-ping"
              style={{ animationDelay: "1s" }}
            >
              ✨
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center max-w-md mb-10">
            <h1
              className="text-white mb-5 font-display"
              style={{ fontSize: "44px" }}
            >
              Baking Your Crustie...
            </h1>
            <p className="text-white text-lg transition-opacity duration-500 min-h-[56px] font-extrabold font-display">
              {pizzaPuns[punIndex]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-sm">
            <div
              className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border-2 border-white/30"
              style={{ boxShadow: "0 4px 0px rgba(0,0,0,0.2)" }}
            >
              <div
                className="h-full bg-gradient-to-r from-cheese-yellow to-orange-light rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 2px 8px rgba(255, 209, 102, 0.5)",
                }}
              />
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold font-display">
              {progress}% complete
            </p>
          </div>
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
