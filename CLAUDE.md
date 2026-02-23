# CLAUDE.md — Crusties Project Context

> This file provides context for AI assistants (Claude, Cursor, Copilot, etc.) working on the Crusties codebase.

---

## CRITICAL SECURITY RULES

1. **NEVER commit `.env` files, private keys, API keys, or secrets to git.** The `.gitignore` must always include `.env`, `.env.local`, `.env.production`, `*.pem`, and `*.key`.
2. **NEVER include private keys or mnemonics in source code, scripts, or commit messages.**
3. **Always use environment variables** for sensitive values (RPC URLs with keys, API keys, deployer private keys, etc.).
4. **Before any git commit**, verify that no secrets are being staged. If a `.env` file or key file is in the staging area, **refuse to commit** and warn the user.

---

## Project Summary

**Crusties** is an AI-generated pizza NFT (PFP) collection on **Base**. Users connect via Farcaster, our backend analyzes their on-chain + social identity, generates a unique pizza avatar, pins it to IPFS, and the user mints it on-chain. Supply is capped at 3,333. Payment accepted in Base ETH or $PIZZA token.

---

## Critical Addresses & Constants

```
Network:              Base Mainnet (Chain ID 8453)
$PIZZA Token:         0xa821f2ee19f4f62e404c934d43eb6e5763fbdb07
Max Supply:           3,333
Max Mints Per Wallet: 3
Royalty:              2.5% (250 basis points, ERC-2981)
Token Name:           Crusties
Token Symbol:         CRUSTIES
```

---

## Reference Contract (DO NOT MODIFY — for reference only)

The smart contract pattern is taken directly from PizzaFriends on Base:
- **Address:** `0xfbEdf9D11B552c5272AaFb1ec63973CA823Bd2Ff`
- **BaseScan:** https://basescan.org/address/0xfbEdf9D11B552c5272AaFb1ec63973CA823Bd2Ff#code
- **Contract Name:** PizzaFriendsNFT
- **Compiler:** Solidity 0.8.31, Optimizer 200 runs

### What we replicate from PizzaFriends:
- ERC-721 + ERC721URIStorage + ERC721Royalty + Ownable pattern
- Dual mint functions: `mintWithETH(tokenURI)` and `mintWithToken(tokenURI, amount)`
- Per-wallet mint cap with `mintCount` mapping
- Treasury forwarding for both ETH and token payments
- `canMint()`, `remainingMintsForWallet()`, `remainingSupply()` view functions
- Owner admin functions for price, cap, treasury, and royalty adjustments

### What we change:
- Token name: "PizzaFriends" → "Crusties", symbol: "PIZZAFRIENDS" → "CRUSTIES"
- Payment token: PizzaFriends' token → $PIZZA (`0xa821f2ee19f4f62e404c934d43eb6e5763fbdb07`)
- All metadata, traits, and imagery are pizza-themed
- Constructor parameters will use $PIZZA address and our treasury

---

