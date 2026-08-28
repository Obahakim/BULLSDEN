"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function FaucetButton() {
  const { publicKey } = useWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function claim() {
    if (!publicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Faucet claim failed.");
      setMessage(`+${data.amount} test $ANSEM sent!`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!publicKey) return null;

  return (
    <div className="relative">
      <button
        onClick={claim}
        disabled={busy}
        className="text-sm px-3 py-2 rounded-lg border border-zinc-700 hover:border-red-600 disabled:opacity-50 whitespace-nowrap"
      >
        {busy ? "Claiming..." : "🚰 Get Test $ANSEM"}
      </button>
      {message && (
        <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs w-56 z-10">
          {message}
        </div>
      )}
    </div>
  );
}