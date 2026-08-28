"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { supabase, supabaseConfigured, type MarketSubmission, type MarketRow } from "@/lib/supabase";
import { useBullsDenProgram, marketPda, vaultPda, configPda } from "@/lib/program";
import { ANSEM_MINT, ADMIN_AUTHORITY, TREASURY_WALLET } from "@/lib/constants";

export default function AdminPage() {
  const { publicKey } = useWallet();
  const program = useBullsDenProgram();

  const isAdmin =
    !!publicKey && !!ADMIN_AUTHORITY && publicKey.toBase58() === ADMIN_AUTHORITY;

  const [pending, setPending] = useState<MarketSubmission[]>([]);
  const [resolvable, setResolvable] = useState<MarketRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadAll() {
    if (!supabaseConfigured) return;
    const { data: p } = await supabase
      .from("market_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPending(p || []);

    const { data: r } = await supabase
      .from("markets")
      .select("*")
      .eq("status", "open")
      .lte("deadline", new Date().toISOString());
    setResolvable(r || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approve(sub: MarketSubmission) {
    if (!program || !publicKey) return setStatus("Connect the admin wallet first.");
    setBusyId(sub.id);
    setStatus("Creating market on-chain...");
    try {
      // Simple incrementing market id based on current unix time (unique enough for devnet use).
      const marketId = Math.floor(Date.now() / 1000);
      const [config] = configPda();
      const [market] = marketPda(marketId);
      const [vault] = vaultPda(marketId);
      const deadline = new BN(Math.floor(new Date(sub.deadline).getTime() / 1000));

      const sig = await (program.methods as any)
        .createMarket(new BN(marketId), sub.outcome_a, sub.outcome_b, deadline)
        .accounts({
          config,
          market,
          vault,
          ansemMint: ANSEM_MINT,
          creator: new (await import("@solana/web3.js")).PublicKey(sub.creator_wallet),
          payer: publicKey,
        })
        .rpc();

      await supabase.from("markets").insert({
        onchain_market_id: marketId,
        onchain_address: market.toBase58(),
        creator_wallet: sub.creator_wallet,
        title: sub.title,
        description: sub.description,
        outcome_a: sub.outcome_a,
        outcome_b: sub.outcome_b,
        deadline: sub.deadline,
        image_url: sub.image_url,
        status: "open",
      });
      await supabase.from("market_submissions").update({ status: "approved" }).eq("id", sub.id);

      setStatus(`Approved. Tx: ${sig.slice(0, 12)}...`);
      loadAll();
    } catch (err: any) {
      setStatus(err?.message || "Failed to create market on-chain.");
    } finally {
      setBusyId(null);
    }
  }

  async function deny(sub: MarketSubmission) {
    setBusyId(sub.id);
    await supabase.from("market_submissions").update({ status: "denied" }).eq("id", sub.id);
    setBusyId(null);
    loadAll();
  }

  async function resolve(m: MarketRow, winningOutcome: 0 | 1) {
    if (!program || !publicKey || !m.onchain_market_id) return;
    setBusyId(m.id);
    setStatus("Resolving on-chain...");
    try {
      const [config] = configPda();
      const [market] = marketPda(m.onchain_market_id);
      const [vault] = vaultPda(m.onchain_market_id);
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        ANSEM_MINT,
        new (await import("@solana/web3.js")).PublicKey(TREASURY_WALLET)
      );
      const creatorTokenAccount = getAssociatedTokenAddressSync(
        ANSEM_MINT,
        new (await import("@solana/web3.js")).PublicKey(m.creator_wallet)
      );

      const sig = await (program.methods as any)
        .resolveMarket(winningOutcome)
        .accounts({
          config,
          market,
          vault,
          treasuryTokenAccount,
          creatorTokenAccount,
          admin: publicKey,
        })
        .rpc();

      await supabase
        .from("markets")
        .update({ status: "resolved", winning_outcome: winningOutcome, resolved_at: new Date().toISOString() })
        .eq("id", m.id);

      setStatus(`Resolved. Tx: ${sig.slice(0, 12)}...`);
      loadAll();
    } catch (err: any) {
      setStatus(err?.message || "Failed to resolve on-chain.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
      <p className="text-sm text-zinc-500 mb-8">
        Connect the admin wallet ({ADMIN_AUTHORITY ? `${ADMIN_AUTHORITY.slice(0, 4)}...${ADMIN_AUTHORITY.slice(-4)}` : "not set in .env.local"})
        to approve, deny, and resolve markets.
      </p>

      {!supabaseConfigured && (
        <div className="border border-yellow-800 bg-yellow-950/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
          Supabase isn&apos;t configured yet.
        </div>
      )}
      {!isAdmin && publicKey && (
        <div className="border border-yellow-800 bg-yellow-950/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
          Connected wallet is not the admin wallet set in NEXT_PUBLIC_ADMIN_AUTHORITY. Actions will fail on-chain.
        </div>
      )}
      {status && <p className="text-sm text-zinc-400 mb-6">{status}</p>}

      <section className="mb-10">
        <h3 className="font-semibold mb-3">Pending Markets ({pending.length})</h3>
        <div className="grid gap-3">
          {pending.map((s) => (
            <div key={s.id} className="border border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-zinc-500">
                  {s.outcome_a} vs {s.outcome_b} · closes {new Date(s.deadline).toLocaleString()} · by {s.creator_wallet.slice(0, 4)}...{s.creator_wallet.slice(-4)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => deny(s)}
                  disabled={busyId === s.id}
                  className="px-3 py-2 rounded-lg border border-zinc-700 text-sm disabled:opacity-50"
                >
                  Deny
                </button>
                <button
                  onClick={() => approve(s)}
                  disabled={busyId === s.id || !isAdmin}
                  className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm disabled:opacity-50"
                >
                  {busyId === s.id ? "..." : "Approve"}
                </button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-zinc-600">Nothing pending.</p>}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Ready to Resolve ({resolvable.length})</h3>
        <div className="grid gap-3">
          {resolvable.map((m) => (
            <div key={m.id} className="border border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-zinc-500">Deadline passed: {new Date(m.deadline).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => resolve(m, 0)}
                  disabled={busyId === m.id || !isAdmin}
                  className="px-3 py-2 rounded-lg border border-zinc-700 text-sm disabled:opacity-50"
                >
                  {m.outcome_a} won
                </button>
                <button
                  onClick={() => resolve(m, 1)}
                  disabled={busyId === m.id || !isAdmin}
                  className="px-3 py-2 rounded-lg border border-zinc-700 text-sm disabled:opacity-50"
                >
                  {m.outcome_b} won
                </button>
              </div>
            </div>
          ))}
          {resolvable.length === 0 && <p className="text-sm text-zinc-600">Nothing due for resolution.</p>}
        </div>
      </section>
    </div>
  );
}
