'use client';

import { AppShell } from '@/features/app/components/app-shell';
import { PrimaryBtn } from '@/features/app/components/ui-primitives';
import { CrustieNFT } from '@/features/app/components/crustie-nft';
import { C, F, RARITY_STYLES } from '@/features/app/components/theme';
import { ShareButton, buildShareUrl } from '@/neynar-farcaster-sdk/mini';
import { useOwnedCrusties } from '@/hooks/use-owned-crusties';

interface OwnedScreenProps {
  fid?: number;
  username?: string;
  onMintAnother: () => void;
  onHome?: () => void;
}

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 22, background: '#fff', border: `2px solid ${C.border}`,
      padding: '16px 14px', display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{
        width: 76, height: 76, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(90deg, #f5f0e8 25%, #fffdf7 50%, #f5f0e8 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 18, width: '55%', borderRadius: 99, background: '#f5f0e8', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 22, width: '35%', borderRadius: 99, background: '#f5f0e8', animation: 'shimmer 1.4s infinite 0.1s' }} />
      </div>
    </div>
  );
}

export function OwnedScreen({ fid, username, onMintAnother, onHome }: OwnedScreenProps) {
  const { crusties, isLoading } = useOwnedCrusties(fid);

  return (
    <AppShell onHome={onHome}>

      <div style={{
        borderRadius: 22,
        background: `linear-gradient(135deg, ${C.orangeD} 0%, ${C.red} 100%)`,
        padding: '18px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: `4px 4px 0 ${C.charcoal}20`,
      }}>
        <div>
          <p style={{ fontFamily: F.display, fontSize: 26, letterSpacing: 1.5, margin: '0 0 4px', color: '#fff' }}>
            Your Crusties
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0, fontWeight: 600 }}>
            {username ? `@${username}` : 'Your wallet'}
            {!isLoading && (
              <span style={{
                marginLeft: 8, background: 'rgba(255,255,255,0.2)',
                borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 800,
              }}>
                {crusties.length} {crusties.length === 1 ? 'Crustie' : 'Crusties'}
              </span>
            )}
          </p>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', border: '2.5px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>🍕</div>
      </div>

      {isLoading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <style>{`@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }`}</style>
        </>
      )}

      {!isLoading && crusties.length === 0 && (
        <div style={{
          borderRadius: 22, background: '#fff',
          border: `2px dashed ${C.orange}50`, padding: '36px 20px',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 52 }}>🍕</div>
          <p style={{ fontFamily: F.display, fontSize: 24, letterSpacing: 1.5, color: C.orangeD, margin: 0 }}>
            No Crusties Yet!
          </p>
          <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, margin: 0, maxWidth: 220, lineHeight: 1.5 }}>
            Your unique pizza NFT is waiting to be generated. Get baking!
          </p>
        </div>
      )}

      {crusties.map((crustie) => {
        const r = RARITY_STYLES[crustie.rarity] ?? RARITY_STYLES.Common;
        return (
          <div key={crustie.tokenId} style={{
            borderRadius: 22, background: '#fff',
            border: `2.5px solid ${r.border}`, padding: '16px 14px',
            boxShadow: `3px 3px 0 ${r.border}30`,
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ filter: `drop-shadow(0 4px 16px ${r.border}60)`, flexShrink: 0 }}>
                <CrustieNFT size={76} tokenId={crustie.tokenId} imageUrl={crustie.imageUrl} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <p style={{ fontFamily: F.display, fontSize: 20, letterSpacing: 1, margin: 0, color: C.charcoal }}>
                    Crustie #{crustie.tokenId}
                  </p>
                  <div style={{
                    background: r.bg, border: `1.5px solid ${r.border}`,
                    borderRadius: 99, padding: '2px 10px',
                    fontSize: 11, fontWeight: 800, color: r.text,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot }} />
                    {crustie.rarity}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.orangeD, fontWeight: 700, margin: '0 0 8px', fontStyle: 'italic' }}>
                  ✨ {crustie.vibe}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <ShareButton
                  text={`just dropped the craziest ${crustie.rarity} pizza NFT on Base 🍕🔥 Crustie #${crustie.tokenId} — "${crustie.vibe}" — generated from my Farcaster identity. no two are alike. mint yours 👇`}
                  embeds={[buildShareUrl({ tokenId: crustie.tokenId, imageUrl: crustie.imageUrl, vibe: crustie.vibe, rarity: crustie.rarity })]}
                >
                  Share 🍕
                </ShareButton>
              </div>
              {crustie.txHash && (
                <button
                  onClick={() => window.open(`https://basescan.org/tx/${crustie.txHash}`, '_blank')}
                  style={{
                    flex: 1, background: 'transparent',
                    border: `1.5px solid ${r.border}`, borderRadius: 12,
                    padding: '9px 14px', cursor: 'pointer', color: r.text,
                    fontWeight: 800, fontSize: 12, fontFamily: F.body,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44,
                  }}
                >
                  <span>⛓️</span><span>BaseScan</span><span style={{ fontSize: 11 }}>↗</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!isLoading && (
        <PrimaryBtn label="🍕 Mint Another Crustie" onClick={onMintAnother} />
      )}

    </AppShell>
  );
}
