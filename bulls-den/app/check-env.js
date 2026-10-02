const { PublicKey } = require("@solana/web3.js");

// Vercel and Next.js provide environment variables through process.env.
// Run this checker from the app with Node's --env-file flag when local files
// need to be loaded; production values must come from Vercel project variables.

const vars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_PROGRAM_ID",
  "NEXT_PUBLIC_ANSEM_MINT",
  "NEXT_PUBLIC_TREASURY_WALLET",
  "NEXT_PUBLIC_ADMIN_AUTHORITY",
];

for (const name of vars) {
  const val = process.env[name];
  if (!val) {
    console.log(`❌ ${name} is EMPTY/UNSET`);
    continue;
  }
  try {
    new PublicKey(val);
    console.log(`✅ ${name} = ${val}  (valid)`);
  } catch (e) {
    console.log(`❌ ${name} = "${val}"  →  ${e.message}`);
  }
}
