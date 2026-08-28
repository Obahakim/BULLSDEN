import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Guarded: if env vars are missing (e.g. first `npm run dev` before Supabase is
// set up), the app still boots. Calls that hit the client will just fail loudly
// instead of crashing the whole dev server on import.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export type UserRow = {
  id: string;
  wallet_address: string;
  email: string | null;
  email_verified: boolean;
  created_at: string;
};

export type MarketSubmission = {
  id: string;
  creator_wallet: string;
  title: string;
  description: string | null;
  outcome_a: string;
  outcome_b: string;
  deadline: string;
  image_url: string | null;
  status: "pending" | "approved" | "denied";
  admin_notes: string | null;
  created_at: string;
};

export type MarketRow = {
  id: string;
  onchain_market_id: number | null;
  onchain_address: string | null;
  creator_wallet: string;
  title: string;
  description: string | null;
  outcome_a: string;
  outcome_b: string;
  deadline: string;
  image_url: string | null;
  status: "open" | "resolved" | "cancelled";
  winning_outcome: number | null;
  total_a: number;
  total_b: number;
  created_at: string;
};