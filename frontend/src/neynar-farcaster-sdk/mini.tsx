'use client';

import { sdk } from '@farcaster/miniapp-sdk';

// ShareButton — wraps sdk.actions.openUrl to Warpcast compose
export function ShareButton({
  children,
  text,
  channelKey,
}: {
  children: React.ReactNode;
  text: string;
  channelKey?: string;
}) {
  const handleShare = () => {
    const encoded = encodeURIComponent(text);
    const channel = channelKey ? `&channelKey=${channelKey}` : '';
    const url = `https://warpcast.com/~/compose?text=${encoded}${channel}`;
    try {
      sdk.actions.openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        width: '100%',
        borderRadius: 14,
        border: '2px solid rgba(99,100,241,0.4)',
        background: 'linear-gradient(160deg, #6366f1 0%, #8b5cf6 100%)',
        padding: '14px 16px',
        cursor: 'pointer',
        color: '#fff',
        fontWeight: 800,
        fontSize: 16,
        minHeight: 52,
      }}
    >
      {children}
    </button>
  );
}
