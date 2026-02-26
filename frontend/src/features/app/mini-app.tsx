'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { useCrusties } from '@/hooks/useCrusties';
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
  USDC_TOKEN_ADDRESS,
  ERC20_ABI,
} from '@/lib/contract';
import { LandingScreen } from '@/features/app/screens/landing-screen';
import { MintScreen } from '@/features/app/screens/mint-screen';
import { MintingScreen } from '@/features/app/screens/minting-screen';
import { SuccessScreen } from '@/features/app/screens/success-screen';
import { OwnedScreen } from '@/features/app/screens/owned-screen';
import type { Screen, PaymentMethod } from '@/features/app/types';

interface PipelineState {
  imageUrl?: string;
  tokenURI?: string;
  signature?: string;
  vibe?: string;
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  tokenId?: number;
  txHash?: string;
  payment?: PaymentMethod;
  error?: string;
  /** Phase tracking for the mint screen button state */
  preparing?: boolean;
}

export function MiniApp() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [pipeline, setPipeline] = useState<PipelineState>({});

  const mintStartedRef = useRef(false);
  const mintSuccessRef = useRef(false);

  const { address } = useAccount();
  const { fid, username, pfpUrl } = useFarcasterContext();
  const { generate, minEthPrice, minTokenPrice } = useCrusties();

  // ── Mint contract write ─────────────────────────────────────────────────────
  const {
    data: mintHash,
    writeContract: writeMint,
    isPending: isMintPending,
    error: mintWriteError,
  } = useWriteContract();

  // ── Approve contract write (USDC) ───────────────────────────────────────────
  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveWriteError,
  } = useWriteContract();

  // ── Wait for approval ───────────────────────────────────────────────────────
  const {
    isLoading: isConfirmingApprove,
    isSuccess: isApproveConfirmed,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  // ── Wait for mint ───────────────────────────────────────────────────────────
  const {
    isLoading: isConfirmingMint,
    isSuccess: isMintConfirmed,
    data: mintReceipt,
  } = useWaitForTransactionReceipt({ hash: mintHash });

  // ── When approval confirms, auto-fire the mint ──────────────────────────────
  useEffect(() => {
    if (isApproveConfirmed && pipeline.tokenURI && pipeline.signature && minTokenPrice) {
      console.log('[MiniApp] USDC approval confirmed, firing mintWithToken...');
      const sigBytes = pipeline.signature as `0x${string}`;
      writeMint({
        address: CRUSTIES_CONTRACT_ADDRESS,
        abi: CRUSTIES_ABI,
        functionName: 'mintWithToken',
        args: [pipeline.tokenURI, minTokenPrice, sigBytes],
      });
    }
  }, [isApproveConfirmed, pipeline.tokenURI, pipeline.signature, minTokenPrice, writeMint]);

  // ── When mint tx is confirmed on-chain, extract tokenId → success ───────────
  useEffect(() => {
    if (isMintConfirmed && mintReceipt && mintHash && !mintSuccessRef.current) {
      console.log('[MiniApp] Mint confirmed on-chain!', { mintHash, logsCount: mintReceipt.logs.length });
      mintSuccessRef.current = true;

      let tokenId: number | undefined;
      try {
        const transferLog = mintReceipt.logs.find(
          (log) =>
            log.topics[0] ===
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        );
        if (transferLog?.topics[3]) {
          tokenId = Number(BigInt(transferLog.topics[3]));
        }
      } catch {
        // Non-critical
      }

      setPipeline(p => ({ ...p, tokenId, txHash: mintHash }));
      setScreen('success');
    }
  }, [isMintConfirmed, mintReceipt, mintHash]);

  // ── Handle write errors ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mintWriteError) {
      console.error('[MiniApp] mintWriteError:', mintWriteError.message, mintWriteError);
      const msg = mintWriteError.message.includes('Cannot mint')
        ? "You've reached the max mints per wallet"
        : mintWriteError.message.includes('user rejected')
        ? 'Transaction cancelled.'
        : 'Transaction failed. Please try again.';
      setPipeline(p => ({ ...p, error: msg, preparing: false }));
    }
  }, [mintWriteError]);

  useEffect(() => {
    if (approveWriteError) {
      console.error('[MiniApp] approveWriteError:', approveWriteError.message, approveWriteError);
      const msg = approveWriteError.message.includes('user rejected')
        ? 'Approval cancelled.'
        : 'USDC approval failed. Please try again.';
      setPipeline(p => ({ ...p, error: msg, preparing: false }));
    }
  }, [approveWriteError]);

  // ── When wallet prompt appears (pending), move to minting screen ────────────
  useEffect(() => {
    if ((isMintPending || isApprovePending) && screen === 'mint') {
      setScreen('minting');
    }
  }, [isMintPending, isApprovePending, screen]);

  // ── Navigation handlers ─────────────────────────────────────────────────────

  const goLanding = useCallback(() => {
    setPipeline({});
    mintStartedRef.current = false;
    mintSuccessRef.current = false;
    setScreen('landing');
  }, []);

  const handleStart = useCallback(() => {
    setScreen('mint');
  }, []);

  // ── Debug: log key state on every render ───────────────────────────────────
  useEffect(() => {
    console.log('[MiniApp] State:', {
      screen,
      fid,
      address,
      contractAddress: CRUSTIES_CONTRACT_ADDRESS,
      minEthPrice: minEthPrice?.toString(),
      minTokenPrice: minTokenPrice?.toString(),
      pipeline: {
        hasImage: !!pipeline.imageUrl,
        hasTokenURI: !!pipeline.tokenURI,
        hasSig: !!pipeline.signature,
        preparing: pipeline.preparing,
        error: pipeline.error,
      },
    });
  }, [screen, fid, address, minEthPrice, minTokenPrice, pipeline]);

  // ── Mint flow: generate → wallet prompt (stays on mint screen) → minting screen ──
  const handleMintConfirm = useCallback(async (method: PaymentMethod) => {
    console.log('[MiniApp] handleMintConfirm called', { method, fid, address });

    mintStartedRef.current = false;
    mintSuccessRef.current = false;
    setPipeline(p => ({ ...p, payment: method, error: undefined, preparing: true }));

    try {
      // Step 1: Generate the Crustie (backend call) while showing "Preparing..." on button
      console.log('[MiniApp] Calling generate...', { fid: fid ?? undefined, address });
      const data = await generate(fid ?? undefined, address);

      console.log('[MiniApp] generate() returned:', data ? 'data' : 'null');

      if (!data) {
        console.error('[MiniApp] generate() returned null — backend call failed');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const hint = apiUrl.includes('localhost')
          ? ' (Backend URL is localhost — NEXT_PUBLIC_API_URL not set in Vercel)'
          : '';
        setPipeline(p => ({ ...p, error: `Generation failed. Please try again.${hint}`, preparing: false }));
        return;
      }

      const sig = data.signature as string | undefined;
      const uri = data.ipfsUri;

      console.log('[MiniApp] Backend data:', {
        ipfsUri: uri,
        hasSig: !!sig,
        sigLength: sig?.length,
        imageUrl: data.imageUrl?.slice(0, 60),
      });

      setPipeline(p => ({
        ...p,
        imageUrl: data.imageUrl,
        tokenURI: uri,
        signature: sig,
        vibe: data.traits?.vibe as string | undefined,
        rarity: data.traits?.rarity as PipelineState['rarity'],
      }));

      if (!sig) {
        console.error('[MiniApp] No signature returned from backend!');
        setPipeline(p => ({ ...p, error: 'Missing mint signature. Backend may not be configured.', preparing: false }));
        return;
      }

      const sigBytes = sig as `0x${string}`;

      // Step 2: Fire the wallet prompt — user is still on the mint screen
      // The useEffect above will transition to 'minting' when isPending flips true
      if (method === 'eth') {
        console.log('[MiniApp] Calling writeMint (mintWithETH)', {
          contract: CRUSTIES_CONTRACT_ADDRESS,
          uri,
          sigPrefix: sigBytes.slice(0, 20),
          value: (minEthPrice ?? BigInt(1000000000000000)).toString(),
        });
        writeMint({
          address: CRUSTIES_CONTRACT_ADDRESS,
          abi: CRUSTIES_ABI,
          functionName: 'mintWithETH',
          args: [uri, sigBytes],
          value: minEthPrice ?? BigInt(1000000000000000),
        });
      } else {
        console.log('[MiniApp] Calling writeApprove (USDC)', {
          usdcAddress: USDC_TOKEN_ADDRESS,
          spender: CRUSTIES_CONTRACT_ADDRESS,
          amount: (minTokenPrice ?? BigInt(3000000)).toString(),
        });
        writeApprove({
          address: USDC_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CRUSTIES_CONTRACT_ADDRESS, minTokenPrice ?? BigInt(3000000)],
        });
      }
    } catch (err) {
      console.error('[MiniApp] Mint flow error:', err);
      setPipeline(p => ({ ...p, error: 'Something went wrong. Please try again.', preparing: false }));
    }
  }, [fid, address, generate, writeMint, writeApprove, minEthPrice, minTokenPrice]);

  const handleViewOwned = useCallback(() => {
    setScreen('owned');
  }, []);

  const handleMintAnother = useCallback(() => {
    setPipeline({});
    mintStartedRef.current = false;
    mintSuccessRef.current = false;
    setScreen('mint');
  }, []);

  // ── Screen rendering ────────────────────────────────────────────────────────

  if (screen === 'landing') {
    return <LandingScreen onStart={handleStart} onViewOwned={handleViewOwned} />;
  }

  if (screen === 'mint') {
    return (
      <MintScreen
        onConfirm={handleMintConfirm}
        onHome={goLanding}
        preparing={pipeline.preparing}
        error={pipeline.error}
      />
    );
  }

  if (screen === 'minting') {
    return (
      <MintingScreen
        payment={pipeline.payment}
        tokenURI={pipeline.tokenURI}
        onHome={goLanding}
        isMintPending={isMintPending || isApprovePending || isConfirmingApprove || isConfirmingMint}
        mintError={pipeline.error}
      />
    );
  }

  if (screen === 'success') {
    return (
      <SuccessScreen
        vibe={pipeline.vibe}
        rarity={pipeline.rarity}
        txHash={pipeline.txHash}
        tokenId={pipeline.tokenId}
        tokenURI={pipeline.tokenURI}
        imageUrl={pipeline.imageUrl}
        username={username ?? undefined}
        onMintAnother={handleMintAnother}
        onViewOwned={handleViewOwned}
      />
    );
  }

  if (screen === 'owned') {
    return (
      <OwnedScreen
        fid={fid ?? undefined}
        username={username ?? undefined}
        pfpUrl={pfpUrl ?? undefined}
        onMintAnother={handleMintAnother}
        onHome={goLanding}
      />
    );
  }

  return null;
}
