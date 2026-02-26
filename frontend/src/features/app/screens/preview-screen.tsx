'use client';

import { AppShell } from '@/features/app/components/app-shell';
import { Card, SectionLabel, PrimaryBtn } from '@/features/app/components/ui-primitives';
import { CrustieNFT } from '@/features/app/components/crustie-nft';
import { C, F, RARITY_STYLES, CHECKER_BG } from '@/features/app/components/theme';
import type { Trait, RarityTier } from '@/features/app/types';

const DEMO_TRAITS: Trait[] = [
  { label: 'Crust',      value: 'New York Thin Crust',  rarity: 'Rare',      pct: 15 },
  { label: 'Sauce',      value: 'Sweet Marinara',       rarity: 'Common',    pct: 42 },
  { label: 'Cheese',     value: 'Extra Melty Mozz',     rarity: 'Rare',      pct: 15 },
  { label: 'Toppings',   value: 'Pepperoni & Jalapeño', rarity: 'Rare',      pct: 15 },
  { label: 'Eyes',       value: 'Sparkle Eyes',         rarity: 'Rare',      pct: 15 },
  { label: 'Nose',       value: 'Button Nose',          rarity: 'Rare',      pct: 15 },
  { label: 'Background', value: 'Neon Grid',            rarity: 'Rare',      pct: 15 },
  { label: 'Accessory',  value: 'Silver Ring',          rarity: 'Uncommon',  pct: 26 },
  { label: 'Drizzle',    value: 'Ranch Drizzle',        rarity: 'Uncommon',  pct: 26 },
  { label: 'Vibe',       value: 'Rising Star',          rarity: 'Epic',      pct: 9  },
];

const TRAIT_EMOJI: Record<string, string> = {
  Crust: '🍞', Sauce: '🍅', Cheese: '🧀', Toppings: '🌶️',
  Eyes: '👀', Nose: '👃', Background: '🌆', Accessory: '💍',
  Drizzle: '🍯', Vibe: '✨',
};

const RARITY_EMOJI: Record<string, string> = {
  Common: '⚪', Uncommon: '🟢', Rare: '🔵', Epic: '🟣', Legendary: '🌟',
};

interface PreviewScreenProps {
  traits?: Trait[];
  vibe?: string;
  rarity?: RarityTier;
  tokenId?: number;
  imageUrl?: string;
  onMint: () => void;
  onHome?: () => void;
}

