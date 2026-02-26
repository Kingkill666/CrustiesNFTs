/**
 * debug-check.ts
 *
 * Comprehensive health check for the Crusties backend.
 * Run: cd backend && npx tsx scripts/debug-check.ts
 *
 * Checks:
 * 1. Environment variables (all required vars set)
 * 2. Data files (ipfs-uris.json, crusties-metadata.json)
 * 3. Assignment system (can assign an FID)
 * 4. IPFS lookup (can look up a crustie)
 * 5. Signer (can sign a mint permit)
 * 6. Nonce reader (can read nonce from contract)
 * 7. Full generate flow simulation
 * 8. Test HTTP call to running server (if running)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env from backend/ first, then fall back to root .env
config();
config({ path: resolve(process.cwd(), "../.env") });

import { existsSync, readFileSync } from "fs";

const PASS = "✅";
const FAIL = "❌";
const WARN = "⚠️";
let failures = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ${PASS} ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures++;
    console.log(`  ${FAIL} ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function warn(label: string, detail?: string) {
  console.log(`  ${WARN} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("\n🔍 Crusties Backend Debug Check\n");
  console.log("=".repeat(60));

  // ── 1. Environment Variables ────────────────────────────────────────────────
  console.log("\n1️⃣  Environment Variables\n");

  const envVars = {
    CRUSTIES_CONTRACT_ADDRESS: process.env.CRUSTIES_CONTRACT_ADDRESS,
    SIGNER_PRIVATE_KEY: process.env.SIGNER_PRIVATE_KEY,
    SIGNER_ADDRESS: process.env.SIGNER_ADDRESS,
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    PINATA_JWT: process.env.PINATA_JWT,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (key === "SIGNER_PRIVATE_KEY") {
      check(key, !!value, value ? `set (${value.slice(0, 6)}...${value.slice(-4)})` : "NOT SET");
    } else {
      check(key, !!value, value ? `${value.slice(0, 30)}${value.length > 30 ? "..." : ""}` : "NOT SET");
    }
  }

  // Check if SIGNER_PRIVATE_KEY matches SIGNER_ADDRESS
  if (envVars.SIGNER_PRIVATE_KEY) {
    try {
      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(envVars.SIGNER_PRIVATE_KEY as `0x${string}`);
      const derivedAddress = account.address;
      const expectedAddress = envVars.SIGNER_ADDRESS;
      check(
        "SIGNER_PRIVATE_KEY → address matches SIGNER_ADDRESS",
        derivedAddress.toLowerCase() === expectedAddress?.toLowerCase(),
        `derived: ${derivedAddress}, expected: ${expectedAddress}`
      );
    } catch (err) {
      check("SIGNER_PRIVATE_KEY is valid", false, String(err));
    }
  }

  // ── 2. Data Files ──────────────────────────────────────────────────────────
  console.log("\n2️⃣  Data Files\n");

  const ipfsFile = resolve(process.cwd(), "data/ipfs-uris.json");
  const metadataFile = resolve(process.cwd(), "data/crusties-metadata.json");
  const assignmentsFile = resolve(process.cwd(), "data/assignments.json");

  check("ipfs-uris.json exists", existsSync(ipfsFile), ipfsFile);
  check("crusties-metadata.json exists", existsSync(metadataFile), metadataFile);

  if (existsSync(ipfsFile)) {
    try {
      const data = JSON.parse(readFileSync(ipfsFile, "utf-8"));
      const keys = Object.keys(data).filter((k) => k !== "_summary");
      check(`ipfs-uris.json has entries`, keys.length > 0, `${keys.length} entries`);

      // Spot check entry 001
      const sample = data["001"];
      check(
        "Sample entry 001 has metadataUri",
        !!sample?.metadataUri,
        sample?.metadataUri?.slice(0, 40)
      );
      check(
        "Sample entry 001 has imageUri",
        !!sample?.imageUri,
        sample?.imageUri?.slice(0, 40)
      );
    } catch (err) {
      check("ipfs-uris.json is valid JSON", false, String(err));
    }
  }

  if (existsSync(metadataFile)) {
    try {
      const data = JSON.parse(readFileSync(metadataFile, "utf-8"));
      check(
        "crusties-metadata.json has entries",
        Array.isArray(data) && data.length > 0,
        `${data.length} entries`
      );
    } catch (err) {
      check("crusties-metadata.json is valid JSON", false, String(err));
    }
  }

  if (existsSync(assignmentsFile)) {
    try {
      const data = JSON.parse(readFileSync(assignmentsFile, "utf-8"));
      console.log(
        `  ℹ️  assignments.json: ${Object.keys(data.fidToIndex || {}).length} FIDs assigned, ${(data.claimedIndices || []).length} indices claimed`
      );
    } catch {
      warn("assignments.json exists but couldn't be parsed");
    }
  } else {
    console.log("  ℹ️  assignments.json doesn't exist yet (will be created on first request)");
  }

  // ── 3. Assignment System ───────────────────────────────────────────────────
  console.log("\n3️⃣  Assignment System\n");

  try {
    const { getOrAssign, indexToCrustieNumber } = await import("../src/assignment.js");
    const testFid = 999999; // Test FID
    const index = getOrAssign(testFid);
    check("getOrAssign(999999) returns index", index !== null, `index = ${index}`);

    if (index !== null) {
      const crustieNum = indexToCrustieNumber(index);
      check("indexToCrustieNumber works", crustieNum > 0 && crustieNum <= 500 && crustieNum !== 103, `crustie #${crustieNum}`);
    }
  } catch (err) {
    check("Assignment module loads", false, String(err));
  }

  // ── 4. IPFS Lookup ─────────────────────────────────────────────────────────
  console.log("\n4️⃣  IPFS Lookup\n");

  try {
    const { getPrePinnedUri, getCuratedTraits } = await import("../src/ipfs-lookup.js");

    const pinned = getPrePinnedUri(1);
    check("getPrePinnedUri(1) returns data", !!pinned, pinned ? `metadata: ${pinned.metadataUri.slice(0, 30)}...` : "null");

    const traits = getCuratedTraits(1);
    check("getCuratedTraits(1) returns data", !!traits, traits ? `name: ${traits.name}` : "null");
  } catch (err) {
    check("IPFS lookup module loads", false, String(err));
  }

  // ── 5. Signer ──────────────────────────────────────────────────────────────
  console.log("\n5️⃣  EIP-712 Signer\n");

  if (envVars.SIGNER_PRIVATE_KEY && envVars.CRUSTIES_CONTRACT_ADDRESS) {
    try {
      const { signMintPermit } = await import("../src/signer.js");
      const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`;
      const testUri = "ipfs://test123";
      const testNonce = 0n;

      const sig = await signMintPermit(testAddress, testUri, testNonce);
      check(
        "signMintPermit works",
        typeof sig === "string" && sig.startsWith("0x") && sig.length === 132,
        `sig: ${sig.slice(0, 20)}... (length: ${sig.length})`
      );
    } catch (err) {
      check("signMintPermit works", false, String(err));
    }
  } else {
    warn("Skipping signer test — SIGNER_PRIVATE_KEY or CRUSTIES_CONTRACT_ADDRESS not set");
  }

  // ── 6. Nonce Reader ────────────────────────────────────────────────────────
  console.log("\n6️⃣  On-Chain Nonce Reader\n");

  if (envVars.CRUSTIES_CONTRACT_ADDRESS && envVars.BASE_RPC_URL) {
    try {
      const { getNonce } = await import("../src/nonce.js");
      const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`;
      const nonce = await getNonce(testAddress);
      check("getNonce works", typeof nonce === "bigint", `nonce = ${nonce}`);
    } catch (err) {
      check("getNonce works", false, String(err));
    }
  } else {
    warn("Skipping nonce test — CRUSTIES_CONTRACT_ADDRESS or BASE_RPC_URL not set");
  }

  // ── 7. Full Simulation ─────────────────────────────────────────────────────
  console.log("\n7️⃣  Full Generate Simulation (FID=12345)\n");

  try {
    const { getOrAssign, indexToCrustieNumber } = await import("../src/assignment.js");
    const { getPrePinnedUri, getCuratedTraits } = await import("../src/ipfs-lookup.js");

    const fid = 12345;
    const minterAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`;

    const idx = getOrAssign(fid);
    if (idx === null) {
      warn("FID 12345 — sold out");
    } else {
      const num = indexToCrustieNumber(idx);
      const pinned = getPrePinnedUri(num);
      const traits = getCuratedTraits(num);

      console.log(`  Assigned: index=${idx}, crustie=#${num}`);
      console.log(`  IPFS: ${pinned ? pinned.metadataUri : "NOT FOUND"}`);
      console.log(`  Traits: ${traits ? traits.name : "NOT FOUND"}`);

      if (pinned && envVars.SIGNER_PRIVATE_KEY) {
        const { getNonce } = await import("../src/nonce.js");
        const { signMintPermit } = await import("../src/signer.js");

        const nonce = await getNonce(minterAddr);
        const sig = await signMintPermit(minterAddr, pinned.metadataUri, nonce);

        console.log(`  Nonce: ${nonce}`);
        console.log(`  Signature: ${sig.slice(0, 30)}...`);
        check("Full simulation passed", true);
      } else if (!pinned) {
        check("Full simulation — IPFS data found", false);
      } else {
        warn("Full simulation — skipped signing (no SIGNER_PRIVATE_KEY)");
      }
    }
  } catch (err) {
    check("Full simulation", false, String(err));
  }

  // ── 8. Test HTTP (if server is running) ────────────────────────────────────
  console.log("\n8️⃣  HTTP Test (localhost:3001)\n");

  try {
    const healthRes = await fetch("http://localhost:3001/health", { signal: AbortSignal.timeout(3000) });
    check("Health endpoint", healthRes.ok, `status: ${healthRes.status}`);

    const genRes = await fetch("http://localhost:3001/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid: 12345, minterAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" }),
      signal: AbortSignal.timeout(10000),
    });
    const genBody = await genRes.text();
    check("POST /api/generate", genRes.ok, `status: ${genRes.status}`);
    if (!genRes.ok) {
      console.log(`  Response body: ${genBody.slice(0, 200)}`);
    } else {
      const parsed = JSON.parse(genBody);
      console.log(`  ipfsUri: ${parsed.ipfsUri?.slice(0, 40)}`);
      console.log(`  hasSignature: ${!!parsed.signature}`);
      console.log(`  crustieIndex: ${parsed.crustieIndex}`);
    }
  } catch (err) {
    warn("Server not running on localhost:3001 — start with: npm run dev");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  if (failures === 0) {
    console.log(`\n${PASS} All checks passed!\n`);
  } else {
    console.log(`\n${FAIL} ${failures} check(s) failed. Fix the issues above.\n`);
  }
}

main().catch((err) => {
  console.error("Debug check crashed:", err);
  process.exit(1);
});
