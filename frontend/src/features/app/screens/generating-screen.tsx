'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/features/app/components/app-shell';
import { CrustieNFT } from '@/features/app/components/crustie-nft';
import { C, F } from '@/features/app/components/theme';

const GEN_STEPS = [
  { emoji: '🎨', label: 'Building your trait prompt'        },
  { emoji: '🖌️', label: 'Painting your pizza personality'   },
  { emoji: '👀', label: 'Adding your signature eyes'        },
  { emoji: '🧀', label: 'Melting all the cheese'            },
  { emoji: '🍕', label: 'Final render — looking crispy'     },
];

const PIN_STEPS = [
  { emoji: '📦', label: 'Packaging your Crustie'           },
  { emoji: '📡', label: 'Uploading image to IPFS'          },
  { emoji: '📋', label: 'Building NFT metadata'            },
  { emoji: '🔒', label: 'Pinning metadata permanently'     },
  { emoji: '✅', label: 'tokenURI ready for minting'       },
];

const STEP_MS = 420;

interface GeneratingScreenProps {
  isGenerating?: boolean;
  isPinning?: boolean;
  imageUrl?: string;
  onDone: () => void;
}

export function GeneratingScreen({ isGenerating = true, isPinning = false, imageUrl, onDone }: GeneratingScreenProps) {

  useEffect(() => {
    onDone();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [genStep, setGenStep] = useState(0);
  useEffect(() => {
    if (!isGenerating) return;
    if (genStep >= GEN_STEPS.length) return;
    const t = setTimeout(() => setGenStep(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [isGenerating, genStep]);

  useEffect(() => {
    if (!isGenerating && genStep < GEN_STEPS.length) {
      setGenStep(GEN_STEPS.length);
    }
  }, [isGenerating, genStep]);

  const [pinStep, setPinStep] = useState(0);
  useEffect(() => {
    if (!isPinning) return;
    if (pinStep >= PIN_STEPS.length) return;
    const t = setTimeout(() => setPinStep(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [isPinning, pinStep]);

  useEffect(() => {
    if (!isPinning && pinStep > 0 && pinStep < PIN_STEPS.length) {
      setPinStep(PIN_STEPS.length);
    }
  }, [isPinning, pinStep]);

  const genDone = !isGenerating && genStep >= GEN_STEPS.length;
  const pinDone = !isPinning && pinStep >= PIN_STEPS.length && pinStep > 0;
  const allDone = genDone && pinDone;

  const headline = allDone
    ? 'Your Crustie is baked! 🎉'
    : isPinning
    ? 'Preserving on IPFS...'
    : isGenerating
    ? 'Baking your Crustie...'
    : 'Starting the oven...';

  const subline = allDone
    ? 'Permanently stored on IPFS'
    : isPinning
    ? 'Pinning to IPFS — takes ~10s'
    : 'The AI oven is at 900°F 🔥';

  const totalSteps = GEN_STEPS.length + PIN_STEPS.length;
  const completedSteps = Math.min(genStep, GEN_STEPS.length) + (isPinning || pinDone ? Math.min(pinStep, PIN_STEPS.length) : 0);
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <AppShell>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 18, paddingTop: 8,
      }}>

        <CrustieNFT
          size={120}
          tokenId={1848}
          wobble={isGenerating || isPinning}
          imageUrl={imageUrl}
        />

        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: F.display, fontSize: 24, fontWeight: 400,
            margin: '0 0 4px', color: C.orangeD, letterSpacing: 1.5,
          }}>
            {headline}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{subline}</p>
        </div>

        <div style={{ width: '100%', height: 8, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${C.orange}, ${C.red})`,
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <p style={{ color: C.muted, fontSize: 11, margin: '-10px 0 0', fontWeight: 700 }}>
          {progress}% complete
        </p>

        <PhaseBlock
          title="🎨 AI Image Generation"
          steps={GEN_STEPS}
          completedCount={genStep}
          isActive={isGenerating}
          isDone={genDone}
        />

        <PhaseBlock
          title="📌 IPFS Pinning"
          steps={PIN_STEPS}
          completedCount={pinStep}
          isActive={isPinning}
          isDone={pinDone}
          isPending={!isPinning && !pinDone}
        />
      </div>
    </AppShell>
  );
}

function PhaseBlock({
  title, steps, completedCount, isActive, isDone, isPending = false,
}: {
  title: string;
  steps: { emoji: string; label: string }[];
  completedCount: number;
  isActive: boolean;
  isDone: boolean;
  isPending?: boolean;
}) {
  const activeIdx = Math.min(completedCount, steps.length - 1);

  return (
    <div style={{
      width: '100%',
      borderRadius: 16,
      border: `2px solid ${isDone ? C.green + '40' : isActive ? C.orange + '50' : C.border}`,
      background: isDone ? 'rgba(45,106,79,0.05)' : isActive ? C.orangeL + '80' : '#fafafa',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      opacity: isPending ? 0.5 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1.5px solid ${isDone ? C.green + '25' : isActive ? C.orange + '25' : C.border}`,
      }}>
        <span style={{
          fontFamily: F.display, fontSize: 13, color: isDone ? C.green : isActive ? C.orangeD : C.muted,
          letterSpacing: 0.8,
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: isDone ? '#fff' : isActive ? C.orangeD : C.muted,
          background: isDone ? C.green : isActive ? C.orange + '30' : 'transparent',
          padding: isDone || isActive ? '2px 8px' : '0',
          borderRadius: 99,
        }}>
          {isDone ? 'DONE' : isActive ? 'IN PROGRESS' : isPending ? 'WAITING' : ''}
        </span>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map(({ emoji, label }, i) => {
          const stepDone   = i < completedCount;
          const stepActive = i === activeIdx && isActive && !stepDone;

          return (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 6px', borderRadius: 8,
              background: stepActive ? C.orange + '18' : 'transparent',
              transition: 'background 0.2s ease',
              opacity: !stepDone && !stepActive && i > activeIdx + 1 ? 0.35 : 1,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: stepDone ? C.green : stepActive ? C.orange : C.border,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}>
                {stepDone && (
                  <svg width={8} height={8} viewBox="0 0 10 10">
                    <path d="M 2 5 L 4 7.5 L 8.5 2.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
                  </svg>
                )}
                {stepActive && (
                  <span style={{
                    display: 'block', width: 5, height: 5, borderRadius: '50%',
                    background: '#fff', animation: 'pulse-dot 0.8s ease-in-out infinite',
                  }} />
                )}
              </div>
              <span style={{ fontSize: 13 }}>{emoji}</span>
              <span style={{
                fontSize: 12, flex: 1,
                fontWeight: stepDone ? 700 : stepActive ? 600 : 400,
                color: stepDone ? C.charcoal : stepActive ? C.orangeD : C.muted,
                transition: 'color 0.2s ease',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
