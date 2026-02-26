'use client';

import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/features/app/components/app-shell';
import { C, F, ANIM_STYLES, FONT_FACES } from '@/features/app/components/theme';
import type { PaymentMethod } from '@/features/app/types';

interface MintingScreenProps {
  payment?: PaymentMethod;
  tokenURI?: string;
  /** Promise returned by generate() — resolves when the Crustie is assigned */
  generatePromise?: Promise<void> | null;
  onDone: (result: { tokenId?: number; txHash?: string; mintStatus: 'success' | 'error' }) => void;
  onHome?: () => void;
  /** Whether a contract write is in-flight (pending wallet confirm or on-chain) */
  isMintPending?: boolean;
  /** Error message from contract write */
  mintError?: string;
}

type Phase = 'analyzing' | 'baking' | 'done' | 'error';

const PUNS = [
  'Analyzing your on-chain vibes…',
  'Checking your pizza personality…',
  'Reading your Farcaster aura…',
  'Picking the perfect toppings…',
  'Baking your Crustie in the oven…',
  "Almost ready — don't open the oven!",
];

export function MintingScreen({ payment, tokenURI, generatePromise, onDone, onHome, isMintPending, mintError }: MintingScreenProps) {
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [punIndex, setPunIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const calledRef = useRef(false);

  // If parent reports a mint error, show error phase
  useEffect(() => {
    if (mintError && !calledRef.current) {
      calledRef.current = true;
      setPhase('error');
    }
  }, [mintError]);

  // While a mint tx is pending (wallet confirm or on-chain), hold at baking phase
  useEffect(() => {
    if (isMintPending && phase === 'baking') {
      // Stay in baking — progress bar will animate toward 72%
    }
  }, [isMintPending, phase]);

  // Rotate pizza puns
  useEffect(() => {
    const id = setInterval(() => {
      setPunIndex(i => (i + 1) % PUNS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Animate progress bar toward phase target
  useEffect(() => {
    const target = phase === 'done' ? 100 : phase === 'baking' ? (isMintPending ? 85 : 55) : phase === 'analyzing' ? 30 : 100;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= target) { clearInterval(id); return target; }
        return Math.min(p + 2, target);
      });
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  // Wait for generate promise to resolve, then move to baking phase
  // The actual success transition happens in the parent when on-chain tx confirms
  useEffect(() => {
    let analyzeTimer: ReturnType<typeof setTimeout>;

    if (generatePromise) {
      // Phase 1: analyzing (1.5s simulated before baking)
      analyzeTimer = setTimeout(() => setPhase('baking'), 1500);

      generatePromise
        .catch(() => {
          if (!calledRef.current) {
            calledRef.current = true;
            setPhase('error');
          }
        });
    } else {
      // No generate promise — move to baking after brief analyzing
      analyzeTimer = setTimeout(() => setPhase('baking'), 1500);
    }

    return () => {
      clearTimeout(analyzeTimer);
    };
  }, [generatePromise]);

  const isDone  = phase === 'done';
  const isError = phase === 'error';

  const headline = isDone
    ? 'Your Crustie is baked! 🎉'
    : isError
    ? 'Something went wrong'
    : phase === 'baking'
    ? 'In the oven! 🔥'
    : 'Analyzing your vibe…';

  const subline = isDone
    ? 'Get ready for your big reveal…'
    : isError
    ? 'Your wallet was not charged.'
    : PUNS[punIndex];

  return (
    <AppShell onHome={isError ? onHome : undefined}>
      <style>{FONT_FACES + ANIM_STYLES}</style>

      {/* Main status card */}
      <div style={{
        borderRadius: 24,
        background: isDone
          ? 'linear-gradient(160deg, #edf7f0 0%, #d4edda 100%)'
          : isError
          ? 'linear-gradient(160deg, #fff0f0 0%, #ffe0e0 100%)'
          : `linear-gradient(160deg, #fff8f0 0%, ${C.orangeL} 100%)`,
        border: `3px solid ${isDone ? C.green + '60' : isError ? C.red + '60' : C.orange + '50'}`,
        padding: '28px 16px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: isDone ? `4px 4px 0 ${C.green}30` : isError ? `4px 4px 0 ${C.red}20` : `4px 4px 0 ${C.orangeD}25`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          fontSize: 90,
          animation: isDone
            ? 'stamp-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
            : 'float-pizza 3.5s ease-in-out infinite',
          filter: isDone
            ? `drop-shadow(0 8px 28px ${C.green}60)`
            : `drop-shadow(0 8px 24px ${C.orange}50)`,
          lineHeight: 1,
        }}>
          {isDone ? '🎉' : isError ? '😬' : '🍕'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: F.display, fontSize: 24, letterSpacing: 1.5,
            color: isDone ? C.green : isError ? C.red : C.orangeD, margin: '0 0 6px',
          }}>
            {headline}
          </p>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, fontWeight: 600, minHeight: 20 }}>
            {subline}
          </p>
        </div>

        {!isDone && !isError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff0f0', border: `1.5px solid ${C.red}40`,
            borderRadius: 99, padding: '5px 14px',
          }}>
            <span style={{ fontSize: 11 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: C.red }}>Don&apos;t close this tab</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: F.display, fontSize: 11, letterSpacing: 2, color: C.muted, margin: 0, textTransform: 'uppercase' }}>
            {phase === 'analyzing' ? 'Analyzing' : phase === 'baking' ? 'Baking' : isDone ? 'Done!' : 'Error'}
          </p>
          <p style={{ fontFamily: F.display, fontSize: 14, color: isDone ? C.green : C.orange, margin: 0 }}>{progress}%</p>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: C.orangeL, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: isDone
              ? `linear-gradient(90deg, ${C.green}, #52c07a)`
              : `linear-gradient(90deg, ${C.orange}, ${C.red})`,
            width: `${progress}%`,
            transition: 'width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)',
          }} />
        </div>
      </div>

      {/* Step checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {([
          { label: 'Analyzing your Farcaster vibe',              done: phase === 'baking' || isDone, active: phase === 'analyzing' },
          { label: 'Generating your unique Crustie',             done: !!tokenURI || isDone,          active: phase === 'baking' && !tokenURI },
          { label: `Confirm in wallet (${payment === 'usdc' ? 'USDC' : 'ETH'})`, done: isDone || !!isMintPending, active: phase === 'baking' && !!tokenURI && !isMintPending },
          { label: 'Confirming on Base…',                        done: isDone,                        active: !!isMintPending     },
        ] as { label: string; done: boolean; active: boolean }[]).map(({ label, done, active }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: done || active ? 1 : 0.38 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: done ? C.green : active ? C.orange : C.orangeL,
              border: `2px solid ${done ? C.green : active ? C.orangeD : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {done ? (
                <svg width={11} height={11} viewBox="0 0 12 12">
                  <path d="M 2 6 L 5 9.5 L 10.5 2.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              ) : null}
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: done ? C.green : active ? C.orangeD : C.muted }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* IPFS hint when tokenURI arrives */}
      {tokenURI && (
        <div style={{
          background: '#f0fff4', border: `1.5px solid ${C.green}40`,
          borderRadius: 99, padding: '5px 14px',
          display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
        }}>
          <span style={{ fontSize: 11 }}>📦</span>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.green, fontFamily: 'monospace' }}>
            {tokenURI.slice(0, 24)}…
          </p>
        </div>
      )}

      {isError && (
        <div style={{
          borderRadius: 14, background: '#fff0f0', border: `2px solid ${C.red}40`, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>❌</span>
          <div>
            <p style={{ fontFamily: F.body, fontWeight: 800, color: C.red, margin: '0 0 2px', fontSize: 13 }}>Something went wrong</p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0, fontWeight: 600 }}>Your wallet was not charged. Tap back to try again.</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
