"use client";

import { useEffect, useState } from "react";
import { supabaseConfigured, type MarketRow } from "@/lib/supabase";
import { BuySharesModal } from "@/components/BuySharesModal";
import { LoreSection } from "@/components/LoreSection";

export default function HomePage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<MarketRow | null>(null);
  const [prices, setPrices] = useState<Record<string, { usd: number; usd_24h_change: number }>>({});

  async function loadMarkets() {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const response = await fetch("/api/markets");
    const result = await response.json();
    if (!response.ok) setError(result.error || "Failed to load markets.");
    else setMarkets(result.markets || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMarkets();
    let cancelled = false;
    async function loadPrices() {
      try {
        const response = await fetch("/api/prices");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setPrices(data);
      } catch {
        // The market remains usable when the optional price feed is unavailable.
      }
    }
    loadPrices();
    const interval = window.setInterval(loadPrices, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rbd-bg -mx-6 -mt-8 px-6 pt-8 pb-10">
      <div className="overflow-hidden border-y border-zinc-800/70 bg-zinc-950/50 mb-8">
        <div className="ticker-track flex w-max">
          {[...Array(2)].flatMap((_, copy) =>
            [
              ["BTC", "bitcoin"],
              ["ETH", "ethereum"],
              ["BNB", "binancecoin"],
              ["SOL", "solana"],
            ].map(([symbol, id]) => {
              const price = prices[id];
              return (
                <span key={`${copy}-${id}`} className="px-6 py-2 text-xs whitespace-nowrap">
                  {symbol} {price ? `$${price.usd.toLocaleString()}` : "Loading..."}{" "}
                  {price && (
                    <span className={price.usd_24h_change >= 0 ? "text-green-400" : "text-red-400"}>
                      {price.usd_24h_change >= 0 ? "+" : ""}{price.usd_24h_change.toFixed(2)}%
                    </span>
                  )}
                </span>
              );
            })
          )}
        </div>
      </div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">The Den</h2>
        <p className="text-zinc-400">
          Moderated prediction markets. Only $ANSEM.
        </p>
      </div>

      <LoreSection />

      {!supabaseConfigured && (
        <div className="border border-yellow-800 bg-yellow-950/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
          Supabase isn&apos;t configured yet (missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local),
          so markets can&apos;t load. Set those up, then restart the dev server.
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid gap-4">
        {loading && supabaseConfigured && (
          <p className="text-zinc-500 text-sm">Loading markets...</p>
        )}

        {!loading && supabaseConfigured && markets.length === 0 && (
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
            <p className="text-zinc-500 text-sm">
              No live markets yet. Create one or wait for admin approval.
            </p>
          </div>
        )}

        {markets.map((m) => (
          <div
            key={m.id}
            className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/70 transition-colors hover:border-red-800"
          >
            <button type="button" onClick={() => setBuying(buying?.id === m.id ? null : m)} className="w-full text-left flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">{m.title}</h3>
              <p className="text-xs text-zinc-500 mb-2">
                {m.outcome_a} vs {m.outcome_b} · closes {new Date(m.deadline).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600">
                Pool: {m.total_a + m.total_b} $ANSEM ({m.total_a} / {m.total_b})
              </p>
            </div>
            <span className="bg-red-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
              {m.onchain_market_id ? "Buy Shares" : "Not on-chain yet"}
            </span>
            </button>
            <div
              className={`market-buy-panel ${buying?.id === m.id ? "is-open" : ""}`}
              aria-hidden={buying?.id !== m.id}
            >
              <div className="market-buy-panel-content">
                <BuySharesModal
                  market={m}
                  onClose={() => setBuying(null)}
                  onSuccess={loadMarkets}
                  inline
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}