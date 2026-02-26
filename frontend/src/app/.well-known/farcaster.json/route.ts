/**
 * Farcaster + Base App Mini App Manifest
 *
 * Same manifest works for both platforms. Both read from /.well-known/farcaster.json
 *
 * Farcaster: Sign via https://farcaster.xyz/~/developers/mini-apps/manifest
 * Base App:  Sign via https://www.base.dev/preview?tab=account
 *
 * Set NEXT_PUBLIC_URL (e.g. https://crusties.xyz) when deployed to populate
 * iconUrl, homeUrl, splashImageUrl, etc. Base App requires these for validation.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "";
  const canonicalDomain = baseUrl
    ? new URL(baseUrl).hostname
    : "";

  const manifestImages = {
    logo: "https://i.postimg.cc/6phXwvyB/crustie-logo.png",
    splash: "https://i.postimg.cc/15kxDKNz/app_splash.png",
    hero: "https://i.postimg.cc/pV1MLvW5/app_hero.png",
    og: "https://i.postimg.cc/pV1MLvW5/app_hero.png",
  };

  return Response.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "Crusties",
      iconUrl: manifestImages.logo,
      homeUrl: baseUrl,
      imageUrl: manifestImages.hero,
      buttonTitle: baseUrl ? "🍕 Get Your Slice" : "",
      splashImageUrl: manifestImages.splash,
      splashBackgroundColor: "#E63946",
      webhookUrl: "https://api.neynar.com/f/app/591d8b55-2775-4b41-80d0-888f8d18f578/event",
      subtitle: "Pizza NFTs on Base",
      description:
        "Crusties are 500 unique pizza slice NFTs on Base. Connect your Farcaster identity and get a unique pizza character minted to your wallet. Your vibe, baked in.",
      screenshotUrls: [],
      primaryCategory: "social",
      tags: ["nft", "pizza", "farcaster", "base"],
      heroImageUrl: manifestImages.hero,
      tagline: "Your vibe, baked in.",
      ogTitle: "Crusties",
      ogDescription: "Unique pizza NFTs on Base",
      ogImageUrl: manifestImages.og,
      castShareUrl: "",
      // Base App required fields
      canonicalDomain,
      requiredChains: ["eip155:8453"],
    },
  });
}
