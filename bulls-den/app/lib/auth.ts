import "server-only";
import crypto from "crypto";

// Falls back to an insecure dev default so the app doesn't crash if you forget
// to set this — but ALWAYS set SESSION_SECRET to a long random string in
// .env.local before this touches anything beyond your own local testing.
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SESSION_COOKIE = "rbd_session";

export function buildSignInMessage(wallet: string, nonce: string): string {
  return [
    "RebelBulls Den wants you to sign in with your Solana wallet.",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    "",
    "This is a free signature — it does not trigger a transaction or cost any fees.",
  ].join("\n");
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionToken(wallet: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ wallet, exp })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): { wallet: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (hmac(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.wallet || !data.exp || Date.now() > data.exp) return null;
    return { wallet: data.wallet as string };
  } catch {
    return null;
  }
}

// --- IP allowlist placeholder -----------------------------------------
// Not enforced yet (per instructions — don't lock to an IP until asked).
// Wired into /api/admin so flipping it on later is a one-line change:
// just fill ALLOWED_ADMIN_IPS and flip REQUIRE_IP_ALLOWLIST to true.
const REQUIRE_IP_ALLOWLIST = false;
const ALLOWED_ADMIN_IPS: string[] = [];

export function isAllowedAdminIp(ip: string | null): boolean {
  if (!REQUIRE_IP_ALLOWLIST) return true;
  return !!ip && ALLOWED_ADMIN_IPS.includes(ip);
}