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
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://crusties-vmf-coin.vercel.app";

  const manifestImages = {
    logo: "https://i.postimg.cc/vZZnPyVt/app_logo.png",
    splash: "https://i.postimg.cc/15kxDKNz/app_splash.png",
    hero: "https://i.postimg.cc/pV1MLvW5/app_hero.png",
    og: "https://i.postimg.cc/pV1MLvW5/app_hero.png",
  };

  return Response.json({
    accountAssociation: {
      header: "eyJmaWQiOjEwMTM0OTEsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgyNTdDYmU4OTk2ODQ5NUMzYUU4QzgxQmNjQjhCRTdmMjU3Q0Q1ZjY2In0",
      payload: "eyJkb21haW4iOiJjcnVzdGllcy12bWYtY29pbi52ZXJjZWwuYXBwIn0",
      signature: "5hwsxrwbteaW531ZhZACYEf+KyNWFhmAFWefUXIb2/cpUKpr3+yUIpXVTSM6s/ZYD0qJDxFV/lDc+GWZt2ALehs=",
    },
    miniapp: {
      version: "1",
      name: "Crusties",
      iconUrl: manifestImages.logo,
      homeUrl: "https://crusties-vmf-coin.vercel.app/",
      imageUrl: manifestImages.hero,
      buttonTitle: "Get Your Crustie Now",
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
      castShareUrl: "https://crusties-vmf-coin.vercel.app/",
      // Base App required fields
      canonicalDomain: "crusties-vmf-coin.vercel.app",
      requiredChains: ["eip155:8453"],
    },
  });
}
