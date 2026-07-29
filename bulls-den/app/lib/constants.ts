import { PublicKey } from "@solana/web3.js";

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "Bu11sDen11111111111111111111111111111111111"
);

export const ANSEM_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_ANSEM_MINT || "11111111111111111111111111111111"
);

export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || "";
export const ADMIN_AUTHORITY = process.env.NEXT_PUBLIC_ADMIN_AUTHORITY || "";

// Fee display (must match on-chain)
export const TREASURY_FEE_PERCENT = 10;
export const CREATOR_FEE_PERCENT = 2;
export const WINNER_PERCENT = 88;

export const MAX_MARKET_DAYS = 14;
export const MIN_TRADE_USD = 2;
