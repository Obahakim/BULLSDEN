"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const reason = params.get("reason");

  const messages: Record<string, string> = {
    "missing-token": "That verification link is missing its token.",
    "invalid-token": "That verification link is invalid or was already used.",
    expired: "That verification link expired. Request a new one from the Create page.",
    "update-failed": "Something went wrong saving your verification. Try again.",
    "not-configured": "Email verification isn't fully configured on the server yet.",
  };

  return (
    <div className="max-w-md mx-auto text-center py-16">
      {status === "success" ? (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Email verified</h2>
          <p className="text-zinc-400 text-sm">
            You&apos;re all set. Head back to the Create page to submit a market.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Verification failed</h2>
          <p className="text-zinc-400 text-sm">
            {reason ? messages[reason] || "Something went wrong." : "Something went wrong."}
          </p>
        </>
      )}
      <a href="/create" className="inline-block mt-6 text-red-400 hover:text-red-300 text-sm">
        ← Back to Create Market
      </a>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}