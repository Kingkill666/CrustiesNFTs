export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
  castCount: number;
  recastCount: number;
  likeCount: number;
  recentCasts: CastData[];
}

export interface CastData {
  text: string;
  timestamp: string;
  likes: number;
  recasts: number;
  replies: number;
}

const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";

export async function fetchFarcasterUser(fid: number): Promise<FarcasterUser> {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    throw new Error("NEYNAR_API_KEY is not set");
  }

  const headers = { accept: "application/json", api_key: apiKey };

  // Fetch user profile
  const userRes = await fetch(`${NEYNAR_API_URL}/user/bulk?fids=${fid}`, {
    headers,
  });

  if (!userRes.ok) {
    throw new Error(`Neynar user fetch failed: ${userRes.status}`);
  }

  const userData = await userRes.json();
  const user = userData.users?.[0];

  if (!user) {
    throw new Error(`User with FID ${fid} not found`);
  }

  // Fetch recent casts
  const castsRes = await fetch(
    `${NEYNAR_API_URL}/feed/user/${fid}/casts?limit=50`,
    { headers }
  );

  let recentCasts: CastData[] = [];
  if (castsRes.ok) {
    const castsData = await castsRes.json();
    recentCasts = (castsData.casts || []).map(
      (cast: Record<string, unknown>) => ({
        text: cast.text as string,
        timestamp: cast.timestamp as string,
        likes: ((cast.reactions as Record<string, unknown[]>)?.likes || [])
          .length,
        recasts: (
          (cast.reactions as Record<string, unknown[]>)?.recasts || []
        ).length,
        replies: (cast.replies as Record<string, number>)?.count || 0,
      })
    );
  }

  const verifiedAddresses: string[] =
    user.verified_addresses?.eth_addresses || [];

  return {
    fid: user.fid,
    username: user.username,
    displayName: user.display_name,
    bio: user.profile?.bio?.text || "",
    followerCount: user.follower_count || 0,
    followingCount: user.following_count || 0,
    verifiedAddresses,
    castCount: recentCasts.length,
    recastCount: recentCasts.reduce(
      (sum: number, c: CastData) => sum + c.recasts,
      0
    ),
    likeCount: recentCasts.reduce(
      (sum: number, c: CastData) => sum + c.likes,
      0
    ),
    recentCasts,
  };
}
