/**
 * Creates a fake $ANSEM mint on Devnet for testing.
 * Run with: npx ts-node scripts/create-fake-ansem.ts
 *
 * Then put the printed mint address into .env.local as NEXT_PUBLIC_ANSEM_MINT
 */
import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Load local wallet
  const keypairPath = path.join(os.homedir(), ".config/solana/id.json");
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  console.log("Payer:", payer.publicKey.toBase58());

  // Create mint with 6 decimals (same as real $ANSEM)
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null,            // freeze authority
    6
  );

  console.log("\n=== FAKE $ANSEM CREATED ===");
  console.log("Mint address:", mint.toBase58());
  console.log("Decimals: 6");
  console.log("\nAdd this to your .env.local:");
  console.log(`NEXT_PUBLIC_ANSEM_MINT=${mint.toBase58()}`);

  // Create ATA for payer and mint 1_000_000 tokens
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  await mintTo(
    connection,
    payer,
    mint,
    ata.address,
    payer,
    1_000_000_000_000 // 1,000,000 tokens (with 6 decimals)
  );

  console.log("Minted 1,000,000 fake $ANSEM to", ata.address.toBase58());
  console.log("\nDone. Use this mint for all Devnet testing.");
}

main().catch(console.error);
