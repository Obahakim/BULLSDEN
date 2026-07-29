import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  created_at: string;
};

export type Market = {
  id: string;
  onchain_market_id: number | null;
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
};
