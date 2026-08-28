import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";
import { resend, resendConfigured, EMAIL_FROM } from "@/lib/resend";

const TOKEN_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase service role key isn't configured on the server yet." },
      { status: 500 }
    );
  }
  if (!resendConfigured || !resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY isn't configured on the server yet." },
      { status: 500 }
    );
  }

  const { wallet, email } = await req.json();

  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet address." }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  // Upsert the user row with the new email + a fresh token. Re-verifying resets
  // email_verified to false until they click the new link.
  const { error: dbError } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        wallet_address: wallet,
        email,
        email_verified: false,
        email_verification_token: token,
        email_verification_expires: expires,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    );

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const verifyUrl = `${origin}/api/verify-email?token=${token}`;

  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Verify your email for Bull's Den",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>🐂 Bull's Den</h2>
        <p>Confirm your email to submit prediction markets.</p>
        <p>
          <a href="${verifyUrl}" style="background:#b91c1c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color:#888;font-size:12px;">This link expires in ${TOKEN_TTL_MINUTES} minutes. If you didn't request this, ignore it.</p>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}