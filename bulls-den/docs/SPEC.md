# Bull's Den – Full Build Spec (Source of Truth)

## 1. Product
Moderated $ANSEM-only shared-pot binary prediction market on Solana.

## 2. Money Flow (Exact)

- User buys shares → $ANSEM transferred into market vault PDA. No fee taken.
- At resolution (admin only):
  - total = vault balance
  - 10% → treasury_token_account
  - 2% → creator_token_account
  - 88% → distributed pro-rata to all winning share holders
- Program enforces the split. No other path exists to move funds out of vaults.

## 3. On-Chain Accounts

### Config (PDA)
- Seeds: ["config"]
- Fields: admin, treasury, ansem_mint, bump, fee_bps (locked 1000/200 or hardcoded), paused

### Market (PDA)
- Seeds: ["market", market_id or creator + nonce]
- Fields: creator, outcome_a, outcome_b, deadline, status (Open/Resolved/Cancelled), total_a, total_b, vault_bump, winning_outcome, etc.

### User Shares (PDA or token accounts)
- Track how many shares of each outcome a user holds for a market.

### Vault
- Token account owned by market PDA (or separate vault PDA) holding the $ANSEM.

## 4. Instructions (Minimum)

1. `initialize_config` – one-time, sets admin + treasury + allowed mint
2. `create_market` – called after admin approval (backend or admin key)
3. `buy_shares` – user deposits $ANSEM, receives shares of chosen outcome
4. `resolve_market` – admin only. Sets winner, executes 10/2/88 transfers, marks resolved
5. (Optional later) `cancel_market` / refund if zero volume

## 5. Admin Dashboard (Supabase)

- Pending submissions → Approve (rich edit form) or Deny (email reason)
- Resolve section (past deadline markets)
- Appeals section
- Logs / audit

## 6. Frontend Requirements

- Connect wallet
- Verify email (for creators)
- Create market form
- Browse live markets
- Buy shares UI
- Profile / my positions
- Appeal form

## 7. Environment Variables (Critical for Devnet ↔ Mainnet)

NEXT_PUBLIC_SOLANA_NETWORK=devnet|mainnet-beta
NEXT_PUBLIC_RPC_URL=...
NEXT_PUBLIC_ANSEM_MINT=...          # fake on devnet, real on mainnet
NEXT_PUBLIC_PROGRAM_ID=...
NEXT_PUBLIC_TREASURY_WALLET=...
NEXT_PUBLIC_ADMIN_AUTHORITY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# etc.

Never hardcode the real $ANSEM mint or mainnet addresses in source.
