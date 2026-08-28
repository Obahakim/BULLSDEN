"use client";

import { useMemo } from "react";

const FACTS = [
  "Solana can theoretically process 65,000 transactions per second — dwarfing Visa's peak throughput.",
  "The name \"Solana\" comes from Solana Beach, California, where founder Anatoly Yakovenko used to surf.",
  "Solana's Proof of History is a cryptographic clock that timestamps transactions before consensus even runs.",
  "The first-ever NFT, \"Quantum,\" was minted on a blockchain back in 2014 — years before anyone called it an NFT.",
  "Satoshi Nakamoto, Bitcoin's creator, has never been definitively identified and hasn't touched their wallet since 2010.",
  "Solana validators run on enterprise-grade hardware — the network trades some decentralization for raw speed.",
  "In 2010, someone paid 10,000 BTC for two pizzas — the first real-world Bitcoin purchase, worth hundreds of millions today.",
  "\"HODL\" was born from a 2013 typo in a Bitcoin forum post titled \"I AM HODLING.\"",
  "Solana's SPL Token standard is the equivalent of Ethereum's ERC-20 — but a transfer costs a fraction of a cent.",
  "Prediction markets aren't new — informal election betting happened on Wall Street as far back as the 1800s.",
  "The Solana Foundation is based in Switzerland, while its engineering team is spread across the globe, fully remote.",
  "Devnet SOL and $ANSEM here are worthless by design — it's a sandbox for practicing the real thing without real risk.",
];

export function LoreSection() {
  const picks = useMemo(() => {
    const shuffled = [...FACTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40 mb-10">
      <h3 className="font-semibold mb-1 text-red-400">🐂 Tales from the Den</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Every bull in this room has a story. So does the chain you&apos;re betting on.
      </p>
      <ul className="space-y-3">
        {picks.map((fact, i) => (
          <li key={i} className="text-sm text-zinc-400 flex gap-2">
            <span className="text-red-600">◆</span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}