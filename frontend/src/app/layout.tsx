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
        version: "next",
        imageUrl: `${APP_URL}/og.png`,
        button: {
          title: "Mint Your Crusties",
          action: {
            type: "launch_miniapp",
            name: "Crusties",
            url: APP_URL,
            splashImageUrl: `${APP_URL}/splash.png`,
            splashBackgroundColor: "#1A1A1A",
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
      <body className="min-h-screen bg-pizza-dark">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
