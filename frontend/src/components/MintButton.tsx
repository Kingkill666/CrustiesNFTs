"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  CRUSTIES_CONTRACT_ADDRESS,
  CRUSTIES_ABI,
  PIZZA_TOKEN_ADDRESS,
  ERC20_ABI,
} from "@/lib/contract";
import { useCrusties } from "@/hooks/useCrusties";
import { parseEther } from "viem";

type PaymentMethod = "eth" | "pizza";

interface MintButtonProps {
  ipfsUri: string;
}

export function MintButton({ ipfsUri }: MintButtonProps) {
  const { address } = useAccount();
  const { minEthPrice, minTokenPrice } = useCrusties();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("eth");

  const {
    data: hash,
    writeContract,
    isPending: isMinting,
    error: mintError,
  } = useWriteContract();

  const {
    writeContract: writeApprove,
    isPending: isApproving,
    data: approveHash,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { isLoading: isApprovingTx } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const handleMintWithETH = () => {
    if (!minEthPrice) return;
    writeContract({
      address: CRUSTIES_CONTRACT_ADDRESS,
      abi: CRUSTIES_ABI,
      functionName: "mintWithETH",
      args: [ipfsUri],
      value: minEthPrice,
    });
  };

  const handleApproveAndMint = async () => {
    if (!minTokenPrice) return;

    // Step 1: Approve $PIZZA spend
    writeApprove(
      {
        address: PIZZA_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CRUSTIES_CONTRACT_ADDRESS, minTokenPrice],
      },
      {
        onSuccess: () => {
          // Step 2: Mint with token after approval
          writeContract({
            address: CRUSTIES_CONTRACT_ADDRESS,
            abi: CRUSTIES_ABI,
            functionName: "mintWithToken",
            args: [ipfsUri, minTokenPrice],
          });
        },
      }
    );
  };

  const handleMint = () => {
    if (paymentMethod === "eth") {
      handleMintWithETH();
    } else {
      handleApproveAndMint();
    }
  };

  const isLoading = isMinting || isConfirming || isApproving || isApprovingTx;

  if (isSuccess && hash) {
    return (
      <div className="w-full rounded-xl bg-pizza-green p-4 text-center">
        <p className="text-lg font-bold">Minted!</p>
        <a
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-300 underline"
        >
          View on BaseScan
        </a>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Payment Method Toggle */}
      <div className="flex gap-2 rounded-xl bg-gray-800 p-1">
        <button
          onClick={() => setPaymentMethod("eth")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            paymentMethod === "eth"
              ? "bg-pizza-red text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Pay with ETH
        </button>
        <button
          onClick={() => setPaymentMethod("pizza")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            paymentMethod === "pizza"
              ? "bg-pizza-red text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Pay with $PIZZA
        </button>
      </div>

      {/* Price display */}
      <p className="text-center text-sm text-gray-500">
        {paymentMethod === "eth"
          ? minEthPrice
            ? `Price: ${parseFloat(
                (Number(minEthPrice) / 1e18).toFixed(6)
              )} ETH`
            : "Loading price..."
          : minTokenPrice
            ? `Price: ${parseFloat(
                (Number(minTokenPrice) / 1e18).toFixed(2)
              )} $PIZZA`
            : "Loading price..."}
      </p>

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={isLoading || !address}
        className="w-full rounded-xl bg-pizza-red px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:bg-red-600 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isLoading
          ? isApproving || isApprovingTx
            ? "Approving $PIZZA..."
            : isConfirming
              ? "Confirming..."
              : "Minting..."
          : `Mint with ${paymentMethod === "eth" ? "ETH" : "$PIZZA"}`}
      </button>

      {/* Error display */}
      {mintError && (
        <p className="text-center text-sm text-red-400">
          {mintError.message.includes("Cannot mint")
            ? "You've reached the max mints per wallet (3)"
            : "Transaction failed. Please try again."}
        </p>
      )}
    </div>
  );
}
