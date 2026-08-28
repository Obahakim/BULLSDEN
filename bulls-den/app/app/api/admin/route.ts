import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE, isAllowedAdminIp } from "@/lib/auth";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";

const ADMIN_AUTHORITY = process.env.NEXT_PUBLIC_ADMIN_AUTHORITY;

function requireAdmin(req: NextRequest): string | null {
  const ip = req.headers.get("x-forwarded-for");
  if (!isAllowedAdminIp(ip)) return null;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;
  if (!ADMIN_AUTHORITY || session.wallet !== ADMIN_AUTHORITY) return null;
  return session.wallet;
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (!supabaseAdminConfigured) {
    return NextResponse.json({ error: "Supabase service role key isn't configured." }, { status: 500 });
  }

  const body = await req.json();

  switch (body.action) {
    case "recordMarket": {
      const { error } = await supabaseAdmin.from("markets").insert(body.market);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (body.submissionId) {
        await supabaseAdmin
          .from("market_submissions")
          .update({ status: "approved" })
          .eq("id", body.submissionId);
      }
      return NextResponse.json({ ok: true });
    }

    case "denySubmission": {
      const { error } = await supabaseAdmin
        .from("market_submissions")
        .update({ status: "denied" })
        .eq("id", body.submissionId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case "recordResolve": {
      const { error } = await supabaseAdmin
        .from("markets")
        .update({
          status: "resolved",
          winning_outcome: body.winningOutcome,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", body.marketId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}