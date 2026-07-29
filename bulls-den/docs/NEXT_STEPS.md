# Current Build Status & Next Steps

## Completed

### On-chain (programs/bulls-den/src/lib.rs)
- Config PDA
- Market + Vault PDAs
- UserPosition PDA (tracks shares_a / shares_b per user per market)
- initialize_config
- create_market (14-day max enforced)
- buy_shares (free entry, creates/updates UserPosition)
- resolve_market (exactly 10% treasury + 2% creator, 88% left in vault)
- claim_winnings (pro-rata claim of 88% by winners, one-time)
- Events + full error set
- Security: vault authority is always the market PDA

### Tests
- tests/bulls-den.ts – money flow test skeleton

### Scripts
- scripts/create-fake-ansem.ts – creates Devnet fake $ANSEM (6 decimals)

### Frontend scaffold (app/)
- package.json with correct dependencies
- lib/constants.ts (env-driven, never hardcodes real mint)
- lib/supabase.ts
- Basic layout with Bull's Den branding
- Home, Create Market, Admin dashboard pages

### Docs
- README.md, SPEC.md, SUPABASE_SCHEMA.sql

## Still needed (priority order)

1. Wire real Anchor IDL after first `anchor build`
2. Implement wallet adapter + buy_shares / claim_winnings client calls
3. Supabase auth (wallet + email verification flow)
4. Full admin pending / resolve / appeals pages with forms
5. On-chain create_market call from admin after approval
6. Price feed or fixed min trade size check
7. Polish UI with the Russian-bar / mechanical bull lore

## How to run locally (on your machine)

```bash
cd bulls-den

# 1. Install Solana + Anchor + Node
# 2. solana config set --url devnet
# 3. Create fake ANSEM:
npx ts-node scripts/create-fake-ansem.ts
# put mint into .env.local

# 4. Build & deploy program
anchor build
anchor deploy

# 5. Frontend
cd app
npm install
npm run dev
```
