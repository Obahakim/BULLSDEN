import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key which bypasses Row Level Security.
// Never import this file from a "use client" component — the `server-only`
// import above will throw a build error if you accidentally try to.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key"
);