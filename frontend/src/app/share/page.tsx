import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://crusties-vmf-coin.vercel.app';

interface SharePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const tokenId = typeof params.tokenId === 'string' ? params.tokenId : '';
  const image = typeof params.image === 'string' ? params.image : '';
  const vibe = typeof params.vibe === 'string' ? params.vibe : 'Pizza NFT';
  const rarity = typeof params.rarity === 'string' ? params.rarity : '';

  // Use the NFT image for the embed card, fallback to generic OG image
  const imageUrl = image || `${APP_URL}/og-image.png`;
  const title = tokenId ? `Crustie #${tokenId} — ${vibe}` : 'Crusties — Pizza NFTs on Base';
  const description = rarity
    ? `A ${rarity} Crustie pizza NFT on Base. Mint yours!`
    : 'Mint your unique pizza NFT on Base. 500 supply.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1024, height: 1024 }],
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: 'Mint Your Crustie',
          action: {
            type: 'launch_miniapp',
            name: 'Crusties',
            url: APP_URL,
            splashImageUrl: `${APP_URL}/logo.png`,
            splashBackgroundColor: '#E85D04',
          },
        },
      }),
      'fc:frame': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: 'Mint Your Crustie',
          action: {
            type: 'launch_frame',
            name: 'Crusties',
            url: APP_URL,
            splashImageUrl: `${APP_URL}/logo.png`,
            splashBackgroundColor: '#E85D04',
          },
        },
      }),
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const tokenId = typeof params.tokenId === 'string' ? params.tokenId : '';

  // This page exists mainly for its meta tags. Redirect to the app.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20, textAlign: 'center' }}>
      <p style={{ fontSize: 48, margin: '0 0 16px' }}>🍕</p>
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>
        {tokenId ? `Crustie #${tokenId}` : 'Crusties'}
      </h1>
      <p style={{ color: '#666', fontSize: 16 }}>
        Opening Crusties mini app...
      </p>
    </div>
  );
}
