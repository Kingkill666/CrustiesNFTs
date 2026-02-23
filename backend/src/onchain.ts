import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";

export interface OnChainData {
  address: string;
  ethBalance: string;
  txCount: number;
  hasNFTs: boolean;
  hasDeFiActivity: boolean;
  pizzaBalance: string;
}

const PIZZA_TOKEN = "0xa821f2ee19f4f62e404c934d43eb6e5763fbdb07" as const;

// Minimal ERC-20 balanceOf ABI
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function getClient() {
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
}

export async function fetchOnChainData(address?: string): Promise<OnChainData> {
  if (!address) {
    return {
      address: "",
      ethBalance: "0",
      txCount: 0,
      hasNFTs: false,
      hasDeFiActivity: false,
      pizzaBalance: "0",
    };
  }

  const client = getClient();
  const addr = address as `0x${string}`;

  const [balance, txCount, pizzaBalance] = await Promise.all([
    client.getBalance({ address: addr }),
    client.getTransactionCount({ address: addr }),
    client.readContract({
      address: PIZZA_TOKEN,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [addr],
    }),
  ]);

  return {
    address,
    ethBalance: formatEther(balance),
    txCount,
    hasNFTs: txCount > 20,
    hasDeFiActivity: txCount > 50,
    pizzaBalance: formatEther(pizzaBalance),
  };
}
