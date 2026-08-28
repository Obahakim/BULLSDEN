import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const ANSEM_MINT = process.env.NEXT_PUBLIC_ANSEM_MINT;
const FAUCET_SECRET_KEY = process.env.FAUCET_AUTHORITY_SECRET_KEY; // base58, mint-authority keypair
const FAUCET_AMOUNT = Number(process.env.FAUCET_AMOUNT_ANSEM || "100"); // whole tokens per claim
const FAUCET_COOLDOWN_HOURS = Number(process.env.FAUCET_COOLDOWN_HOURS || "24");
const DECIMALS = 6;

export async function POST(req: NextRequest) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase service role key isn't configured on the server yet." },
      { status: 500 }
    );
  }
  if (!ANSEM_MINT) {
    return NextResponse.json({ error: "NEXT_PUBLIC_ANSEM_MINT isn't set." }, { status: 500 });
  }
  if (!FAUCET_SECRET_KEY) {
    return NextResponse.json(
      { error: "FAUCET_AUTHORITY_SECRET_KEY isn't configured on the server yet." },
      { status: 500 }
    );
  }

  const { wallet } = await req.json();
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet address." }, { status: 400 });
  }

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  // --- Rate limit: one claim per wallet per FAUCET_COOLDOWN_HOURS ---
  const { data: existing } = await supabaseAdmin
    .from("faucet_claims")
    .select("*")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (existing) {
    const last = new Date(existing.last_claimed_at).getTime();
    const cooldownMs = FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000;
    const remainingMs = last + cooldownMs - Date.now();
    if (remainingMs > 0) {
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      return NextResponse.json(
        { error: `You've already claimed. Try again in ~${remainingHours}h.` },
        { status: 429 }
      );
    }
  }

  // --- Mint ---
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const authority = Keypair.fromSecretKey(bs58.decode(FAUCET_SECRET_KEY));
    const mint = new PublicKey(ANSEM_MINT);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      authority, // payer for the ATA rent if it doesn't exist yet
      mint,
      recipient
    );

    const amountBaseUnits = FAUCET_AMOUNT * 10 ** DECIMALS;

    const sig = await mintTo(
      connection,
      authority,
      mint,
      ata.address,
      authority,
      amountBaseUnits
    );

    await supabaseAdmin.from("faucet_claims").upsert(
      {
        wallet_address: wallet,
        last_claimed_at: new Date().toISOString(),
        claim_count: (existing?.claim_count || 0) + 1,
      },
      { onConflict: "wallet_address" }
    );

    return NextResponse.json({ ok: true, amount: FAUCET_AMOUNT, signature: sig });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to mint test $ANSEM." },
      { status: 500 }
    );
  }
}