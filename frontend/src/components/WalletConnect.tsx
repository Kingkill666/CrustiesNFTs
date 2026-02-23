"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnect() {
  return (
    <ConnectButton
      showBalance={true}
      chainStatus="icon"
      accountStatus="address"
    />
  );
}
