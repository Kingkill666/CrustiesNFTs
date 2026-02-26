"use client";

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";
import { useCrusties } from "@/hooks/useCrusties";
import { CRUSTIES_CONTRACT_ADDRESS } from "@/lib/contract";
import { useFarcasterContext } from "@/hooks/useFarcasterContext";

import { SplashScreen } from "@/components/SplashScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { PreviewScreen } from "@/components/PreviewScreen";
import { MintingScreen } from "@/components/MintingScreen";
import { SuccessScreen } from "@/components/SuccessScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { YourCrustiesScreen } from "@/components/YourCrustiesScreen";

type Screen =
  | "splash"
  | "home"
  | "generating"
  | "preview"
  | "minting"
  | "success"
  | "error"
  | "yourCrusties";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [txHash, setTxHash] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const { fid, username, pfpUrl, isInMiniApp } = useFarcasterContext();
  const {
    generatedData,
    isGenerating,
    generate,
    remainingMints,
    totalMinted,
    remainingSupply,
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
    generate(fid ?? undefined, address);
  }, [fid, address, generate]);

  const handleBackToHome = useCallback(() => {
    setScreen("home");
  }, []);

  const handleOpenYourCrusties = useCallback(() => {
    setScreen("yourCrusties");
  }, []);

  const handleMintStarted = useCallback((hash: string) => {
    setTxHash(hash);
    setScreen("minting");
  }, []);

  const handleMintSuccess = useCallback(
    (hash: string, id: string) => {
      setTxHash(hash);
      setTokenId(id);
      setScreen("success");
      // Refetch contract data so progress bar and Your Crusties update
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as unknown[];
          const type = key[0];
          if (type === "readContract") {
            const opts = key[1] as { address?: string };
            return opts?.address === CRUSTIES_CONTRACT_ADDRESS;
          }
          if (type === "readContracts") {
            const contracts = key[1] as Array<{ address?: string }>;
            return contracts?.some((c) => c?.address === CRUSTIES_CONTRACT_ADDRESS);
          }
          return false;
        },
      });
    },
    [queryClient]
  );

  const handleMintError = useCallback((error: string) => {
    setErrorMessage(error);
    setScreen("error");
  }, []);

  const handleMintAnother = useCallback(() => {
    setScreen("generating");
    generate(fid ?? undefined, address);
  }, [fid, address, generate]);

  const handleRetry = useCallback(() => {
    setScreen("preview");
  }, []);

  const userMintCount =
    remainingMints !== undefined ? BigInt(3) - remainingMints : undefined;
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
          remainingSupply={remainingSupply as bigint | undefined}
          userMintCount={userMintCount}
          isConnected={isConnected}
          username={username}
          pfpUrl={pfpUrl}
          onGetSlice={handleGetSlice}
          onOpenYourCrusties={handleOpenYourCrusties}
        />
      )}

      {screen === "yourCrusties" && (
        <YourCrustiesScreen
          isConnected={isConnected}
          pfpUrl={pfpUrl}
          onMintAnother={handleGetSlice}
          onBack={handleBackToHome}
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
          signature={generatedData.signature}
          onBack={handleBackToHome}
          onMintStarted={handleMintStarted}
          onMintSuccess={handleMintSuccess}
          onMintError={handleMintError}
        />
      )}

      {screen === "minting" && generatedData && (
        <MintingScreen imageUrl={generatedData.imageUrl} txHash={txHash} />
      )}

      {screen === "success" && generatedData && (
        <SuccessScreen
          imageUrl={generatedData.imageUrl}
          txHash={txHash}
          tokenId={tokenId}
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
