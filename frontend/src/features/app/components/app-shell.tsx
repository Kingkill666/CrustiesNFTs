'use client';

import { C, F, CHECKER_BG, ANIM_STYLES, FONT_FACES } from '@/features/app/components/theme';

interface AppShellProps {
  children: React.ReactNode;
  onHome?: () => void;
}

export function AppShell({ children, onHome }: AppShellProps) {
  return (
    <>
      <style>{FONT_FACES + ANIM_STYLES}</style>
      <div
        style={{
          minHeight: '100dvh',
          background: CHECKER_BG,
          backgroundColor: C.cream,
          fontFamily: F.body,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px 10px',
            borderBottom: `1.5px solid rgba(232,93,4,0.15)`,
            background: 'rgba(255,253,247,0.92)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          {onHome && (
            <button
              onClick={onHome}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 8,
                color: C.orange,
                fontSize: 20,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label="Back to home"
            >
              ←
            </button>
          )}

          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/app-logo.png"
              alt="Crusties logo"
              width={38}
              height={38}
              style={{ borderRadius: 10, objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span
              style={{
                fontFamily: F.display,
                fontSize: 38,
                color: C.red,
                letterSpacing: 2,
                lineHeight: 1,
                paddingTop: 6,
              }}
            >
              Crusties
            </span>
          </div>

          {/* Pizza Party logo + text */}
          <a
            href="https://farcaster.xyz/miniapps/wgY6OPqYoIkz/pizza-party"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
          >
            <span
              style={{
                fontFamily: F.display,
                fontSize: 38,
                color: C.red,
                letterSpacing: 2,
                lineHeight: 1,
                paddingTop: 6,
                whiteSpace: 'nowrap',
              }}
            >
              Pizza Party
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Pizza Party"
              width={36}
              height={36}
              style={{ borderRadius: 10, objectFit: 'cover', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </a>
        </div>

        {/* ── Page content ──────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
