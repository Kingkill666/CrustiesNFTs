'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { C, F } from '@/features/app/components/theme';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://crusties-vmf-coin.vercel.app';
const MINIAPP_URL = 'https://farcaster.xyz/miniapps/b8-LN08vo1G6/crusties';

/**
 * Build the /share page URL with OG meta tags for the minted Crustie.
 * Farcaster unfurls this URL and renders the OG image in the cast card.
 */
function buildShareUrl(opts: {
  tokenId?: number;
  imageUrl?: string;
  vibe?: string;
  rarity?: string;
}): string {
  if (!opts.tokenId) return APP_URL;
  const params = new URLSearchParams();
  params.set('tokenId', String(opts.tokenId));
  if (opts.imageUrl) params.set('image', opts.imageUrl);
  if (opts.vibe) params.set('vibe', opts.vibe);
  if (opts.rarity) params.set('rarity', opts.rarity);
  return `${APP_URL}/share?${params.toString()}`;
}

/**
 * Build share embeds for composeCast.
 * Uses the /share page URL (which has OG meta tags with the NFT image)
 * so Farcaster can unfurl it into a rich card showing the Crustie.
 */
export function buildShareEmbeds(opts?: {
  tokenId?: number;
  imageUrl?: string;
  vibe?: string;
  rarity?: string;
}): [string] | [string, string] {
  if (opts?.tokenId) {
    const shareUrl = buildShareUrl(opts);
    return [shareUrl, MINIAPP_URL];
  }
  return [MINIAPP_URL];
}

// ShareButton — uses sdk.actions.composeCast for native Farcaster compose
export function ShareButton({
  children,
  text,
  channelKey,
  embeds,
}: {
  children: React.ReactNode;
  text: string;
  channelKey?: string;
  embeds?: [] | [string] | [string, string];
}) {
  const handleShare = async () => {
    const embedUrls = embeds ?? [MINIAPP_URL];
    try {
      await sdk.actions.composeCast({
        text,
        embeds: embedUrls as [] | [string] | [string, string],
        channelKey,
      });
    } catch (err) {
      console.warn('[ShareButton] composeCast failed, falling back to openUrl:', err);
      const encoded = encodeURIComponent(text);
      const channel = channelKey ? `&channelKey=${channelKey}` : '';
      // For Warpcast fallback, embed each URL
      const embedParams = embedUrls.map(u => `&embeds[]=${encodeURIComponent(u)}`).join('');
      const url = `https://warpcast.com/~/compose?text=${encoded}${channel}${embedParams}`;
      try {
        sdk.actions.openUrl(url);
      } catch {
        window.open(url, '_blank');
      }
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

// AddMiniAppButton — prompts user to add the app to their Farcaster client
export function AddMiniAppButton() {
  const handleAdd = async () => {
    try {
      await sdk.actions.addMiniApp();
      console.log('[AddMiniAppButton] App added successfully');
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error?.message?.includes('RejectedByUser')) {
        console.log('[AddMiniAppButton] User rejected');
      } else {
        console.warn('[AddMiniAppButton] Failed:', err);
      }
    }
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        width: '100%',
        borderRadius: 14,
        border: `2px solid ${C.green}60`,
        background: `linear-gradient(160deg, ${C.green} 0%, #1a5c3a 100%)`,
        padding: '14px 16px',
        cursor: 'pointer',
        color: '#fff',
        fontWeight: 800,
        fontSize: 16,
        minHeight: 52,
      }}
    >
      <span style={{ fontFamily: F.display, letterSpacing: 0.5 }}>📌 Add Crusties to Your Apps</span>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '3px 0 0', fontWeight: 600, fontFamily: F.body }}>
        Get notified about new drops
      </p>
    </button>
  );
}
