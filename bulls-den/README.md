# Bull's Den

**$ANSEM-only moderated prediction market on Solana.**

Bull's Den is a curated shared-pot prediction game. Users submit markets → Admin reviews & approves → Users buy Yes/No shares exclusively with $ANSEM → Admin resolves → 10% treasury + 2% creator + 88% winners (pro-rata).

## Locked Rules (Do not change without discussion)

- Token: **Only $ANSEM**
- Entry fee: **Free**
- Settlement fees (taken once at resolution):
  - 10% → Platform treasury
  - 2% → Market creator
  - 88% → Winning share holders (pro-rata)
- Max duration: **14 days**
- Min trade size: ~$2 equivalent in $ANSEM
- Markets: Binary only (v1)
- Creation requires: Wallet + verified email
- Resolution: Fully admin-controlled
- Funds: Always held in Program Derived Address (PDA) vaults. Admin cannot arbitrarily withdraw.

## Project Structure

```
bulls-den/
├── programs/bulls-den/     # Anchor program (Rust)
├── app/                    # Next.js frontend + admin
├── scripts/                # Devnet helpers (fake $ANSEM, init config)
├── docs/                   # Specs, schema, etc.
└── README.md
```

## Development Strategy (Devnet → Mainnet)

1. Develop & test everything on **Devnet** using a **fake $ANSEM** mint.
2. All mint addresses, RPC, program IDs, treasury, admin are read from environment / on-chain Config PDA.
3. When ready for mainnet: change env vars + deploy program + initialize real Config. No code changes required.

## Security Model (Non-negotiable)

- All user $ANSEM sits in market-specific token vaults owned by the program (PDAs).
- Only the program logic can move tokens out.
- `resolve` instruction enforces the exact 10/2/88 split. No other withdrawal path exists.
- Admin authority is limited to calling `resolve` (preferably behind multi-sig later).
- Backend (Supabase) never holds private keys that can touch pool funds.

## Current Status

Project scaffold started. Core on-chain program and configuration coming next.
