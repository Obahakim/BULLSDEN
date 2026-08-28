"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useBullsDenProgram, marketPda, vaultPda, positionPda, configPda } from "@/lib/program";
import { ANSEM_MINT } from "@/lib/constants";
import type { MarketRow } from "@/lib/supabase";

export function BuySharesModal({
  market,
  onClose,
  onSuccess,
}: {
  market: MarketRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { publicKey } = useWallet();
  const program = useBullsDenProgram();
  const [outcome, setOutcome] = useState<0 | 1>(0);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleBuy() {
    if (!program || !publicKey || !market.onchain_market_id) {
      setStatus("Connect a wallet first (and make sure this market is on-chain).");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setStatus("Enter an amount greater than 0.");
      return;
    }

    setBusy(true);
    setStatus("Sending transaction...");
    try {
      const marketId = market.onchain_market_id;
      const [config] = configPda();
      const [marketAddr] = marketPda(marketId);
      const [vault] = vaultPda(marketId);
      const [position] = positionPda(marketAddr, publicKey);
      const userTokenAccount = getAssociatedTokenAddressSync(ANSEM_MINT, publicKey);

      // 6 decimals to match the fake/real $ANSEM mint
      const amountLamports = new BN(Math.round(amt * 1_000_000));

      const sig = await (program.methods as any)
        .buyShares(amountLamports, outcome)
        .accounts({
          config,
          market: marketAddr,
          vault,
          position,
          userTokenAccount,
          user: publicKey,
        })
        .rpc();

      setStatus(`Bought! Tx: ${sig.slice(0, 12)}...`);
      onSuccess();
    } catch (err: any) {
      setStatus(err?.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-lg mb-1">{market.title}</h3>
        <p className="text-xs text-zinc-500 mb-4">Buy shares with $ANSEM</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setOutcome(0)}
            className={`py-2 rounded-lg border ${outcome === 0 ? "border-red-600 bg-red-950" : "border-zinc-700"}`}
          >
            {market.outcome_a}
          </button>
          <button
            onClick={() => setOutcome(1)}
            className={`py-2 rounded-lg border ${outcome === 1 ? "border-red-600 bg-red-950" : "border-zinc-700"}`}
          >
            {market.outcome_b}
          </button>
        </div>

        <label className="block text-sm mb-1">Amount ($ANSEM)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min="0"
          step="any"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 mb-4"
          placeholder="e.g. 50"
        />

        {status && <p className="text-xs text-zinc-400 mb-3 break-words">{status}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-50"
          >
            {busy ? "Buying..." : "Buy Shares"}
          </button>
        </div>
      </div>
    </div>
  );
}
