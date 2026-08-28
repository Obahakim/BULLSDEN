"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

export function useSignIn() {
  const { publicKey, signMessage, connected } = useWallet();
  const [sessionWallet, setSessionWallet] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSessionWallet(data.wallet);
    } catch {
      setSessionWallet(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const isSignedIn = connected && !!publicKey && sessionWallet === publicKey.toBase58();

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      setError("This wallet doesn't support message signing.");
      return false;
    }
    setSigningIn(true);
    setError(null);
    try {
      const wallet = publicKey.toBase58();

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error || "Failed to start sign-in.");

      const signatureBytes = await signMessage(new TextEncoder().encode(nonceData.message));

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, signature: bs58.encode(signatureBytes) }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Sign-in failed.");

      setSessionWallet(wallet);
      return true;
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.");
      return false;
    } finally {
      setSigningIn(false);
    }
  }, [publicKey, signMessage]);

  return { isSignedIn, sessionWallet, checking, signingIn, error, signIn, checkSession };
}

/** Wrap any page/section that should require a proven wallet signature. */
export function SignInGate({ children }: { children: React.ReactNode }) {
  const { connected, publicKey } = useWallet();
  const { isSignedIn, checking, signingIn, error, signIn } = useSignIn();

  if (!connected || !publicKey) {
    return <p className="text-sm text-zinc-500">Connect your wallet to continue.</p>;
  }
  if (checking) {
    return <p className="text-sm text-zinc-500">Checking session...</p>;
  }
  if (!isSignedIn) {
    return (
      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 max-w-md">
        <h3 className="font-semibold mb-2">Sign in to continue</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Prove you own this wallet with a free signature — no transaction, no fees.
        </p>
        <button
          onClick={signIn}
          disabled={signingIn}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm"
        >
          {signingIn ? "Waiting for signature..." : "Sign In with Wallet"}
        </button>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </div>
    );
  }
  return <>{children}</>;
}