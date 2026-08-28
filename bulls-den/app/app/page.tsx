"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured, type MarketRow } from "@/lib/supabase";
import { BuySharesModal } from "@/components/BuySharesModal";

export default function HomePage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<MarketRow | null>(null);

  async function loadMarkets() {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setMarkets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">The Den</h2>
        <p className="text-zinc-400">
          Moderated prediction markets. Only $ANSEM. Winners take 88%.
        </p>
      </div>

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
            className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold mb-1">{m.title}</h3>
              <p className="text-xs text-zinc-500 mb-2">
                {m.outcome_a} vs {m.outcome_b} · closes {new Date(m.deadline).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600">
                Pool: {m.total_a + m.total_b} $ANSEM ({m.total_a} / {m.total_b})
              </p>
            </div>
            <button
              onClick={() => setBuying(m)}
              disabled={!m.onchain_market_id}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {m.onchain_market_id ? "Buy Shares" : "Not on-chain yet"}
            </button>
          </div>
        ))}
      </div>

      {buying && (
        <BuySharesModal
          market={buying}
          onClose={() => setBuying(null)}
          onSuccess={() => {
            setBuying(null);
            loadMarkets();
          }}
        />
      )}
    </div>
  );
}
