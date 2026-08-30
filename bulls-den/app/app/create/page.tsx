"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase, supabaseConfigured, type UserRow } from "@/lib/supabase";
import { MAX_MARKET_DAYS } from "@/lib/constants";
import { SignInGate } from "@/components/SignInGate";

function EmailVerifyGate({
  wallet,
  onVerified,
}: {
  wallet: string;
  onVerified: () => void;
}) {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<UserRow | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function loadUser() {
    setChecking(true);
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet)
      .maybeSingle();
    setUser(data);
    setChecking(false);
    if (data?.email_verified) onVerified();
  }

  useEffect(() => {
    if (supabaseConfigured) loadUser();
    else setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  async function sendVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("Enter a valid email address.");
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification email.");
      setStatus(`Verification email sent to ${email}. Check your inbox and click the link.`);
    } catch (err: any) {
      setStatus(err.message);
    } finally {
      setSending(false);
    }
  }

  if (checking) return <p className="text-sm text-zinc-500">Checking verification status...</p>;

  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 max-w-md">
      <h3 className="font-semibold mb-2">Verify your email to submit markets</h3>
      <p className="text-sm text-zinc-400 mb-4">
        {user?.email
          ? `We sent a link to ${user.email} — click it, then refresh this page. Wrong email? Enter a new one below.`
          : "One-time step: verify an email so admins can reach you about your submissions."}
      </p>
      <form onSubmit={sendVerification} className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm whitespace-nowrap"
        >
          {sending ? "Sending..." : user?.email ? "Resend" : "Send link"}
        </button>
      </form>
      {status && <p className="text-xs text-zinc-400 mt-3">{status}</p>}
      <button onClick={loadUser} className="text-xs text-red-400 hover:text-red-300 mt-3">
        I already verified — check again
      </button>
    </div>
  );
}

function CreateMarketForm({ wallet }: { wallet: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [outcomeA, setOutcomeA] = useState("Yes");
  const [outcomeB, setOutcomeB] = useState("No");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!title || !deadline) {
      setStatus("Title and deadline are required.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/submit-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          title,
          description,
          outcomeA,
          outcomeB,
          deadline: new Date(deadline).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit.");

      setStatus("Submitted! An admin will review it shortly.");
      setTitle("");
      setDescription("");
      setDeadline("");
    } catch (err: any) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
          placeholder="Will X happen by Y date?"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Description / Resolution criteria</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 h-28"
          placeholder="Clear rules for how this will be resolved..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Outcome A</label>
          <input
            value={outcomeA}
            onChange={(e) => setOutcomeA(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Outcome B</label>
          <input
            value={outcomeB}
            onChange={(e) => setOutcomeB(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Deadline (max {MAX_MARKET_DAYS} days)</label>
        <input
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          type="datetime-local"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
        />
      </div>

      {status && <p className="text-sm text-zinc-400">{status}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg"
      >
        {busy ? "Submitting..." : "Submit for Review"}
      </button>
    </form>
  );
}

export default function CreateMarketPage() {
  const { publicKey } = useWallet();
  const [emailVerified, setEmailVerified] = useState(false);

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">Submit a Market</h2>
      <p className="text-zinc-400 mb-8 text-sm">
        All markets are reviewed by admin. You need a connected, signed-in wallet
        and a verified email. Max duration: {MAX_MARKET_DAYS} days. Binary outcomes only.
      </p>

      <SignInGate>
        {publicKey && !emailVerified && (
          <EmailVerifyGate wallet={publicKey.toBase58()} onVerified={() => setEmailVerified(true)} />
        )}
        {publicKey && emailVerified && <CreateMarketForm wallet={publicKey.toBase58()} />}
      </SignInGate>
    </div>
  );
}