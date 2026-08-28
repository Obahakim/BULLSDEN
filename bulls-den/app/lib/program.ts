import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { AnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { IDL } from "./idl";
import { PROGRAM_ID } from "./constants";

export function getProvider(connection: any, wallet: AnchorWallet) {
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

// Cast through `any`: our hand-written IDL uses readonly tuples (from `as const`)
// which TS's strict Idl type doesn't accept, but the shape is correct at runtime.
// The return type is intentionally loose (Program<any>) — deriving strict method
// types from this IDL causes TS to blow its instantiation depth limit. Swap in
// the real generated `target/types/bulls_den.ts` (from `anchor build`) later for
// full type safety on `.methods.xxx(...)`.
export function getProgram(provider: AnchorProvider): Program<any> {
  // Anchor 0.30+ reads the program id from idl.address, not a second arg.
  return new Program(IDL as any, provider);
}

/** Client-side hook: returns a ready-to-use Program instance, or null if no wallet connected. */
export function useBullsDenProgram(): Program<any> | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!wallet.publicKey || !wallet.signTransaction) return null;

  const anchorWallet: AnchorWallet = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction as any,
    signAllTransactions: wallet.signAllTransactions as any,
  };

  const provider = getProvider(connection, anchorWallet);
  return getProgram(provider);
}

// ===== PDA helpers (must mirror the seeds in programs/bulls-den/src/lib.rs) =====

export function configPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function marketPda(marketId: number | BN): [PublicKey, number] {
  const id = new BN(marketId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function vaultPda(marketId: number | BN): [PublicKey, number] {
  const id = new BN(marketId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function positionPda(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}
