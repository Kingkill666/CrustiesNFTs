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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userData = await userRes.json() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = userData.users?.[0] as any;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const castsData = await castsRes.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentCasts = (castsData.casts || []).map((cast: any) => ({
      text: cast.text as string,
      timestamp: cast.timestamp as string,
      likes: (cast.reactions?.likes || []).length as number,
      recasts: (cast.reactions?.recasts || []).length as number,
      replies: (cast.replies?.count || 0) as number,
    }));
  }

  const verifiedAddresses: string[] =
    user.verified_addresses?.eth_addresses || [];

  return {
    fid: user.fid as number,
    username: user.username as string,
    displayName: user.display_name as string,
    bio: (user.profile?.bio?.text || "") as string,
    followerCount: (user.follower_count || 0) as number,
    followingCount: (user.following_count || 0) as number,
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
