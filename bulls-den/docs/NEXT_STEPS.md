# Current Build Status & Next Steps

## Completed

### On-chain (programs/bulls-den/src/lib.rs)
- Config PDA, Market + Vault PDAs, UserPosition PDA
- initialize_config, create_market, buy_shares, resolve_market, claim_winnings
- Events + full error set. Vault authority is always the market PDA.
- Anchor.toml moved to repo root (was misplaced), added root Cargo.toml workspace
  so `anchor build` / `anchor test` work out of the box.

### IDL
- Hand-written `target/idl/bulls_den.json` + `app/lib/idl.ts`, matching lib.rs
  instruction/account/event discriminators exactly. Once you run `anchor build`
  on your machine, overwrite these with the real generated files — the hand
  version is only a stand-in so the frontend has real types to compile against
  right now.

### Frontend (app/)
- next.config.js, tsconfig.json, tailwind.config.js, postcss.config.js added
  (were missing — `npm run dev` would not have booted before).
- Wallet adapter wired up (Phantom + Solflare) with a connect button in the header.
- lib/program.ts: Anchor Program helper + PDA derivation functions.
- Home page: loads open markets from Supabase, "Buy Shares" opens a modal that
  calls the real `buy_shares` on-chain instruction.
- Create page: wallet-gated form that inserts into `market_submissions`.
- Admin page: lists pending submissions (Approve calls `create_market` on-chain
  then inserts into `markets`; Deny just updates status) and markets past
  deadline (buttons call `resolve_market` on-chain).
- lib/supabase.ts no longer crashes the app if env vars are missing — it shows
  an inline warning banner instead.
- `npm run build` passes cleanly (verified).

## Still needed (priority order)

1. Run `anchor build` on your machine (needs Solana + Anchor CLI, not available
   in this sandbox) and swap in the real IDL/program id.
2. Supabase auth (wallet + email verification flow) — currently anyone with a
   wallet can submit/approve is gated by comparing to NEXT_PUBLIC_ADMIN_AUTHORITY
   client-side only. Add server-side RLS policies before mainnet.
3. Appeals page (schema exists, no UI yet).
4. Price feed / min trade size enforcement (SPEC.md mentions MIN_TRADE_USD; not
   enforced on-chain or in the UI yet).
5. Polish UI with the Russian-bar / mechanical bull lore.

## How to run locally today

```bash
# 1. Frontend only (fastest path to `npm run dev` working):
cd app
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at minimum
npm run dev
# open http://localhost:3000 — you'll see the UI and can connect a wallet,
# but on-chain buttons will fail until the program below is deployed.

# 2. Supabase: create a project at supabase.com, then run docs/SUPABASE_SCHEMA.sql
#    in its SQL editor. Copy the Project URL + anon key into app/.env.local.

# 3. On-chain program (needs Solana CLI + Anchor CLI installed locally):
solana-install init 1.18.20   # or your preferred version
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1 && avm use 0.30.1
solana config set --url devnet
solana-keygen new             # if you don't have a devnet wallet yet
solana airdrop 2

cd .. # repo root (where Anchor.toml lives)
anchor build
anchor keys list              # copy the new program id
# paste it into declare_id!() in programs/bulls-den/src/lib.rs
# and into NEXT_PUBLIC_PROGRAM_ID in app/.env.local, then:
anchor build && anchor deploy

# Copy the freshly generated target/idl/bulls_den.json over the hand-written
# one, and regenerate app/lib/idl.ts from it (or import target/idl directly).

# 4. Fake $ANSEM for devnet testing:
npx ts-node scripts/create-fake-ansem.ts
# put the printed mint into NEXT_PUBLIC_ANSEM_MINT in app/.env.local

# 5. Restart `npm run dev` — buy/resolve buttons will now hit the real program.
```
