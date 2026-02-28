import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const TOKEN_URI_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

/** Convert ipfs:// URI to an HTTPS gateway URL */
function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
  }
  return uri;
}

/**
 * GET /api/image?tokenId=12
 *
 * Reads the on-chain tokenURI for the given token, fetches the IPFS metadata,
 * extracts the image URL, and redirects to it. This gives Farcaster's unfurler
 * a fast, reliable URL under our own domain that resolves to the actual NFT image.
 *
 * Responses are cached for 1 hour (immutable NFT images don't change).
 */
export async function GET(request: NextRequest) {
  const tokenId = request.nextUrl.searchParams.get('tokenId');

  if (!tokenId || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
    return NextResponse.redirect(
      new URL('/og-image.png', request.nextUrl.origin),
      { status: 302 }
    );
  }

  try {
    // 1. Read tokenURI from the contract
    const tokenURI = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_URI_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    if (!tokenURI) {
      return NextResponse.redirect(
        new URL('/og-image.png', request.nextUrl.origin),
        { status: 302 }
      );
    }

    // 2. Fetch the metadata JSON from IPFS
    const metadataUrl = ipfsToHttp(tokenURI);
    const metadataRes = await fetch(metadataUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!metadataRes.ok) {
      return NextResponse.redirect(
        new URL('/og-image.png', request.nextUrl.origin),
        { status: 302 }
      );
    }

    const metadata = await metadataRes.json();
    const imageUri: string = metadata.image;

    if (!imageUri) {
      return NextResponse.redirect(
        new URL('/og-image.png', request.nextUrl.origin),
        { status: 302 }
      );
    }

    // 3. Redirect to the image via a reliable gateway
    const imageUrl = ipfsToHttp(imageUri);

    return NextResponse.redirect(imageUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
      },
    });
  } catch (err) {
    console.error('[api/image] Error fetching token image:', err);
    return NextResponse.redirect(
      new URL('/og-image.png', request.nextUrl.origin),
      { status: 302 }
    );
  }
}