## PizzaFriends Contract Source (Exact Copy for Reference)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PizzaFriendsNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 public totalMinted;
    uint256 public maxSupply = 3333;
    uint256 public maxMintsPerWallet = 3;
    uint256 public minEthPrice;
    uint256 public minTokenPrice;

    IERC20 public paymentToken;
    address public treasury;

    mapping(address => uint256) public mintCount;

    event Minted(address indexed to, uint256 indexed tokenId, string paymentType);

    constructor(
        address _paymentToken,
        address _treasury,
        uint256 _minEthPrice,
        uint256 _minTokenPrice
    ) ERC721("PizzaFriends", "PIZZAFRIENDS") Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        minEthPrice = _minEthPrice;
        minTokenPrice = _minTokenPrice;
        _setDefaultRoyalty(_treasury, 250);
    }

    function mintWithETH(string calldata _tokenURI) external payable returns (uint256) {
        require(msg.value >= minEthPrice, "Below min ETH price");
        require(canMint(msg.sender), "Cannot mint");
        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;
        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "ETH transfer failed");
        emit Minted(msg.sender, tokenId, "eth");
        return tokenId;
    }

    function mintWithToken(string calldata _tokenURI, uint256 tokenAmount) external returns (uint256) {
        require(tokenAmount >= minTokenPrice, "Below min token price");
        require(canMint(msg.sender), "Cannot mint");
        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;
        require(paymentToken.transferFrom(msg.sender, treasury, tokenAmount), "Token transfer failed");
        emit Minted(msg.sender, tokenId, "token");
        return tokenId;
    }

    function canMint(address wallet) public view returns (bool) {
        return mintCount[wallet] < maxMintsPerWallet && totalMinted < maxSupply;
    }

    function remainingMintsForWallet(address wallet) external view returns (uint256) {
        if (mintCount[wallet] >= maxMintsPerWallet) return 0;
        return maxMintsPerWallet - mintCount[wallet];
    }

    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalMinted;
    }

    function setMinEthPrice(uint256 _price) external onlyOwner { minEthPrice = _price; }
    function setMinTokenPrice(uint256 _price) external onlyOwner { minTokenPrice = _price; }
    function setMaxMintsPerWallet(uint256 _max) external onlyOwner { maxMintsPerWallet = _max; }
    function setTreasury(address _treasury) external onlyOwner { treasury = _treasury; }
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721) {
        super._increaseBalance(account, value);
    }
}
```

---

## Smart Contract Rules

When writing or modifying the CrustiesNFT contract:

1. **Follow the PizzaFriends pattern exactly** — same inheritance chain, same function signatures, same access control pattern. Only change naming and the payment token address.
2. **OpenZeppelin v5.x** — Use `@openzeppelin/contracts` v5. The constructor pattern is `Ownable(msg.sender)`, not the v4 pattern.
3. **Compiler:** Solidity `^0.8.24` (required by OZ v5.5), compiled with solc 0.8.31, optimizer 200 runs.
4. **Token URI is passed at mint time** — The contract does NOT generate metadata. The backend generates the image, pins to IPFS, constructs the metadata JSON, pins that to IPFS, and passes the IPFS URI as `_tokenURI` to the mint function.
5. **Dual payment:** `mintWithETH` accepts ETH (forwarded to treasury via low-level call), `mintWithToken` accepts $PIZZA (transferred via `transferFrom` — user must `approve` first).
6. **No whitelist/allowlist** — Anyone can mint, up to `maxMintsPerWallet` limit.
7. **Royalties:** 2.5% default via ERC-2981. Receiver is the treasury.

---

## Backend Architecture Rules

When building the backend API:

1. **Framework:** Use TypeScript with Express or Hono. Keep it simple.
2. **API Endpoint:** `POST /api/generate` accepts `{ fid: number }` (Farcaster ID), returns `{ ipfsUri: string, imageUrl: string, traits: object }`.
3. **Farcaster Data:** Use the Neynar API to fetch user profile, casts, engagement stats, and social graph.
4. **On-Chain Data:** Use Viem to read Base chain data — wallet age, tx count, token balances, NFT holdings, DeFi interactions.
5. **Personality Engine:** Maps data points to pizza trait selections. Output is a deterministic trait object like `{ crust: "deep_dish", cheese: "extra_melty", topping: "pepperoni", eyes: "sleepy", ... }`.
6. **AI Generation:** Use Replicate (Stable Diffusion), OpenAI (DALL·E), or a custom model. The prompt should incorporate the trait selections AND reference the base Crustie art style.
7. **IPFS Pinning:** Use Pinata SDK or nft.storage. Pin the image first, get the CID, then construct metadata JSON with `image: "ipfs://<CID>"` and pin the metadata. Return the metadata IPFS URI.
8. **Caching:** Cache generated images by FID to avoid re-generation. A user's Crusties should be deterministic (same input → same output) unless they explicitly request a re-roll.

---

## Farcaster Mini App

Crusties is distributed as a **Farcaster Mini App**—a web app that runs inside Farcaster clients (e.g. Warpcast). Users discover Crusties in feeds, open it in-app, and mint without leaving Farcaster.

### Manifest

The app manifest lives at `/.well-known/farcaster.json` on your domain. It identifies the app, verifies domain ownership to your Farcaster account, and configures discovery, splash screen, and notifications.

**Location:** `public/.well-known/farcaster.json`

**Required before launch:**
1. **Sign the manifest** — Use either:
   - [Farcaster Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest) for Warpcast/Farcaster clients
   - [Base Build Account association](https://www.base.dev/preview?tab=account) for Base app (produces a longer signature)
   Replace the placeholder `accountAssociation` values in the manifest.
2. **Update domain** — Replace `crusties.xyz` with your actual domain in all URLs.
3. **Add assets** — Ensure `icon.png`, `logo.png`, `og-image.png` exist and are accessible (icon: 200x200px, og-image: 3:2 aspect ratio).

**Next.js route alternative:** Instead of a static file, you can serve the manifest via `app/.well-known/farcaster.json/route.ts` returning `Response.json(manifest)`.

### Embed Metadata (fc:miniapp)

Each shareable page needs an `fc:miniapp` meta tag for rich cards in feeds:

```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://crusties.xyz/og-image.png","button":{"title":"🍕 Get Your Slice","action":{"type":"launch_frame","name":"Crusties","url":"https://crusties.xyz","splashImageUrl":"https://crusties.xyz/logo.png","splashBackgroundColor":"#e85d04"}}}' />
```

For Next.js, use `generateMetadata` and add to `other`:

```ts
other: {
  "fc:miniapp": JSON.stringify({
    version: "1",
    imageUrl: "https://crusties.xyz/og-image.png",
    button: {
      title: "🍕 Get Your Slice",
      action: {
        type: "launch_frame",
        name: "Crusties",
        url: "https://crusties.xyz",
        splashImageUrl: "https://crusties.xyz/logo.png",
        splashBackgroundColor: "#e85d04"
      }
    }
  })
}
```

### SDK Integration

1. **Install:** `npm install @farcaster/miniapp-sdk`
2. **Call `ready()`** — After your app loads, call `await sdk.actions.ready()` to hide the splash screen. **Required** or users see infinite loading.
3. **Auth:** Use Quick Auth (`sdk.quickAuth.getToken()`) or `sdk.actions.signIn()` for Farcaster identity.
4. **Wallet:** Use `@farcaster/miniapp-wagmi-connector` with Wagmi for Base/EVM—no wallet picker needed, Farcaster client provides the wallet.

### SDK Context (`sdk.context`)

When your app opens, `sdk.context` provides session info. [Full reference](https://miniapps.farcaster.xyz/docs/sdk/context).

| Property | Description |
|----------|-------------|
| **`user`** | `fid`, `username`, `displayName`, `pfpUrl` — **untrusted**, passed in by the host |
| **`location`** | How the app was launched (see below) |
| **`client`** | `platformType` (web/mobile), `clientFid`, `added`, `safeAreaInsets`, `notificationDetails` — **untrusted** |
| **`features`** | `haptics`, `cameraAndMicrophoneAccess` |

**Location types:**
- `cast_embed` — Launched from a cast where your app is an embed
- `cast_share` — User shared a cast to your app (share extension)
- `notification` — Launched from a notification
- `launcher` — Opened from app catalog/launcher
- `channel` — Opened from a channel (key, name, imageUrl)
- `open_miniapp` — Opened from another Mini App (`referrerDomain` for attribution)

**Crusties usage:**
- Use `sdk.context.user.fid` for the personality engine and backend generate flow.
- Branch on `sdk.context.location` (e.g. `cast_share` vs `launcher`) for different flows.
- Apply `sdk.context.client.safeAreaInsets` for mobile-safe layout.
- Check `sdk.context.client.added` before prompting `addMiniApp()`.

### Pizza-Themed Copy (Puns Welcome)

- Button: "🍕 Get Your Slice" / "🍕 Bake Your Crustie" / "🍕 Let's Get This Pizza Started"
- Tagline: "That's amore! Your vibe, your Crustie."
- Success: "You're officially a slice of the collection!"
- Errors: "That crust crumbled—try again?"
- Loading: "Baking your Crustie..."

### Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz)
- [Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
- [Preview Tool](https://farcaster.xyz/~/developers/mini-apps/preview)
- [@farcaster/miniapp-sdk](https://github.com/farcasterxyz/miniapps)
- [Base Docs (llms.txt)](https://docs.base.org/llms.txt) — Full Base documentation index

---

## Base Build Migration (Migrate to Base App)

Crusties is distributed on **Base** as an NFT. To publish Crusties as a Mini App inside the **Base app**, follow the Base Build migration flow.

### Prerequisites

- Existing web app (Crusties frontend)
- Base app account

### Migration Steps

1. **Add the Mini App SDK**

   ```bash
   npm install @farcaster/miniapp-sdk
   ```

2. **Trigger App Display**

   Call `sdk.actions.ready()` to hide the splash screen and display your app. In React, call inside `useEffect`:

   ```tsx
   import { sdk } from '@farcaster/miniapp-sdk';
   import { useEffect } from 'react';

   function App() {
     useEffect(() => {
       sdk.actions.ready();
     }, []);
     return (/* your app content */);
   }
   ```

3. **Host the Manifest**

   - **Static:** Create `public/.well-known/farcaster.json` (Next.js serves from `public/`).
   - **Next.js route:** Create `app/.well-known/farcaster.json/route.ts` that returns the manifest JSON.

4. **Update the Manifest**

   Use the manifest at `public/.well-known/farcaster.json`. Ensure all `miniapp` fields are filled in (name, homeUrl, iconUrl, splashImageUrl, etc.). See [Farcaster manifest field reference](https://miniapps.farcaster.xyz/docs/specification#manifest).

5. **Create accountAssociation Credentials**

   Base Build uses its own verification flow:

   1. Deploy so the manifest is live at `https://your-domain.com/.well-known/farcaster.json`.
   2. Go to [Base Build Account association tool](https://www.base.dev/preview?tab=account).
   3. Enter your domain and click "Submit".
   4. Click "Verify" and follow the instructions to generate `accountAssociation` fields.
   5. Copy `header`, `payload`, and `signature` into your manifest.

   > **Note:** Signing with your Base Account produces a longer `signature` than signing with a Farcaster custody wallet.

6. **Add Embed Metadata**

   Add `fc:miniapp` meta tag for rich embeds when shared. For Next.js:

   ```ts
   export async function generateMetadata(): Promise<Metadata> {
     return {
       other: {
         'fc:miniapp': JSON.stringify({
           version: '1',
           imageUrl: 'https://crusties.xyz/og-image.png',
           button: {
             title: '🍕 Get Your Slice',
             action: {
               type: 'launch_miniapp',
               name: 'Crusties',
               url: 'https://crusties.xyz',
               splashImageUrl: 'https://crusties.xyz/logo.png',
               splashBackgroundColor: '#e85d04',
             },
           },
         }),
       },
     };
   }
   ```

7. **Push to Production**

   Ensure all changes are live.

8. **Preview Your App**

   Use the [Base Build Preview tool](https://www.base.dev/preview):

   - Add your app URL to view embeds and test the launch button.
   - Use the "Account association" tab to verify credentials.
   - Use the "Metadata" tab to check manifest fields.

9. **Post to Publish**

   To publish on the Base app, create a post in the Base app with your app's URL.

### Base Build Links

- [Base Build Preview](https://www.base.dev/preview)
- [Base Build Account association](https://www.base.dev/preview?tab=account)
- [Base Docs (llms.txt)](https://docs.base.org/llms.txt)

---

## Frontend Rules

When building the frontend:

1. **Framework:** Next.js (App Router) with TailwindCSS.
2. **Wallet:** Wagmi v2 + Viem + `@farcaster/miniapp-wagmi-connector`. Configure for Base chain only. No wallet picker—Farcaster client provides the wallet in Mini App context.
3. **Farcaster Integration:** Must work as a Farcaster Mini App. Use `@farcaster/miniapp-sdk`—call `sdk.actions.ready()` on load, use Quick Auth or signIn for identity.
4. **Mint Flow:**
   - User connects wallet + Farcaster identity
   - Frontend calls backend to generate pizza → shows preview
   - User selects payment method (ETH or $PIZZA)
   - If $PIZZA: call `approve()` on $PIZZA contract first, then `mintWithToken()`
   - If ETH: call `mintWithETH()` with value
   - Show success state with NFT image + link to BaseScan tx
5. **Contract Interaction:** Use Wagmi `useWriteContract` / `useReadContract` hooks. Keep the ABI in `lib/contract.ts`.

---

## Trait System

### Base Traits (Artist-Provided Assets)

The project creator provides base artwork files for these trait categories. These are the foundational layers:

- **Outline** — The main pizza silhouette/body shape
- **Crust** — Multiple crust style variations (thin, thick, stuffed, deep dish, cauliflower)
- **Cheese** — Cheese coverage and melt patterns
- **Eyes** — Different eye styles for the pizza face
- **Nose** — Nose shape variations
- **Mouth** — Expression variations (optional, may be AI-generated)

### AI-Generated / Dynamic Traits

These traits are selected by the personality engine and either composed from assets or AI-generated:

- **Toppings** — Selected based on user interests (e.g., pepperoni for sports fans, mushrooms for art lovers, pineapple for contrarians)
- **Sauce** — Classic red, white/alfredo, pesto, BBQ, hot honey
- **Background** — Color/pattern based on token holdings
- **Accessories** — Hats, glasses, chains, etc. based on on-chain activity
- **Vibe Tag** — Text attribute: "DeFi Degen", "NFT Collector", "Governance Gigachad", "Lurker", "Shitposter Supreme", etc.
- **Rarity Score** — Numeric score based on trait combination rarity

---

## File Naming Conventions

```
Contracts:     PascalCase.sol          (CrustiesNFT.sol)
TypeScript:    camelCase.ts            (personality.ts, ipfsPin.ts)
Components:    PascalCase.tsx          (MintButton.tsx, PizzaPreview.tsx)
Hooks:         useCamelCase.ts         (useCrusties.ts)
Constants:     SCREAMING_SNAKE_CASE    (MAX_SUPPLY, PIZZA_TOKEN_ADDRESS)
Env vars:      SCREAMING_SNAKE_CASE    (PINATA_API_KEY, BASE_RPC_URL)
```

---

## Testing Guidelines

### Smart Contract Tests (Foundry)

- Test both `mintWithETH` and `mintWithToken` happy paths
- Test mint cap enforcement (per-wallet and total supply)
- Test payment forwarding to treasury
- Test that `tokenURI` returns correctly after mint
- Test all `onlyOwner` admin functions
- Test edge cases: minting at supply cap, zero-value payments, unauthorized access
- Use a mock ERC-20 token for $PIZZA in tests

### Backend Tests (Vitest)

- Unit test personality engine with known input → expected trait output
- Unit test metadata JSON construction
- Integration test the full generate flow with mocked external APIs
- Test IPFS pinning with mock/stub

---

## Deployment Checklist

- [ ] Sign manifest: use [Farcaster Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest) or [Base Build Account association](https://www.base.dev/preview?tab=account), then update `accountAssociation` in `public/.well-known/farcaster.json`
- [ ] Deploy CrustiesNFT to Base Sepolia with test parameters
- [ ] Verify contract on BaseScan (Sepolia)
- [ ] Test mint with ETH on testnet
- [ ] Test mint with mock $PIZZA on testnet
- [ ] Deploy backend to staging
- [ ] Test full flow: generate → pin → mint on testnet
- [ ] Deploy CrustiesNFT to Base Mainnet
- [ ] Verify contract on BaseScan (Mainnet)
- [ ] Set production mint prices
- [ ] Deploy backend to production
- [ ] Deploy frontend to Vercel
- [ ] Test mainnet flow end-to-end
- [ ] Launch

---

## Common Pitfalls

1. **$PIZZA approval before mint** — Users MUST call `approve(crustiesContractAddress, amount)` on the $PIZZA token contract before calling `mintWithToken`. The frontend must handle this two-step flow.
2. **IPFS URI format** — Use `ipfs://Qm...` format (not gateway URLs) for the token URI stored on-chain. Frontends/marketplaces resolve this to their preferred gateway.
3. **Gas estimation** — `mintWithToken` uses more gas than `mintWithETH` because of the ERC-20 `transferFrom`. Account for this in frontend gas estimates.
4. **Deterministic generation** — The same FID should produce the same Crusties (unless re-roll is explicitly requested). Use a seeded random approach tied to FID + block data.
5. **Rate limiting** — AI generation is expensive. Rate limit the `/api/generate` endpoint per FID and per IP.
6. **Image size** — Keep generated PFP images reasonable (1024x1024 or 2048x2048 max). Larger images = higher IPFS pinning costs and slower loading.

---

## Key Dependencies

```json
{
  "contracts": {
    "@openzeppelin/contracts": "^5.0.0"
  },
  "backend": {
    "express": "^4.18 or hono ^4.0",
    "viem": "^2.0",
    "@neynar/nodejs-sdk": "latest",
    "pinata-web3": "latest",
    "replicate": "latest"
  },
  "frontend": {
    "next": "^14",
    "wagmi": "^2.0",
    "viem": "^2.0",
    "@farcaster/miniapp-sdk": "latest",
    "@farcaster/miniapp-wagmi-connector": "latest",
    "@rainbow-me/rainbowkit": "^2.0",
    "tailwindcss": "^3.4"
  }
}
```

---

## Quick Reference Commands

```bash
# Compile contracts
forge build

# Run contract tests
forge test -vvv

# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify

# Start backend dev server
cd backend && npm run dev

# Start frontend dev server
cd frontend && npm run dev

# Verify manifest is served (replace with your domain)
curl -s https://crusties.xyz/.well-known/farcaster.json | jq .

# Base Build: Preview app at https://www.base.dev/preview
# Base Build: Account association at https://www.base.dev/preview?tab=account

# Pin a file to IPFS (manual test)
curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "Authorization: Bearer $PINATA_JWT" \
  -F file=@./test-pizza.png
```
