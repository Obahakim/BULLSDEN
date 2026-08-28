import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";
import { buildSignInMessage, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase service role key isn't configured on the server yet." },
      { status: 500 }
    );
  }

  const { wallet, signature } = await req.json();
  if (!wallet || typeof wallet !== "string" || !signature || typeof signature !== "string") {
    return NextResponse.json({ error: "Missing wallet or signature." }, { status: 400 });
  }

  const { data: row } = await supabaseAdmin
    .from("auth_nonces")
    .select("*")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "No sign-in request found. Try again." }, { status: 400 });
  }
  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Sign-in request expired. Try again." }, { status: 400 });
  }

  const message = buildSignInMessage(wallet, row.nonce);
  const messageBytes = new TextEncoder().encode(message);

  let verified = false;
  try {
    verified = nacl.sign.detached.verify(messageBytes, bs58.decode(signature), bs58.decode(wallet));
  } catch {
    verified = false;
  }

  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
  }

  // One-time use — burn the nonce immediately.
  await supabaseAdmin.from("auth_nonces").delete().eq("wallet_address", wallet);

  const token = createSessionToken(wallet);
  const res = NextResponse.json({ ok: true, wallet });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}