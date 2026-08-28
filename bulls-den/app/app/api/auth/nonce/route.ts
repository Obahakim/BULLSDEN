import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";
import { buildSignInMessage } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase service role key isn't configured on the server yet." },
      { status: 500 }
    );
  }

  const { wallet } = await req.json();
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet address." }, { status: 400 });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min to sign

  const { error } = await supabaseAdmin
    .from("auth_nonces")
    .upsert({ wallet_address: wallet, nonce, expires_at: expiresAt }, { onConflict: "wallet_address" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: buildSignInMessage(wallet, nonce) });
}