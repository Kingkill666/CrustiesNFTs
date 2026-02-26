'use client';

import { AppShell } from '@/features/app/components/app-shell';
import { CrustieNFT } from '@/features/app/components/crustie-nft';
import { C, F, CHECKER_BG } from '@/features/app/components/theme';
import { useGallery } from '@/hooks/use-gallery';
import { useSupply } from '@/hooks/use-supply';

// ─── How It Works step ────────────────────────────────────────────────────────

function HowStep({
  emoji, title, desc, color, isLast = false,
}: {
  emoji: string; title: string; desc: string; color: string; isLast?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: color + '18', border: `2.5px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: `2px 2px 0 ${color}25`,
        }}>
          {emoji}
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 16,
            background: `linear-gradient(to bottom, ${color}40, transparent)`,
            margin: '4px 0',
          }} />
        )}
      </div>
      <div style={{ flex: 1, paddingLeft: 14, paddingBottom: isLast ? 0 : 20, paddingTop: 12 }}>
        <p style={{ fontWeight: 800, margin: '0 0 4px', fontSize: 16, color: C.charcoal, fontFamily: F.body }}>{title}</p>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── LandingScreen ────────────────────────────────────────────────────────────

export function LandingScreen({ onStart, onViewOwned }: { onStart: () => void; onViewOwned: () => void }) {
  const { total, minted } = useSupply();
  const { entries: gallery, isLoading: galleryLoading } = useGallery(10);
  const pct = total > 0 ? Math.min((minted / total) * 100, 100) : 0;

  return (
    <AppShell>

      {/* ── Hero card — checker bg ─────────────────────────────────────────── */}
      <div style={{
        borderRadius: 24,
        background: CHECKER_BG,
        backgroundColor: C.cream,
        border: `2px solid ${C.red}25`,
        padding: '20px 16px 22px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14, textAlign: 'center',
      }}>
        {/* NFT image */}
        <div style={{ filter: 'drop-shadow(0 8px 20px rgba(232,93,4,0.25))' }}>
          <CrustieNFT size={200} tokenId={0} float />
        </div>

        {/* Title */}
        <div>
          <h1 style={{
            fontFamily: F.display,
            fontSize: 48,
            fontWeight: 400,
            margin: '0 0 2px',
            lineHeight: 1.0,
            color: C.red,
            letterSpacing: 2,
            WebkitTextStroke: `1px ${C.orangeD}`,
            paintOrder: 'stroke fill' as React.CSSProperties['paintOrder'],
          }}>
            CRUSTIES
          </h1>
          <p style={{
            fontFamily: F.display,
            fontSize: 15,
            color: C.orange,
            letterSpacing: 3,
            margin: 0,
          }}>
            PIZZA NFTS ON BASE
          </p>
        </div>

        {/* Tagline pill */}
        <div style={{
          background: C.yellow,
          border: `2.5px solid ${C.orange}`,
          borderRadius: 99,
          padding: '9px 24px',
          boxShadow: `3px 3px 0 ${C.orangeD}40`,
        }}>
          <p style={{
            fontFamily: F.display,
            fontSize: 14,
            color: C.orangeD,
            margin: 0,
            letterSpacing: 2,
          }}>
            ✦ YOUR VIBE, BAKED IN ✦
          </p>
        </div>

        {/* Tagline text */}
        <p style={{
          color: C.muted,
          fontSize: 14,
          margin: 0,
          lineHeight: 1.55,
          maxWidth: 280,
          fontFamily: F.body,
        }}>
          500 unique pizza slice NFTs on Base — each one generated from your Farcaster identity
        </p>
      </div>

      {/* ── Supply bar ────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: `2px solid ${C.border}`,
        borderRadius: 20,
        padding: '14px 16px',
        boxShadow: `4px 4px 0 rgba(232,93,4,0.1)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: F.display, fontSize: 14, letterSpacing: 1, color: C.orange }}>
            🍕 {minted.toLocaleString()} minted
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
            {total.toLocaleString()} total
          </span>
        </div>
        <div style={{
          height: 10, borderRadius: 99,
          background: C.orangeL,
          border: `1.5px solid rgba(232,93,4,0.2)`,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${C.red}, ${C.orange}, ${C.yellow})`,
            transition: 'width 1.2s cubic-bezier(0.34, 1.2, 0.64, 1)',
            minWidth: pct > 0 ? 6 : 0,
          }} />
        </div>
        <p style={{ fontSize: 12, color: C.muted, textAlign: 'right', margin: '6px 0 0', fontWeight: 600, fontFamily: F.body }}>
          {(total - minted).toLocaleString()} remaining
        </p>
      </div>

      {/* ── Primary CTA ───────────────────────────────────────────────────────── */}
      <button
        onClick={onStart}
        style={{
          width: '100%', borderRadius: 20,
          border: `2.5px solid ${C.orangeD}`,
          background: `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeD} 100%)`,
          padding: '20px 16px',
          cursor: 'pointer',
          boxShadow: `0 5px 0 ${C.orangeD}, 0 8px 20px rgba(196,73,0,0.35)`,
          minHeight: 70,
        }}
      >
        <p style={{
          color: '#fff', fontWeight: 400, fontSize: 26,
          margin: 0, fontFamily: F.display, letterSpacing: 1,
        }}>
          🍕 Bake My Crustie
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '5px 0 0', fontWeight: 600, fontFamily: F.body }}>
          Mint with 0.001 ETH or $3 USDC · revealed after minting
        </p>
      </button>

      {/* ── Live gallery ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: `2px solid ${C.border}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: `4px 4px 0 rgba(232,93,4,0.1)`,
        overflow: 'visible',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{
            fontFamily: F.display, fontSize: 14, letterSpacing: 2,
            textTransform: 'uppercase', color: C.crust, margin: 0,
          }}>
            Crusties in the Wild
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff0f0', border: `1.5px solid ${C.red}40`,
            borderRadius: 99, padding: '5px 12px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: C.red, animation: 'pulse-dot 1.2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: F.display, fontSize: 11, letterSpacing: 1.5, color: C.red }}>LIVE</span>
          </div>
        </div>

        {galleryLoading ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 0, paddingTop: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                width: 74, height: 94, borderRadius: 16, flexShrink: 0,
                background: '#f5f0e8', animation: 'pulse-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        ) : gallery.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 0, paddingTop: 24,
              scrollbarWidth: 'none',
            }}>
              {gallery.map((entry, i) => (
                <div key={entry.tokenId} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  flexShrink: 0,
                  animation: `float-pizza ${3 + i * 0.28}s ease-in-out infinite`,
                  animationDelay: `${i * 0.22}s`,
                }}>
                  <div style={{
                    borderRadius: 14, border: `2px solid ${C.orange}30`,
                    background: '#111', padding: 3,
                    boxShadow: `2px 2px 0 ${C.orange}15`,
                    transform: `rotate(${entry.rotation}) scaleX(${entry.flipX ? -1 : 1})`,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.imageUrl}
                      alt={`Crustie #${entry.tokenId}`}
                      width={66} height={66}
                      style={{ borderRadius: 11, objectFit: 'cover', display: 'block', filter: entry.filter }}
                    />
                  </div>
                  <p style={{
                    fontFamily: F.body, fontSize: 10, fontWeight: 700,
                    color: C.muted, margin: 0,
                  }}>
                    @{entry.minterUsername}
                  </p>
                </div>
              ))}
            </div>
            {/* Small right-edge fade to hint at scroll */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 0,
                bottom: 0,
                width: 28,
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95))',
                pointerEvents: 'none',
              }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 36, margin: '0 0 8px' }}>🍕</p>
            <p style={{ color: C.muted, fontSize: 14, margin: 0, fontWeight: 700, fontFamily: F.body }}>
              Be the first to mint a Crustie!
            </p>
          </div>
        )}

        <p style={{
          fontFamily: F.body, fontSize: 12, color: C.muted,
          margin: '12px 0 0', textAlign: 'center', fontWeight: 500,
        }}>
          Each Crustie is unique — generated from their Farcaster identity
        </p>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { val: '500',  lbl: 'Total supply', color: C.orange, bg: C.orangeL },
          { val: '0.001Ξ', lbl: 'or $3 USDC',   color: C.green,  bg: '#edf7f0' },
          { val: '∞',      lbl: 'per wallet',    color: C.red,    bg: '#fff0f0' },
        ].map(({ val, lbl, color, bg }) => (
          <div key={lbl} style={{
            background: bg, border: `2px solid ${color}35`, borderRadius: 18,
            padding: '16px 8px', textAlign: 'center',
            boxShadow: `2px 2px 0 ${color}20`,
          }}>
            <p style={{
              fontFamily: F.display, fontSize: 22, letterSpacing: 1,
              color, margin: '0 0 4px', lineHeight: 1,
            }}>
              {val}
            </p>
            <p style={{
              fontSize: 10, color: C.muted, margin: 0,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
              fontFamily: F.body,
            }}>
              {lbl}
            </p>
          </div>
        ))}
      </div>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: `2px solid ${C.border}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: `4px 4px 0 rgba(232,93,4,0.1)`,
      }}>
        <p style={{
          fontFamily: F.display, fontSize: 14, letterSpacing: 2,
          textTransform: 'uppercase', color: C.crust, margin: '0 0 16px',
        }}>
          How it works
        </p>
        <HowStep
          emoji="🔍" color={C.orange}
          title="Analyze your Farcaster identity"
          desc="We read 10 signals: casts, engagement, Neynar score, account age, follower count, social graph & more"
        />
        <HowStep
          emoji="🍕" color={C.red}
          title="AI generates your Crustie"
          desc="Your signals map to 10 unique traits — an AI bakes your one-of-a-kind pizza NFT just for you"
        />
        <HowStep
          emoji="📌" color={C.green}
          title="Pinned to IPFS permanently"
          desc="Your image and metadata are pinned to IPFS before minting — stored forever, no matter what"
        />
        <HowStep
          emoji="⛓️" color={C.crust}
          title="Mint on Base" isLast
          desc="Own it on Base. Pay 0.001 ETH or $3 USDC. No re-rolls — your Crustie is your Crustie"
        />
      </div>

      {/* ── Trait teaser ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: `2.5px solid ${C.yellow}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: `4px 4px 0 rgba(255,209,102,0.4)`,
      }}>
        <p style={{
          fontFamily: F.display, fontSize: 14, letterSpacing: 2,
          textTransform: 'uppercase', color: C.orangeD, margin: '0 0 14px',
        }}>
          10 traits. All from your data.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { trait: 'Crust',      signal: 'Account age'     },
            { trait: 'Sauce',      signal: 'Cast tone'       },
            { trait: 'Cheese',     signal: 'Engagement rate' },
            { trait: 'Toppings',   signal: 'Your topics'     },
            { trait: 'Eyes',       signal: 'Neynar score'    },
            { trait: 'Nose',       signal: 'Cast frequency'  },
            { trait: 'Background', signal: 'Social presence' },
            { trait: 'Accessory',  signal: 'Follower count'  },
            { trait: 'Drizzle',    signal: 'Follower ratio'  },
            { trait: 'Vibe',       signal: 'Everything ☝️'   },
          ].map(({ trait, signal }) => (
            <div key={trait} style={{
              borderRadius: 12, background: '#fff',
              border: `1.5px solid ${C.yellow}`, padding: '7px 12px',
              display: 'flex', flexDirection: 'column', gap: 2,
              boxShadow: `1px 1px 0 ${C.yellow}`,
            }}>
              <span style={{
                fontFamily: F.display, fontSize: 13, color: C.orangeD, letterSpacing: 1,
              }}>
                {trait}
              </span>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: F.body }}>
                {signal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTAs ───────────────────────────────────────────────────────── */}
      <button
        onClick={onStart}
        style={{
          width: '100%', borderRadius: 20,
          border: `2.5px solid ${C.orangeD}`,
          background: `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeD} 100%)`,
          padding: '20px 16px',
          cursor: 'pointer',
          boxShadow: `0 5px 0 ${C.orangeD}, 0 8px 20px rgba(196,73,0,0.35)`,
          minHeight: 70,
        }}
      >
        <p style={{
          color: '#fff', fontWeight: 400, fontSize: 26,
          margin: 0, fontFamily: F.display, letterSpacing: 1,
        }}>
          🍕 Bake My Crustie
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '5px 0 0', fontWeight: 600, fontFamily: F.body }}>
          Mint with 0.001 ETH or $3 USDC · revealed after minting
        </p>
      </button>

      <button
        onClick={onViewOwned}
        style={{
          width: '100%', borderRadius: 16,
          border: `2px solid ${C.border}`,
          background: '#fff',
          padding: '16px 16px',
          cursor: 'pointer',
          color: C.orangeD,
          fontWeight: 700, fontSize: 16,
          boxShadow: `2px 2px 0 rgba(232,93,4,0.08)`,
          minHeight: 56,
          fontFamily: F.body,
        }}
      >
        View my Crusties
      </button>

      <p style={{
        fontSize: 12, color: C.muted, textAlign: 'center',
        fontWeight: 600, fontFamily: F.body,
      }}>
        IPFS storage · Base network · upgradeable contract
      </p>

    </AppShell>
  );
}
