"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { supabase, supabaseConfigured, type MarketSubmission, type MarketRow } from "@/lib/supabase";
import { useBullsDenProgram, marketPda, vaultPda, configPda } from "@/lib/program";
import { ANSEM_MINT, ADMIN_AUTHORITY, TREASURY_WALLET, MAX_MARKET_DAYS } from "@/lib/constants";
import { SignInGate } from "@/components/SignInGate";

async function recordMarket(payload: any) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server rejected the write.");
  return data;
}

function CreateMarketDirect({ onCreated }: { onCreated: () => void }) {
  const { publicKey } = useWallet();
  const program = useBullsDenProgram();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [outcomeA, setOutcomeA] = useState("Yes");
  const [outcomeB, setOutcomeB] = useState("No");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!program || !publicKey) return setStatus("Connect the admin wallet first.");
    if (!title || !deadline) return setStatus("Title and deadline are required.");

    setBusy(true);
    setStatus("Creating market on-chain...");
    try {
      const marketId = Math.floor(Date.now() / 1000);
      const [config] = configPda();
      const [market] = marketPda(marketId);
      const [vault] = vaultPda(marketId);
      const deadlineTs = new BN(Math.floor(new Date(deadline).getTime() / 1000));

      const sig = await (program.methods as any)
        .createMarket(new BN(marketId), outcomeA, outcomeB, deadlineTs)
        .accounts({
          config,
          market,
          vault,
          ansemMint: ANSEM_MINT,
          creator: publicKey,
          payer: publicKey,
        })
        .rpc();

      await recordMarket({
        action: "recordMarket",
        market: {
          onchain_market_id: marketId,
          onchain_address: market.toBase58(),
          creator_wallet: publicKey.toBase58(),
          title,
          description: description || null,
          outcome_a: outcomeA,
          outcome_b: outcomeB,
          deadline: new Date(deadline).toISOString(),
          status: "open",
        },
      });

      setStatus(`Created. Tx: ${sig.slice(0, 12)}...`);
      setTitle("");
      setDescription("");
      setDeadline("");
      onCreated();
    } catch (err: any) {
      setStatus(err?.message || "Failed to create market.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="border border-zinc-700 rounded-xl p-5 space-y-4 max-w-xl">
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2"
          placeholder="Will X happen by Y date?"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Outcome A</label>
          <input
            value={outcomeA}
            onChange={(e) => setOutcomeA(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Outcome B</label>
          <input
            value={outcomeB}
            onChange={(e) => setOutcomeB(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Deadline (max {MAX_MARKET_DAYS} days)</label>
        <input
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          type="datetime-local"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2"
        />
      </div>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      <button
        type="submit"
        disabled={busy}
        className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium"
      >
        {busy ? "Creating..." : "Create Market On-Chain"}
      </button>
    </form>
  );
}

function AdminDashboard() {
  const { publicKey } = useWallet();
  const program = useBullsDenProgram();

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
          creator: new PublicKey(sub.creator_wallet),
          payer: publicKey,
        })
        .rpc();

      await recordMarket({
        action: "recordMarket",
        submissionId: sub.id,
        market: {
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
        },
      });

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
    try {
      await recordMarket({ action: "denySubmission", submissionId: sub.id });
      loadAll();
    } catch (err: any) {
      setStatus(err?.message || "Failed to deny.");
    } finally {
      setBusyId(null);
    }
  }

  async function resolve(m: MarketRow, winningOutcome: 0 | 1) {
    if (!program || !publicKey || !m.onchain_market_id) return;
    setBusyId(m.id);
    setStatus("Resolving on-chain...");
    try {
      const [config] = configPda();
      const [market] = marketPda(m.onchain_market_id);
      const [vault] = vaultPda(m.onchain_market_id);
      const treasuryTokenAccount = getAssociatedTokenAddressSync(ANSEM_MINT, new PublicKey(TREASURY_WALLET));
      const creatorTokenAccount = getAssociatedTokenAddressSync(ANSEM_MINT, new PublicKey(m.creator_wallet));

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

      await recordMarket({ action: "recordResolve", marketId: m.id, winningOutcome });

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
      <h2 className="text-2xl font-bold mb-8">🏴 The Rebellion (Admin)</h2>

      {!supabaseConfigured && (
        <div className="border border-yellow-800 bg-yellow-950/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
          Supabase isn&apos;t configured yet.
        </div>
      )}
      {status && <p className="text-sm text-zinc-400 mb-6">{status}</p>}

      <section className="mb-10">
        <h3 className="font-semibold mb-3">Create a Market Directly</h3>
        <CreateMarketDirect onCreated={loadAll} />
      </section>

      <section className="mb-10">
        <h3 className="font-semibold mb-3">Pending Submissions ({pending.length})</h3>
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
                  disabled={busyId === s.id}
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
                  disabled={busyId === m.id}
                  className="px-3 py-2 rounded-lg border border-zinc-700 text-sm disabled:opacity-50"
                >
                  {m.outcome_a} won
                </button>
                <button
                  onClick={() => resolve(m, 1)}
                  disabled={busyId === m.id}
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

export default function RebellionPage() {
  const { publicKey, connected } = useWallet();

  const isAdminWallet = !!publicKey && !!ADMIN_AUTHORITY && publicKey.toBase58() === ADMIN_AUTHORITY;

  if (!connected) {
    return <p className="text-sm text-zinc-500">Connect your wallet to continue.</p>;
  }
  if (!isAdminWallet) {
    return (
      <div className="max-w-md">
        <h2 className="text-xl font-bold mb-2">Not Authorized</h2>
        <p className="text-sm text-zinc-500">
          This wallet isn&apos;t recognized as the admin wallet. If this is a mistake, check
          NEXT_PUBLIC_ADMIN_AUTHORITY in your environment config.
        </p>
      </div>
    );
  }

  return (
    <SignInGate>
      <AdminDashboard />
    </SignInGate>
  );
}