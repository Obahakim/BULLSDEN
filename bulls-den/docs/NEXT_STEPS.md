
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

### Rust / Anchor toolchain note

This directory (`bulls-den/`) is the Anchor workspace; the repository parent is
not. Run `anchor` commands from this directory, where `Anchor.toml` and the
workspace `Cargo.toml` live.

`Cargo.lock` uses lockfile format v4, which is correct for current Cargo.
Do not downgrade it to support an old Anchor/Solana build toolchain. Instead,
upgrade the Anchor CLI, the Anchor Rust and TypeScript packages, and the
Solana/Agave toolchain as one tested set, then regenerate the lockfile with
that toolchain:

```bash
# Run after updating the toolchain and Anchor dependencies together.
rm -f Cargo.lock programs/bulls-den/Cargo.lock
cargo generate-lockfile
anchor build
```

If `anchor build` still reports that v4 requires `-Znext-lockfile-bump`, the
installed Anchor/Solana compiler is older than the lockfile. Upgrade that
compiler; do not edit the generated lockfile header by hand.

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