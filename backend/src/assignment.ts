/**
 * assignment.ts
 *
 * Manages the mapping of Farcaster FID → crustie image indices.
 * Each FID can be assigned multiple crusties (one per mint, up to maxMintsPerWallet).
 * No two mints ever receive the same crustie image.
 *
 * Assignment is deterministic based on FID but also respects the "already claimed"
 * set — if the computed index is taken, we walk forward to find the next available one.
 *
 * Persistence: stored in a JSON file on disk so assignments survive server restarts.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { CuratedCrustieEntry } from "./metadata-curated.js";

const TOTAL_CRUSTIES = 499; // indices 0-498 (499 crusties — no crustie-103)

// Valid crustie numbers: 1-102, 104-500 (103 has no image)
const VALID_CRUSTIE_NUMBERS: number[] = [];
for (let i = 1; i <= 500; i++) {
  if (i !== 103) VALID_CRUSTIE_NUMBERS.push(i);
}

/**
 * Convert a 0-based assignment index to a crustie number (1-indexed, skipping 103).
 * Index 0 → 1, Index 101 → 102, Index 102 → 104, ..., Index 498 → 500
 */
export function indexToCrustieNumber(index: number): number {
  return VALID_CRUSTIE_NUMBERS[index];
}

// Path to the assignments file.
// ASSIGNMENTS_FILE env var lets you override in production.
// Default: <repo-root>/backend/data/assignments.json
const ASSIGNMENTS_FILE =
  process.env.ASSIGNMENTS_FILE ||
  resolve(process.cwd(), "data/assignments.json");

interface AssignmentStore {
  // FID (as string key) → array of crustie indices (one per mint slot)
  // Legacy compat: may also be a single number from old format
  fidToIndex: Record<string, number | number[]>;
  // Set of claimed indices — stored as array for JSON serialization
  claimedIndices: number[];
}

/** Normalize a store entry to always return an array. */
function getIndicesForFid(store: AssignmentStore, fid: number): number[] {
  const val = store.fidToIndex[String(fid)];
  if (val === undefined) return [];
  if (Array.isArray(val)) return val;
  // Legacy single-number format — migrate to array
  return [val];
}

