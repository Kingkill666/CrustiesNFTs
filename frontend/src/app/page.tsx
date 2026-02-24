"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";
import { useCrusties } from "@/hooks/useCrusties";
import { useFarcasterContext } from "@/hooks/useFarcasterContext";

import { SplashScreen } from "@/components/SplashScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { PreviewScreen } from "@/components/PreviewScreen";
import { MintingScreen } from "@/components/MintingScreen";
import { SuccessScreen } from "@/components/SuccessScreen";
import { ErrorScreen } from "@/components/ErrorScreen";

type Screen =
  | "splash"
  | "home"
  | "generating"
  | "preview"
  | "minting"
  | "success"
  | "error";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { address, isConnected } = useAccount();
  const { fid, username, isInMiniApp } = useFarcasterContext();
  const {
    generatedData,
    isGenerating,
    generate,
    remainingMints,
    totalMinted,
  } = useCrusties();

  // Signal to Farcaster client that the app is ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Watch generating state — transition when generation completes
  useEffect(() => {
    if (screen === "generating" && generatedData && !isGenerating) {
      setScreen("preview");
    }
  }, [screen, generatedData, isGenerating]);

  const handleSplashComplete = useCallback(() => {
    setScreen("home");
  }, []);

  const handleGetSlice = useCallback(() => {
    setScreen("generating");
    generate(fid ?? undefined);
  }, [fid, generate]);

  const handleBackToHome = useCallback(() => {
    setScreen("home");
  }, []);

  const handleReroll = useCallback(() => {
    setScreen("generating");
    generate(fid ?? undefined);
  }, [fid, generate]);

  const handleMintStarted = useCallback((hash: string) => {
    setTxHash(hash);
    setScreen("minting");
  }, []);

  const handleMintSuccess = useCallback((hash: string) => {
    setTxHash(hash);
    setScreen("success");
  }, []);

  const handleMintError = useCallback((error: string) => {
    setErrorMessage(error);
    setScreen("error");
  }, []);

  const handleMintAnother = useCallback(() => {
    setScreen("generating");
    generate(fid ?? undefined);
  }, [fid, generate]);

  const handleRetry = useCallback(() => {
    setScreen("preview");
  }, []);

  const userMintCount = remainingMints !== undefined ? BigInt(3) - remainingMints : undefined;
  const remaining = remainingMints ? Number(remainingMints) : 0;

  return (
    <main
      style={
        isInMiniApp
          ? { paddingTop: `env(safe-area-inset-top, 0px)` }
          : undefined
      }
    >
      {screen === "splash" && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {screen === "home" && (
        <HomeScreen
          totalMinted={totalMinted as bigint | undefined}
          userMintCount={userMintCount}
          isConnected={isConnected}
          username={username}
          onGetSlice={handleGetSlice}
        />
      )}

      {screen === "generating" && (
        <GeneratingScreen onBack={handleBackToHome} />
      )}

      {screen === "preview" && generatedData && (
        <PreviewScreen
          imageUrl={generatedData.imageUrl}
          ipfsUri={generatedData.ipfsUri}
          traits={generatedData.traits}
          onBack={handleBackToHome}
          onReroll={handleReroll}
          onMintStarted={handleMintStarted}
          onMintSuccess={handleMintSuccess}
          onMintError={handleMintError}
        />
      )}

      {screen === "minting" && generatedData && (
        <MintingScreen
          imageUrl={generatedData.imageUrl}
          txHash={txHash}
        />
      )}

      {screen === "success" && generatedData && (
        <SuccessScreen
          imageUrl={generatedData.imageUrl}
          txHash={txHash}
          remainingMints={remaining}
          onMintAnother={handleMintAnother}
        />
      )}

      {screen === "error" && (
        <ErrorScreen
          errorMessage={errorMessage}
          onRetry={handleRetry}
          onBackHome={handleBackToHome}
        />
      )}
    </main>
  );
}
