"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { ANSEM_MINT } from "@/lib/constants";
import { useBullsDenProgram } from "@/lib/program";
import { type MarketRow } from "@/lib/supabase";

type PositionView = {
  marketId: number;
  sharesA: number;
  sharesB: number;
  invested: number;
  claimed: boolean;
  market?: MarketRow;
};

type NumericPositionAccount = {
  account: any;
  marketId: number;
  sharesA: number;
  sharesB: number;
};

function numericAccountValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(typeof value === "object" && value !== null
    ? (value as { toString(): string }).toString()
    : value);
  return Number.isFinite(numeric) ? numeric : null;
}

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
    const connectedPublicKey = publicKey;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const lamports = await connection.getBalance(connectedPublicKey);
        if (!cancelled) setSolBalance(lamports / 1e9);

        const ata = await getAssociatedTokenAddress(ANSEM_MINT, connectedPublicKey);
        const account = await getAccount(connection, ata);
        if (!cancelled) setAnsemBalance(Number(account.amount) / 1_000_000);
      } catch {
        if (!cancelled) setAnsemBalance(0);
      }

      if (program) {
        try {
          const accounts = await (program.account as any).userPosition.all([
            { memcmp: { offset: 8, bytes: connectedPublicKey.toBase58() } },
          ]);

          const mappedAccounts: NumericPositionAccount[] = accounts
            .map((a: any): NumericPositionAccount | null => {
              const marketId = numericAccountValue(a.account.market_id);
              const sharesA = numericAccountValue(a.account.shares_a);
              const sharesB = numericAccountValue(a.account.shares_b);
              if (marketId === null || sharesA === null || sharesB === null) return null;
              return { account: a.account, marketId, sharesA, sharesB };
            })
            .filter((account: NumericPositionAccount | null): account is NumericPositionAccount => account !== null);
          const marketIds = mappedAccounts.map((a) => a.marketId);
          let marketsById: Record<number, MarketRow> = {};
          if (marketIds.length > 0) {
            const response = await fetch(`/api/markets?ids=${marketIds.join(",")}`);
            if (!response.ok) throw new Error("Failed to load market details.");
            const result = await response.json();
            (result.markets || []).forEach((m: MarketRow) => {
              if (m.onchain_market_id != null) marketsById[m.onchain_market_id] = m;
            });
          }

          const mapped: PositionView[] = mappedAccounts.map(({ account, marketId, sharesA, sharesB }) => ({
            marketId,
            sharesA: sharesA / 1_000_000,
            sharesB: sharesB / 1_000_000,
            invested: (sharesA + sharesB) / 1_000_000,
            claimed: account.claimed,
            market: marketsById[marketId],
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
            <p className="text-xs text-zinc-400 mt-1">
              Invested: {p.invested.toLocaleString()} $ANSEM
            </p>
            {p.claimed && <p className="text-xs text-green-500 mt-1">Winnings claimed</p>}
          </div>
        ))}
      </div>
    </div>
  );
}