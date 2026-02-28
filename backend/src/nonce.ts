import { createPublicClient, http, type Hex } from "viem";
import { base } from "viem/chains";

const CRUSTIES_CONTRACT_ADDRESS = process.env.CRUSTIES_CONTRACT_ADDRESS as Hex;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});

const NONCES_ABI = [
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const MINT_COUNT_ABI = [
  {
    name: "mintCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function getNonce(minterAddress: Hex): Promise<bigint> {
  if (!CRUSTIES_CONTRACT_ADDRESS || CRUSTIES_CONTRACT_ADDRESS === "0x") {
    return 0n;
  }

  const nonce = await client.readContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: NONCES_ABI,
    functionName: "nonces",
    args: [minterAddress],
  });

  return nonce;
}

/**
 * Read how many times a wallet has already minted from the on-chain contract.
 */
export async function getMintCount(minterAddress: Hex): Promise<bigint> {
  if (!CRUSTIES_CONTRACT_ADDRESS || CRUSTIES_CONTRACT_ADDRESS === "0x") {
    return 0n;
  }

  const count = await client.readContract({
    address: CRUSTIES_CONTRACT_ADDRESS,
    abi: MINT_COUNT_ABI,
    functionName: "mintCount",
    args: [minterAddress],
  });

  return count;
}
