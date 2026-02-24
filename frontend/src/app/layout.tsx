import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_URL || "https://crusties.xyz";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Crusties — AI Pizza PFPs on Base",
    description:
      "Mint your unique AI-generated pizza PFP based on your Farcaster vibe. 3,333 supply on Base.",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: `${APP_URL}/og-image.png`,
        button: {
          title: "Get Your Slice",
          action: {
            type: "launch_miniapp",
            name: "Crusties",
            url: APP_URL,
            splashImageUrl: `${APP_URL}/logo.png`,
            splashBackgroundColor: "#E85D04",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
