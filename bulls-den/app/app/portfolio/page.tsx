"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { ANSEM_MINT } from "@/lib/constants";
import { useBullsDenProgram } from "@/lib/program";
import { supabase, supabaseConfigured, type MarketRow } from "@/lib/supabase";

type PositionView = {
  marketId: number;
  sharesA: number;
  sharesB: number;
  claimed: boolean;
  market?: MarketRow;
};

export default function PortfolioPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useBullsDenProgram();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [ansemBalance, setAnsemBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const lamports = await connection.getBalance(publicKey!);
      if (!cancelled) setSolBalance(lamports / 1e9);

      try {
        const ata = await getAssociatedTokenAddress(ANSEM_MINT, publicKey!);
        const account = await getAccount(connection, ata);
        if (!cancelled) setAnsemBalance(Number(account.amount) / 1_000_000);
      } catch {
        if (!cancelled) setAnsemBalance(0);
      }

      if (program) {
        try {
          const accounts = await (program.account as any).userPosition.all([
            { memcmp: { offset: 8, bytes: publicKey!.toBase58() } },
          ]);

          const marketIds = accounts.map((a: any) => Number(a.account.market_id));
          let marketsById: Record<number, MarketRow> = {};
          if (supabaseConfigured && marketIds.length > 0) {
            const { data } = await supabase.from("markets").select("*").in("onchain_market_id", marketIds);
            (data || []).forEach((m) => {
              if (m.onchain_market_id != null) marketsById[m.onchain_market_id] = m;
            });
          }

          const mapped: PositionView[] = accounts.map((a: any) => ({
            marketId: Number(a.account.market_id),
            sharesA: Number(a.account.shares_a) / 1_000_000,
            sharesB: Number(a.account.shares_b) / 1_000_000,
            claimed: a.account.claimed,
            market: marketsById[Number(a.account.market_id)],
          }));

          if (!cancelled) setPositions(mapped);
        } catch {
          if (!cancelled) setPositions([]);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection, program]);

  if (!publicKey) {
    return <p className="text-sm text-zinc-500">Connect your wallet to see your portfolio.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Portfolio</h2>

      <div className="grid grid-cols-2 gap-4 mb-10 max-w-md">
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">SOL Balance</p>
          <p className="text-2xl font-bold">{solBalance === null ? "..." : solBalance.toFixed(3)}</p>
        </div>
        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-1">$ANSEM Balance</p>
          <p className="text-2xl font-bold">{ansemBalance === null ? "..." : ansemBalance.toLocaleString()}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-3">Market Positions</h3>
      {loading && <p className="text-sm text-zinc-500">Loading positions...</p>}
      {!loading && positions.length === 0 && (
        <p className="text-sm text-zinc-600">No positions yet — buy shares in a market to see them here.</p>
      )}
      <div className="grid gap-3">
        {positions.map((p) => (
          <div key={p.marketId} className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50">
            <p className="font-medium">{p.market?.title || `Market #${p.marketId}`}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {p.market?.outcome_a || "Outcome A"}: {p.sharesA} shares · {p.market?.outcome_b || "Outcome B"}: {p.sharesB} shares
            </p>
            {p.claimed && <p className="text-xs text-green-500 mt-1">Winnings claimed</p>}
          </div>
        ))}
      </div>
    </div>
  );
}