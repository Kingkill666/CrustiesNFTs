'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/features/app/components/app-shell';
import { C, F } from '@/features/app/components/theme';

const SIGNALS = [
  { emoji: '📅', label: 'Account age',      detail: '→ Crust type'      },
  { emoji: '✍️', label: 'Cast tone',         detail: '→ Sauce flavor'    },
  { emoji: '💬', label: 'Engagement rate',  detail: '→ Cheese coverage' },
  { emoji: '🔖', label: 'Topics & niches',  detail: '→ Toppings'        },
  { emoji: '👁️', label: 'Neynar score',     detail: '→ Eyes'            },
  { emoji: '🎙️', label: 'Cast frequency',   detail: '→ Nose'            },
  { emoji: '🌐', label: 'Social presence',  detail: '→ Background'      },
  { emoji: '👥', label: 'Follower count',   detail: '→ Accessory'       },
  { emoji: '⚖️', label: 'Follower ratio',   detail: '→ Drizzle'         },
  { emoji: '✨', label: 'Everything ☝️',    detail: '→ Vibe tag'        },
];

const STEP_DURATION = 320; // ms per signal tick

interface AnalyzingScreenProps {
  fid?: number;
  onDone: () => void;
}

export function AnalyzingScreen({ fid, onDone }: AnalyzingScreenProps) {
  const [doneCount, setDoneCount] = useState(0);

  // Tick through signals
  useEffect(() => {
    if (doneCount >= SIGNALS.length) return;
    const t = setTimeout(() => setDoneCount(n => n + 1), STEP_DURATION);
    return () => clearTimeout(t);
  }, [doneCount]);

  // Call onDone after all signals complete + small delay
  useEffect(() => {
    if (!fid) return;
    const timeout = SIGNALS.length * STEP_DURATION + 1200;
    const t = setTimeout(onDone, timeout);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  const activeIdx = Math.min(doneCount, SIGNALS.length - 1);
  const progress  = Math.round((doneCount / SIGNALS.length) * 100);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <h2 style={{
            fontFamily: F.display, fontSize: 26, fontWeight: 400,
            color: C.orangeD, margin: '0 0 6px', letterSpacing: 1.5,
          }}>
            Reading Your Vibe...
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, fontWeight: 600 }}>
            Analyzing 10 Farcaster signals
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 8, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${C.orange}, ${C.red})`,
            width: `${progress}%`,
            transition: 'width 0.35s ease',
          }} />
        </div>

        {/* Signal list */}
        <div style={{
          background: '#fff', border: `2px solid ${C.border}`,
          borderRadius: 20, padding: '14px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {SIGNALS.map(({ emoji, label, detail }, i) => {
            const done   = i < doneCount;
            const active = i === activeIdx && doneCount < SIGNALS.length;

            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 8px', borderRadius: 10,
                background: active ? C.orange + '14' : 'transparent',
                transition: 'background 0.2s ease',
                opacity: !done && !active && i > activeIdx + 2 ? 0.3 : 1,
              }}>
                {/* Status dot */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: done ? C.green : active ? C.orange : C.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}>
                  {done && (
                    <svg width={9} height={9} viewBox="0 0 10 10">
                      <path d="M 2 5 L 4 7.5 L 8.5 2.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
                    </svg>
                  )}
                  {active && (
                    <span style={{
                      display: 'block', width: 6, height: 6, borderRadius: '50%',
                      background: '#fff', animation: 'pulse-dot 0.8s ease-in-out infinite',
                    }} />
                  )}
                </div>

                <span style={{ fontSize: 14 }}>{emoji}</span>

                <span style={{
                  fontSize: 13, flex: 1,
                  fontWeight: done ? 700 : active ? 600 : 400,
                  color: done ? C.charcoal : active ? C.orangeD : C.muted,
                }}>
                  {label}
                </span>

                <span style={{
                  fontSize: 11, color: done ? C.green : C.muted,
                  fontWeight: 600, opacity: done ? 1 : 0.5,
                }}>
                  {detail}
                </span>
              </div>
            );
          })}
        </div>

        {doneCount >= SIGNALS.length && (
          <p style={{
            textAlign: 'center', color: C.green,
            fontFamily: F.display, fontSize: 16, letterSpacing: 1,
            animation: 'fade-up 0.4s ease-out both',
          }}>
            Analysis complete! Baking your Crustie... 🍕
          </p>
        )}
      </div>
    </AppShell>
  );
}
