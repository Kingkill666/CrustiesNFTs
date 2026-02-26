'use client';

import { useState } from 'react';
import { AppShell } from '@/features/app/components/app-shell';
import { Card } from '@/features/app/components/ui-primitives';
import { C, F } from '@/features/app/components/theme';
import type { PaymentMethod } from '@/features/app/types';

const ETH_COLOR  = '#627EEA';
const USDC_COLOR = '#2775CA';

interface MintScreenProps {
  onConfirm: (method: PaymentMethod) => void;
  onHome?: () => void;
  /** True while backend generate is in-flight (before wallet prompt) */
  preparing?: boolean;
  /** Error message to display */
  error?: string;
}

export function MintScreen({ onConfirm, onHome, preparing, error }: MintScreenProps) {
  const [payment, setPayment] = useState<PaymentMethod>('eth');
  const isEth = payment === 'eth';

  return (
    <AppShell onHome={onHome}>

      {/* Mystery Crustie teaser */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 4 }}>
        <div style={{
          width: 130, height: 130, borderRadius: 130 * 0.22,
          background: `linear-gradient(145deg, ${C.orangeL} 0%, ${C.yellow}40 100%)`,
          border: `3px dashed ${C.orange}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 56,
          boxShadow: `0 6px 0 ${C.orangeD}20`,
          animation: 'float-pizza 3.5s ease-in-out infinite',
        }}>
          🍕
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F.display, fontSize: 20, color: C.orangeD, margin: '0 0 4px', letterSpacing: 1 }}>
            Your Crustie Awaits
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, fontWeight: 600 }}>
            Mint first — your unique pizza NFT is revealed after 🎉
          </p>
        </div>
      </div>

      <div>
        <p style={{ fontFamily: F.display, fontSize: 12, letterSpacing: 2, color: C.muted, margin: '0 0 10px', textTransform: 'uppercase' }}>
          Choose Payment
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          <button onClick={() => !preparing && setPayment('eth')} style={{
            padding: '18px 12px', borderRadius: 20,
            border: `2.5px solid ${isEth ? ETH_COLOR : C.border}`,
            background: isEth ? `linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)` : '#fafafa',
            cursor: preparing ? 'not-allowed' : 'pointer', textAlign: 'center',
            boxShadow: isEth ? `0 4px 0 ${ETH_COLOR}35` : `2px 2px 0 rgba(0,0,0,0.04)`,
            transition: 'all 0.18s ease', position: 'relative',
            opacity: preparing ? 0.6 : 1,
          }}>
            {isEth && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 18, height: 18, borderRadius: '50%', background: ETH_COLOR,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={9} height={9} viewBox="0 0 10 10">
                  <path d="M 1.5 5 L 4 8 L 8.5 2" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: isEth ? ETH_COLOR + '18' : 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 26,
            }}>⟠</div>
            <p style={{ fontFamily: F.display, fontSize: 22, letterSpacing: 0.5, color: isEth ? ETH_COLOR : C.charcoal, margin: '0 0 2px' }}>
              0.001 Ξ
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: '0 0 4px' }}>≈ $3.20</p>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              color: isEth ? ETH_COLOR : C.muted,
              background: isEth ? ETH_COLOR + '15' : 'transparent',
              border: `1px solid ${isEth ? ETH_COLOR + '40' : 'transparent'}`,
              borderRadius: 99, padding: '2px 8px',
            }}>Base ETH</div>
          </button>

          <button onClick={() => !preparing && setPayment('usdc')} style={{
            padding: '18px 12px', borderRadius: 20,
            border: `2.5px solid ${!isEth ? USDC_COLOR : C.border}`,
            background: !isEth ? `linear-gradient(145deg, #eff8ff 0%, #dbeeff 100%)` : '#fafafa',
            cursor: preparing ? 'not-allowed' : 'pointer', textAlign: 'center',
            boxShadow: !isEth ? `0 4px 0 ${USDC_COLOR}35` : `2px 2px 0 rgba(0,0,0,0.04)`,
            transition: 'all 0.18s ease', position: 'relative',
            opacity: preparing ? 0.6 : 1,
          }}>
            {!isEth && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 18, height: 18, borderRadius: '50%', background: USDC_COLOR,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={9} height={9} viewBox="0 0 10 10">
                  <path d="M 1.5 5 L 4 8 L 8.5 2" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: !isEth ? USDC_COLOR + '18' : 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 26,
            }}>💵</div>
            <p style={{ fontFamily: F.display, fontSize: 22, letterSpacing: 0.5, color: !isEth ? USDC_COLOR : C.charcoal, margin: '0 0 2px' }}>
              $3.00
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: '0 0 4px' }}>Stablecoin</p>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              color: !isEth ? USDC_COLOR : C.muted,
              background: !isEth ? USDC_COLOR + '15' : 'transparent',
              border: `1px solid ${!isEth ? USDC_COLOR + '40' : 'transparent'}`,
              borderRadius: 99, padding: '2px 8px',
            }}>USDC on Base</div>
          </button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { lbl: 'Crustie NFT',  val: isEth ? '0.001 ETH' : '$3.00 USDC', color: C.charcoal },
            { lbl: 'IPFS storage', val: 'Included ✅',                        color: C.green    },
            { lbl: 'Network',      val: 'Base Mainnet',                       color: '#3b82f6'  },
            { lbl: 'Gas estimate', val: '< $0.01',                            color: C.muted    },
          ] as { lbl: string; val: string; color: string }[]).map(({ lbl, val, color }) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: C.muted, margin: 0, fontSize: 13, fontWeight: 600 }}>{lbl}</p>
              <p style={{ fontFamily: F.body, fontWeight: 700, margin: 0, fontSize: 13, color }}>{val}</p>
            </div>
          ))}
          <div style={{
            borderTop: `2px dashed ${C.border}`, paddingTop: 12, marginTop: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ fontWeight: 800, margin: 0, fontSize: 14, color: C.charcoal }}>Total</p>
            <p style={{ fontFamily: F.display, fontSize: 26, letterSpacing: 1, margin: 0, color: isEth ? ETH_COLOR : USDC_COLOR }}>
              {isEth ? '0.001 ETH' : '$3 USDC'}
            </p>
          </div>
        </div>
      </Card>

      {/* Error banner */}
      {error && (
        <div style={{
          borderRadius: 14, background: '#fff0f0', border: `2px solid ${C.red}40`, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>❌</span>
          <div>
            <p style={{ fontFamily: F.body, fontWeight: 800, color: C.red, margin: '0 0 2px', fontSize: 13 }}>{error}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0, fontWeight: 600 }}>Your wallet was not charged. Try again.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => !preparing && onConfirm(payment)}
        disabled={preparing}
        style={{
          width: '100%', borderRadius: 18,
          border: `2.5px solid ${C.orangeD}`,
          background: preparing
            ? `linear-gradient(160deg, ${C.orange}90 0%, ${C.orangeD}90 100%)`
            : `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeD} 100%)`,
          padding: '18px 16px', cursor: preparing ? 'not-allowed' : 'pointer',
          boxShadow: `0 4px 0 ${C.orangeD}`,
          minHeight: 62,
          opacity: preparing ? 0.85 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, fontFamily: F.display, letterSpacing: 0.5 }}>
          {preparing ? '🍕 Preparing Your Crustie...' : '🍕 Bake My Crustie'}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, margin: '4px 0 0', fontWeight: 600 }}>
          {preparing
            ? 'Generating your NFT — wallet will prompt shortly'
            : isEth ? 'Wallet will prompt for 0.001 ETH + gas' : 'Wallet will prompt for USDC approval, then mint'}
        </p>
      </button>

      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', fontWeight: 600, lineHeight: 1.5 }}>
        Your Crustie is revealed after minting 🍕{'\n'}
        USDC path requires one approval tx first
      </p>

    </AppShell>
  );
}
