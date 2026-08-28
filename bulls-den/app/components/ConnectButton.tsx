"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectButton() {
  return (
    <WalletMultiButton className="!bg-red-700 hover:!bg-red-600 !rounded-lg !h-10 !text-sm" />
  );
}
