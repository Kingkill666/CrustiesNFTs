export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://crusties.xyz";

  return Response.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "Crusties",
      homeUrl: URL,
      iconUrl: `${URL}/icon.png`,
      splashImageUrl: `${URL}/splash.png`,
      splashBackgroundColor: "#E85D04",
      webhookUrl: `${URL}/api/webhook`,
      subtitle: "AI Pizza PFPs on Base",
      description:
        "Mint a unique AI-generated pizza PFP based on your Farcaster vibe. 3,333 supply on Base. Pay with ETH or USDC.",
      screenshotUrls: [
        `${URL}/screenshots/mint.png`,
        `${URL}/screenshots/preview.png`,
        `${URL}/screenshots/collection.png`,
      ],
      primaryCategory: "social",
      tags: ["nft", "pizza", "pfp", "base", "ai"],
      heroImageUrl: `${URL}/og.png`,
      tagline: "Your vibe, baked into a pizza",
      ogTitle: "Crusties — AI Pizza PFPs on Base",
      ogDescription:
        "Mint a unique AI-generated pizza PFP based on your Farcaster vibe.",
      ogImageUrl: `${URL}/og.png`,
      noindex: false,
    },
  });
}
