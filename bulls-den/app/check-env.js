const { PublicKey } = require("@solana/web3.js");
require("dotenv").config({ path: ".env.local" });

const vars = [
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