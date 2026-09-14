import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase service role key isn't configured." },
      { status: 500 }
    );
  }

  const ids = new URL(request.url).searchParams.get("ids");
  let query = supabaseAdmin
    .from("markets")
    .select("*")
    .order("created_at", { ascending: false });
  if (ids) {
    const marketIds = ids
      .split(",")
      .map((id) => Number(id))
      .filter((id) => Number.isSafeInteger(id) && id >= 0);
    if (marketIds.length === 0) {
      return NextResponse.json({ markets: [] });
    }
    query = query.in("onchain_market_id", marketIds);
  } else {
    query = query.eq("status", "open");
  }
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ markets: data || [] });
}