export function PreviewScreen({ traits, vibe, rarity = 'Common', tokenId = 1848, imageUrl, onMint, onHome }: PreviewScreenProps) {
  const displayTraits = traits ?? DEMO_TRAITS;
  const displayVibe   = vibe ?? 'Classic Crustie';
  const overallRarity = RARITY_STYLES[rarity];

  const rarityPoints: Record<RarityTier, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5 };
  const rarityScore = Math.round(
    displayTraits.reduce((sum, t) => sum + rarityPoints[t.rarity], 0) / displayTraits.length * 20
  );

  const vibeTrait   = displayTraits.find(t => t.label === 'Vibe');
  const otherTraits = displayTraits.filter(t => t.label !== 'Vibe');

  return (
    <AppShell onHome={onHome}>

      <div style={{
        borderRadius: 24,
        background: CHECKER_BG,
        backgroundColor: C.cream,
        border: `3px solid ${overallRarity.border}60`,
        padding: '18px 16px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        boxShadow: `4px 4px 0 ${overallRarity.dot}30`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${overallRarity.dot}30 0%, transparent 70%)`,
          top: 10, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none',
          animation: 'glow-pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          filter: `drop-shadow(0 8px 24px ${overallRarity.dot}50)`,
          animation: 'crustie-reveal 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          zIndex: 1,
        }}>
          <CrustieNFT size={200} tokenId={tokenId} float imageUrl={imageUrl} />
        </div>
        <p style={{
          fontFamily: F.display, fontSize: 13, letterSpacing: 3,
          color: C.muted, margin: 0, textTransform: 'uppercase',
          zIndex: 1,
        }}>
          Crustie #{tokenId} · 1 of 500
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          background: C.yellow, border: `2.5px solid ${C.orange}`,
          borderRadius: 99, padding: '8px 20px',
          fontFamily: F.display, fontSize: 14, color: C.orangeD,
          boxShadow: `3px 3px 0 ${C.orange}30`, letterSpacing: 2,
          transform: 'rotate(-1deg)',
        }}>
          ✦ {displayVibe} ✦
        </div>
        <div style={{
          background: overallRarity.bg, border: `2.5px solid ${overallRarity.border}`,
          borderRadius: 99, padding: '8px 16px',
          fontFamily: F.display, fontSize: 13, color: overallRarity.text,
          boxShadow: `3px 3px 0 ${overallRarity.border}50`, letterSpacing: 1.5,
        }}>
          {RARITY_EMOJI[rarity]} {rarity}
        </div>
      </div>

      <div style={{
        background: '#fff', border: `2px solid ${C.border}`, borderRadius: 16, padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontFamily: F.display, fontSize: 11, letterSpacing: 2, color: C.muted, margin: 0, textTransform: 'uppercase' }}>
            Rarity Score
          </p>
          <p style={{ fontFamily: F.display, fontSize: 18, letterSpacing: 1, color: overallRarity.text, margin: 0 }}>
            {rarityScore} / 100
          </p>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: C.orangeL, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${overallRarity.dot}, ${overallRarity.border})`,
            width: `${rarityScore}%`,
            transition: 'width 1.2s cubic-bezier(0.34, 1.2, 0.64, 1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as RarityTier[]).map(tier => (
            <p key={tier} style={{
              fontSize: 9, fontWeight: 800, margin: 0,
              color: tier === rarity ? RARITY_STYLES[tier].text : C.muted,
              letterSpacing: 0.3,
            }}>
              {tier}
            </p>
          ))}
        </div>
      </div>

      <Card>
        <SectionLabel>Your 10 Traits</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {otherTraits.map(({ label, value, rarity: traitRarity, pct }) => {
            const r = RARITY_STYLES[traitRarity];
            const emoji = TRAIT_EMOJI[label] ?? '🍕';
            return (
              <div key={label} style={{
                borderRadius: 14, background: r.bg,
                border: `2px solid ${r.border}`, padding: '10px 12px',
                boxShadow: `2px 2px 0 ${r.border}50`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12 }}>{emoji}</span>
                    <p style={{ fontSize: 10, color: C.muted, margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {label}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 8, fontWeight: 900, color: r.text,
                    background: '#fff', border: `1px solid ${r.border}`,
                    borderRadius: 99, padding: '2px 6px',
                  }}>
                    {traitRarity.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.charcoal, margin: '0 0 4px', lineHeight: 1.2 }}>
                  {value}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 99, background: `${r.border}30`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: r.dot, width: `${pct}%` }} />
                  </div>
                  <p style={{ fontSize: 9, color: C.muted, margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {pct}% have this
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {vibeTrait && (() => {
          const r = RARITY_STYLES[vibeTrait.rarity];
          return (
            <div style={{
              borderRadius: 14,
              background: `linear-gradient(135deg, ${r.bg} 0%, #fff 100%)`,
              border: `2.5px solid ${r.border}`, padding: '12px 14px',
              boxShadow: `3px 3px 0 ${r.border}50`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: r.dot + '20', border: `2px solid ${r.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>✨</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <p style={{ fontSize: 10, color: C.muted, margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Vibe — Personality Synthesis
                  </p>
                  <span style={{
                    fontSize: 8, fontWeight: 900, color: r.text,
                    background: '#fff', border: `1px solid ${r.border}`,
                    borderRadius: 99, padding: '2px 8px',
                  }}>
                    {vibeTrait.rarity.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontFamily: F.display, fontSize: 16, letterSpacing: 1.5, color: r.text, margin: 0 }}>
                  {vibeTrait.value}
                </p>
                <p style={{ fontSize: 10, color: C.muted, margin: '3px 0 0', fontWeight: 600 }}>
                  {vibeTrait.pct}% of Crusties share this vibe
                </p>
              </div>
            </div>
          );
        })()}
      </Card>

      <div style={{
        borderRadius: 14, background: C.orangeL,
        border: `1.5px solid ${C.orange}40`, padding: '10px 14px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: 12, color: C.muted, margin: 0, fontWeight: 600, lineHeight: 1.45 }}>
          <span style={{ color: C.orangeD, fontWeight: 800 }}>No re-rolls.</span> This Crustie was generated from your unique Farcaster data. It&apos;s yours — mint it or leave it.
        </p>
      </div>

      <PrimaryBtn
        label="🍕 Mint This Crustie"
        sub={`${rarity} · 0.001 ETH or $3 USDC`}
        onClick={onMint}
      />

    </AppShell>
  );
}
