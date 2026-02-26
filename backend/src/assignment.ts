/**
 * assignment.ts
 *
 * Manages the one-to-one mapping of Farcaster FID → crustie image index.
 * Each FID gets exactly one crustie NFT image (crustie-000 through crustie-500).
 * No two FIDs receive the same crustie image.
 *
 * Assignment is deterministic based on FID but also respects the "already claimed"
 * set — if the computed index is taken, we walk forward to find the next available one.
 *
 * Persistence: stored in a JSON file on disk so assignments survive server restarts.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const TOTAL_CRUSTIES = 501; // crustie-000 through crustie-500

// Path to the assignments file.
// ASSIGNMENTS_FILE env var lets you override in production.
// Default: <repo-root>/backend/data/assignments.json
const ASSIGNMENTS_FILE =
  process.env.ASSIGNMENTS_FILE ||
  resolve(process.cwd(), "data/assignments.json");

interface AssignmentStore {
  // FID (as string key) → crustie index (0-500)
  fidToIndex: Record<string, number>;
  // Set of claimed indices — stored as array for JSON serialization
  claimedIndices: number[];
}

function loadStore(): AssignmentStore {
  if (!existsSync(ASSIGNMENTS_FILE)) {
    return { fidToIndex: {}, claimedIndices: [] };
  }
  try {
    const raw = readFileSync(ASSIGNMENTS_FILE, "utf-8");
    return JSON.parse(raw) as AssignmentStore;
  } catch {
    console.warn("Could not read assignments file, starting fresh.");
    return { fidToIndex: {}, claimedIndices: [] };
  }
}

function saveStore(store: AssignmentStore): void {
  try {
    mkdirSync(dirname(ASSIGNMENTS_FILE), { recursive: true });
    writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save assignments:", err);
  }
}

/**
 * Simple seeded LCG random, same as personality.ts.
 * Produces a deterministic starting index for a given FID.
 */
function fidToStartIndex(fid: number): number {
  let s = fid * 7919 + 42;
  s = (s * 16807 + 0) % 2147483647;
  return Math.abs(s % TOTAL_CRUSTIES);
}

/**
 * Get (or create) the crustie index assigned to a FID.
 * - If FID already has an assignment, returns it immediately.
 * - Otherwise, finds the next available index starting from the FID-derived seed.
 * - Returns null if all 501 crusties have been assigned.
 */
export function getOrAssign(fid: number): number | null {
  const store = loadStore();

  // Already assigned
  const existing = store.fidToIndex[String(fid)];
  if (existing !== undefined) {
    return existing;
  }

  // All crusties claimed
  if (store.claimedIndices.length >= TOTAL_CRUSTIES) {
    return null;
  }

  const claimedSet = new Set(store.claimedIndices);
  const startIndex = fidToStartIndex(fid);

  // Walk forward from the seed index to find the first unclaimed slot
  for (let offset = 0; offset < TOTAL_CRUSTIES; offset++) {
    const candidate = (startIndex + offset) % TOTAL_CRUSTIES;
    if (!claimedSet.has(candidate)) {
      // Claim it
      store.fidToIndex[String(fid)] = candidate;
      store.claimedIndices.push(candidate);
      saveStore(store);
      return candidate;
    }
  }

  return null;
}

/**
 * How many crusties have been assigned so far.
 */
export function assignedCount(): number {
  const store = loadStore();
  return store.claimedIndices.length;
}

/**
 * Returns the crustie index for a FID if already assigned, or null if not yet assigned.
 * Does NOT create a new assignment.
 */
export function getAssignment(fid: number): number | null {
  const store = loadStore();
  const idx = store.fidToIndex[String(fid)];
  return idx !== undefined ? idx : null;
}