/** Set the indices array for an FID. */
function setIndicesForFid(store: AssignmentStore, fid: number, indices: number[]): void {
  store.fidToIndex[String(fid)] = indices;
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
function fidToStartIndex(fid: number, salt: number = 0): number {
  let s = (fid * 7919 + 42 + salt * 104729);
  s = (s * 16807 + 0) % 2147483647;
  return Math.abs(s % TOTAL_CRUSTIES);
}

/**
 * Find and claim the next unclaimed crustie index.
 * Uses a deterministic seed derived from FID + salt (mint slot number).
 * Returns null if all 499 crusties are claimed.
 */
function claimNextAvailable(store: AssignmentStore, fid: number, salt: number): number | null {
  if (store.claimedIndices.length >= TOTAL_CRUSTIES) return null;

  const claimedSet = new Set(store.claimedIndices);
  const startIndex = fidToStartIndex(fid, salt);

  for (let offset = 0; offset < TOTAL_CRUSTIES; offset++) {
    const candidate = (startIndex + offset) % TOTAL_CRUSTIES;
    if (!claimedSet.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Get the crustie index for a FID at a specific mint slot.
 * `mintSlot` is 0-based: 0 = first mint, 1 = second mint, 2 = third mint.
 *
 * - If the FID already has an assignment for this slot, returns it.
 * - Otherwise, claims a new unique crustie and saves it.
 * - Returns null if all 499 crusties have been assigned.
 */
export function getOrAssignForSlot(fid: number, mintSlot: number): number | null {
  const store = loadStore();
  const indices = getIndicesForFid(store, fid);

  // Already have an assignment for this slot
  if (mintSlot < indices.length) {
    return indices[mintSlot];
  }

  // Need to fill in all slots up to and including mintSlot
  // (in case slots were skipped somehow)
  for (let slot = indices.length; slot <= mintSlot; slot++) {
    const candidate = claimNextAvailable(store, fid, slot);
    if (candidate === null) return null;

    indices.push(candidate);
    store.claimedIndices.push(candidate);
  }

  setIndicesForFid(store, fid, indices);
  saveStore(store);
  return indices[mintSlot];
}

/**
 * Get (or create) the crustie index assigned to a FID (first slot).
 * Backward-compatible wrapper — returns the first assignment for this FID.
 */
export function getOrAssign(fid: number): number | null {
  return getOrAssignForSlot(fid, 0);
}

/**
 * How many crusties have been assigned so far.
 */
export function assignedCount(): number {
  const store = loadStore();
  return store.claimedIndices.length;
}

/**
 * Returns the crustie index for a FID's first assignment if it exists, or null.
 * Does NOT create a new assignment.
 */
export function getAssignment(fid: number): number | null {
  const store = loadStore();
  const indices = getIndicesForFid(store, fid);
  return indices.length > 0 ? indices[0] : null;
}

/**
 * Returns all crustie indices assigned to a FID.
 */
export function getAssignments(fid: number): number[] {
  const store = loadStore();
  return getIndicesForFid(store, fid);
}

// ─── Tier-based assignment ───────────────────────────────────────────────────

const CURATED_METADATA_FILE =
  process.env.CURATED_METADATA_FILE ||
  resolve(process.cwd(), "data/crusties-metadata.json");

/** Cache: rarity tier → array of crustie indices (0-based) */
let tierIndexCache: Record<string, number[]> | null = null;

function getTierIndex(): Record<string, number[]> {
  if (tierIndexCache) return tierIndexCache;

  tierIndexCache = {};
  if (!existsSync(CURATED_METADATA_FILE)) return tierIndexCache;

  const entries: CuratedCrustieEntry[] = JSON.parse(
    readFileSync(CURATED_METADATA_FILE, "utf-8")
  );

  for (const entry of entries) {
    const crustieNum = parseInt(entry.id, 10);
    // Convert crustie number to 0-based index
    const idx = VALID_CRUSTIE_NUMBERS.indexOf(crustieNum);
    if (idx === -1) continue;

    const tier = entry.rarity;
    if (!tierIndexCache[tier]) tierIndexCache[tier] = [];
    tierIndexCache[tier].push(idx);
  }

  return tierIndexCache;
}

/**
 * Claim a crustie from a specific tier for a given FID + mint slot.
 * Falls back to any unclaimed crustie if the tier is exhausted.
 * Returns null if all 499 are claimed.
 */
function claimFromTier(store: AssignmentStore, fid: number, salt: number, tier: string): number | null {
  if (store.claimedIndices.length >= TOTAL_CRUSTIES) return null;

  const claimedSet = new Set(store.claimedIndices);
  const tierMap = getTierIndex();
  const tierIndices = tierMap[tier] || [];

  // Find unclaimed indices within the requested tier
  const available = tierIndices.filter((idx) => !claimedSet.has(idx));

  if (available.length > 0) {
    const seed = fidToStartIndex(fid, salt);
    return available[seed % available.length];
  }

  // Tier exhausted — fall back to any unclaimed crustie
  return claimNextAvailable(store, fid, salt);
}

/**
 * Assign a crustie to a FID at a specific mint slot, picking from a rarity tier.
 * - If FID already has an assignment for this slot, returns it.
 * - Otherwise, picks from the tier (or any available if tier is exhausted).
 * - Returns null if all 499 crusties are claimed.
 */
export function getOrAssignByTierForSlot(fid: number, mintSlot: number, tier: string): number | null {
  const store = loadStore();
  const indices = getIndicesForFid(store, fid);

  // Already have an assignment for this slot
  if (mintSlot < indices.length) {
    return indices[mintSlot];
  }

  // Fill in all slots up to and including mintSlot
  for (let slot = indices.length; slot <= mintSlot; slot++) {
    const candidate = claimFromTier(store, fid, slot, tier);
    if (candidate === null) return null;

    indices.push(candidate);
    store.claimedIndices.push(candidate);
  }

  setIndicesForFid(store, fid, indices);
  saveStore(store);
  return indices[mintSlot];
}

/**
 * Backward-compatible wrapper — assigns first slot by tier.
 */
export function getOrAssignByTier(fid: number, tier: string): number | null {
  return getOrAssignByTierForSlot(fid, 0, tier);
}

/**
 * Re-roll: release the FID's assignment at a specific slot and pick a new one.
 * Returns null if no more are available.
 */
export function reassignByTierForSlot(fid: number, mintSlot: number, tier: string): number | null {
  const store = loadStore();
  const indices = getIndicesForFid(store, fid);

  // Release the assignment at this slot if it exists
  if (mintSlot < indices.length) {
    const releasedIdx = indices[mintSlot];
    store.claimedIndices = store.claimedIndices.filter((i) => i !== releasedIdx);
    indices.splice(mintSlot, 1); // Remove so it gets re-filled below
    setIndicesForFid(store, fid, indices);
    saveStore(store);
  }

  // Now assign a new one at this slot
  return getOrAssignByTierForSlot(fid, mintSlot, tier);
}

/**
 * Backward-compatible wrapper — re-rolls first slot.
 */
export function reassignByTier(fid: number, tier: string): number | null {
  return reassignByTierForSlot(fid, 0, tier);
}
