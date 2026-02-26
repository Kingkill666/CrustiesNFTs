import { type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const CRUSTIES_CONTRACT_ADDRESS = process.env.CRUSTIES_CONTRACT_ADDRESS as Hex;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as Hex;
const CHAIN_ID = Number(process.env.CHAIN_ID || "8453"); // Base Mainnet

// EIP-712 domain — must match the contract's __EIP712_init("CrustiesNFT", "1")
const domain = {
  name: "CrustiesNFT",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: CRUSTIES_CONTRACT_ADDRESS,
} as const;

// EIP-712 typed data types — must match the contract's MINT_PERMIT_TYPEHASH
const types = {
  MintPermit: [
    { name: "minter", type: "address" },
    { name: "tokenURI", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export async function signMintPermit(
  minterAddress: Hex,
  tokenURI: string,
  nonce: bigint
): Promise<Hex> {
  if (!SIGNER_PRIVATE_KEY) {
    throw new Error("SIGNER_PRIVATE_KEY is not set");
  }
  if (!CRUSTIES_CONTRACT_ADDRESS) {
    throw new Error("CRUSTIES_CONTRACT_ADDRESS is not set");
  }

  const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: "MintPermit",
    message: {
      minter: minterAddress,
      tokenURI,
      nonce,
    },
  });

  return signature;
}
