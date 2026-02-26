"use client";

import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-orange-primary via-orange-dark to-crust-brown overflow-hidden relative">
      <AppHeader variant="dark" />
      <div className="flex-1 flex items-center justify-center relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl animate-spin-slow">🍕</div>
        <div
          className="absolute top-20 right-20 text-4xl animate-spin-slow"
          style={{ animationDelay: "0.5s" }}
        >
          🧀
        </div>
        <div
          className="absolute bottom-20 left-20 text-5xl animate-spin-slow"
          style={{ animationDelay: "1s" }}
        >
          🍅
        </div>
        <div
          className="absolute bottom-10 right-10 text-4xl animate-spin-slow"
          style={{ animationDelay: "1.5s" }}
        >
          🌶️
        </div>
      </div>

      <div className="flex flex-col items-center relative z-10">
        {/* Animated Pizza Emoji */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-cheese-yellow rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="relative text-9xl animate-bounce drop-shadow-2xl">
            🍕
          </div>
        </div>

        {/* Brand Name */}
        <h1
          className="text-white mb-3 font-display"
          style={{ fontSize: "56px" }}
        >
          Crusties
        </h1>
        <p className="text-white text-xl font-extrabold font-display">
          Baking your Crustie...
        </p>

        {/* Loading Dots */}
        <div className="flex gap-3 mt-8">
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
