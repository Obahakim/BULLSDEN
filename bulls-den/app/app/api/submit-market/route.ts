import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";

const MAX_MARKET_DAYS = 14;

export async function POST(req: NextRequest) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json({ error: "Supabase service role key isn't configured." }, { status: 500 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sign in with your wallet first." }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, outcomeA, outcomeB, deadline } = body;

  if (session.wallet !== body.wallet) {
    return NextResponse.json({ error: "Wallet mismatch with active session." }, { status: 403 });
  }
  if (!title || !deadline || !outcomeA || !outcomeB) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const deadlineDate = new Date(deadline);
  const maxDate = new Date(Date.now() + MAX_MARKET_DAYS * 24 * 60 * 60 * 1000);
  if (deadlineDate > maxDate) {
    return NextResponse.json({ error: `Deadline can't be more than ${MAX_MARKET_DAYS} days out.` }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email_verified")
    .eq("wallet_address", session.wallet)
    .maybeSingle();

  if (!user?.email_verified) {
    return NextResponse.json({ error: "Verify your email before submitting a market." }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("market_submissions").insert({
    creator_wallet: session.wallet,
    title,
    description: description || null,
    outcome_a: outcomeA,
    outcome_b: outcomeB,
    deadline: deadlineDate.toISOString(),
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}