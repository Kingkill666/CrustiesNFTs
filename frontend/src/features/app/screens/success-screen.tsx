'use client';

import { AppShell } from '@/features/app/components/app-shell';
import { Card, GhostBtn } from '@/features/app/components/ui-primitives';
import { CrustieNFT } from '@/features/app/components/crustie-nft';
import { C, F, RARITY_STYLES } from '@/features/app/components/theme';
import { ShareButton } from '@/neynar-farcaster-sdk/mini';
import type { RarityTier } from '@/features/app/types';

interface SuccessScreenProps {
  tokenId?: number;
  vibe?: string;
  rarity?: RarityTier;
  txHash?: string;
  tokenURI?: string;
  imageUrl?: string;
  username?: string;
  onMintAnother?: () => void;
  onViewOwned?: () => void;
}

function ConfettiPiece({ i }: { i: number }) {
  const colors = [C.orange, C.yellow, C.red, C.green, '#3b82f6', '#a855f7', '#ec4899', C.orangeD];
  const isPizza  = i % 7 === 0;
  const isCircle = i % 3 === 0;
  const size     = isPizza ? 16 : isCircle ? 8 : i % 2 === 0 ? 10 : 6;
  const color    = colors[i % colors.length];
  const left     = `${((i * 4.76) % 100)}%`;
  const duration = 2.2 + (i % 7) * 0.28;
  const delay    = (i * 0.11) % 2.8;

  return (
    <div style={{
      position: 'absolute', left, top: -20,
      width: size, height: isPizza ? size : isCircle ? size : size * 1.6,
      borderRadius: isCircle || isPizza ? '50%' : 3,
      background: isPizza ? 'transparent' : color,
      fontSize: isPizza ? 14 : undefined,
      display: isPizza ? 'flex' : undefined,
      alignItems: isPizza ? 'center' : undefined,
      justifyContent: isPizza ? 'center' : undefined,
      animation: `confetti-fall ${duration}s ease-in infinite, confetti-spin ${duration * 0.7}s linear infinite`,
      animationDelay: `${delay}s`,
    }}>
      {isPizza ? '🍕' : null}
    </div>
  );
}

export function SuccessScreen({
  tokenId = 1848, vibe = 'Classic Crustie', rarity = 'Common',
  txHash, tokenURI, imageUrl, username, onMintAnother, onViewOwned,
}: SuccessScreenProps) {
  const r = RARITY_STYLES[rarity];
  const baseScanUrl = txHash ? `https://basescan.org/tx/${txHash}` : 'https://basescan.org';

  return (
    <AppShell>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
        {Array.from({ length: 36 }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute', width: 250, height: 250, borderRadius: '50%',
            background: `radial-gradient(circle, ${r.dot}40 0%, ${r.dot}12 50%, transparent 70%)`,
            animation: 'glow-pulse 2.2s ease-in-out infinite',
          }} />
          <div style={{
            animation: 'crustie-reveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            filter: `drop-shadow(0 16px 40px ${r.dot}70)`,
            zIndex: 1,
          }}>
            <CrustieNFT size={215} tokenId={tokenId} float imageUrl={imageUrl} />
          </div>
        </div>
        <p style={{ fontFamily: F.display, fontSize: 13, letterSpacing: 3, color: C.muted, margin: 0, textTransform: 'uppercase' }}>
          Crustie #{tokenId}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', animation: 'stamp-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both' }}>
        <div style={{
          background: C.yellow, border: `3px solid ${C.orange}`,
          borderRadius: 99, padding: '10px 28px',
          boxShadow: `4px 4px 0 ${C.orangeD}50`, transform: 'rotate(-1.5deg)',
        }}>
          <p style={{ fontFamily: F.display, fontSize: 18, color: C.red, margin: 0, letterSpacing: 2 }}>
            🎉 YOU&apos;RE A CRUSTIE!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          background: C.orangeL, border: `2px solid ${C.orange}60`,
          borderRadius: 99, padding: '7px 18px',
          fontFamily: F.display, fontSize: 13, color: C.orangeD, letterSpacing: 1.5,
        }}>
          ✦ {vibe} ✦
        </div>
        <div style={{
          background: r.bg, border: `2px solid ${r.border}`,
          borderRadius: 99, padding: '7px 16px',
          fontFamily: F.display, fontSize: 13, color: r.text, letterSpacing: 1.5,
        }}>
          {rarity === 'Legendary' ? '⭐' : rarity === 'Epic' ? '💜' : rarity === 'Rare' ? '💙' : rarity === 'Uncommon' ? '💚' : '🍕'} {rarity}
        </div>
      </div>

      <Card accent={C.green}>
        <div style={{
          background: C.greenL, border: `1.5px solid ${C.green}50`,
          borderRadius: 12, padding: '10px 14px',
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: C.green, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={12} height={12} viewBox="0 0 12 12">
              <path d="M 2 6 L 5 9.5 L 10.5 2.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: F.display, color: C.green, margin: 0, fontSize: 14, letterSpacing: 1 }}>Minted on Base</p>
            <p style={{ color: C.muted, margin: 0, fontSize: 11, fontWeight: 600 }}>Permanently pinned to IPFS</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { lbl: 'Owner',    val: username ? `@${username}` : 'Your wallet',             color: C.charcoal },
            { lbl: 'Token ID', val: `Crustie #${tokenId}`,                                  color: C.orange   },
            { lbl: 'Network',  val: 'Base Mainnet',                                          color: '#3b82f6'  },
            { lbl: 'Rarity',   val: rarity,                                                  color: r.text     },
            { lbl: 'IPFS',     val: tokenURI ? tokenURI.slice(0, 20) + '…' : '—',            color: C.green    },
            { lbl: 'Tx Hash',  val: txHash   ? txHash.slice(0, 14)   + '…' : 'Confirming…', color: C.muted    },
          ] as { lbl: string; val: string; color: string }[]).map(({ lbl, val, color }, i, arr) => (
            <div key={lbl} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              paddingBottom: i < arr.length - 1 ? 8 : 0,
            }}>
              <p style={{ color: C.muted, margin: 0, fontSize: 12, fontWeight: 600 }}>{lbl}</p>
              <p style={{ fontFamily: F.body, margin: 0, fontSize: 12, fontWeight: 700, color }}>{val}</p>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => window.open('https://warpcast.com/~/settings', '_blank')}
          style={{
            width: '100%', borderRadius: 16,
            border: `2.5px solid ${C.orangeD}`,
            background: `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeD} 100%)`,
            padding: '17px 16px', cursor: 'pointer',
            boxShadow: `0 4px 0 ${C.orangeD}`, minHeight: 56,
          }}
        >
          <p style={{ color: '#fff', fontWeight: 900, fontSize: 17, margin: 0, fontFamily: F.display, letterSpacing: 0.5 }}>
            🖼️ Set as Farcaster PFP
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '3px 0 0', fontWeight: 600 }}>
            Open Warpcast settings to update
          </p>
        </button>

        <ShareButton
          text={`just dropped the craziest ${rarity} pizza NFT on Base 🍕🔥 Crustie #${tokenId} — "${vibe}" — AI-generated from my Farcaster identity. no two are alike. mint yours 👇`}
          channelKey="pizza-party"
        >
          Share My Crustie 🍕
        </ShareButton>

        <GhostBtn label="View on BaseScan ↗" onClick={() => window.open(baseScanUrl, '_blank')} />
        {onViewOwned && <GhostBtn label="My Crusties Collection" onClick={onViewOwned} />}
        {onMintAnother && <GhostBtn label="Mint Another 🍕" onClick={onMintAnother} />}
      </div>
    </AppShell>
  );
}
