'use client';

import { C, F } from '@/features/app/components/theme';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  accent,
  style = {},
}: {
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${accent ?? C.border}`,
      borderRadius: 20,
      padding: 16,
      boxShadow: `4px 4px 0 ${accent ? accent + '30' : 'rgba(232,93,4,0.1)'}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <p style={{
      fontFamily: F.display,
      fontSize: 13,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
      color: C.crust,
      margin: '0 0 12px',
      ...style,
    }}>
      {children}
    </p>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────
export function PrimaryBtn({
  label,
  sub,
  onClick,
  disabled,
}: {
  label: string;
  sub?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        borderRadius: 16,
        border: `2.5px solid ${disabled ? '#ccc' : C.orangeD}`,
        background: disabled
          ? '#e5e5e5'
          : `linear-gradient(160deg, ${C.orange} 0%, ${C.orangeD} 100%)`,
        padding: '17px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 0 ${C.orangeD}, 0 6px 16px rgba(232,93,4,0.3)`,
        transition: 'transform 0.1s, box-shadow 0.1s',
        minHeight: 56,
      }}
    >
      <p style={{
        color: disabled ? '#999' : '#fff',
        fontWeight: 900,
        fontSize: 18,
        margin: 0,
        letterSpacing: 0.2,
        fontFamily: F.display,
      }}>
        {label}
      </p>
      {sub && (
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '4px 0 0', fontWeight: 600 }}>
          {sub}
        </p>
      )}
    </button>
  );
}

// ─── Ghost button ─────────────────────────────────────────────────────────────
export function GhostBtn({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        borderRadius: 14,
        border: `2px solid ${C.border}`,
        background: '#fff',
        padding: '14px 16px',
        cursor: 'pointer',
        color: C.crust,
        fontWeight: 700,
        fontSize: 15,
        boxShadow: `2px 2px 0 rgba(232,93,4,0.08)`,
        minHeight: 52,
        fontFamily: F.body,
      }}
    >
      {label}
    </button>
  );
}

// ─── Supply progress bar ──────────────────────────────────────────────────────
export function SupplyBar({ total, minted }: { total: number; minted: number }) {
  const pct = total > 0 ? Math.min((minted / total) * 100, 100) : 0;

  const barColor = pct > 80
    ? `linear-gradient(90deg, ${C.orange}, ${C.red})`
    : `linear-gradient(90deg, ${C.red}, ${C.orange}, ${C.yellow})`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: F.display, fontSize: 13, letterSpacing: 1, color: C.orange }}>
          🍕 {minted.toLocaleString()} minted
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
          {total.toLocaleString()} total
        </span>
      </div>
      <div style={{
        height: 10,
        borderRadius: 99,
        background: C.orangeL,
        border: `1.5px solid rgba(232,93,4,0.2)`,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 99,
          background: barColor,
          transition: 'width 1.2s cubic-bezier(0.34, 1.2, 0.64, 1)',
          minWidth: pct > 0 ? 6 : 0,
        }} />
      </div>
      <p style={{ fontSize: 11, color: C.muted, textAlign: 'right', margin: '5px 0 0', fontWeight: 600 }}>
        {(total - minted).toLocaleString()} remaining
      </p>
    </div>
  );
}
