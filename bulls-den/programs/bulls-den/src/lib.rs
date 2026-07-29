use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Bu11sDen11111111111111111111111111111111111"); // Replace after first deploy

pub const CONFIG_SEED: &[u8] = b"config";
pub const MARKET_SEED: &[u8] = b"market";
pub const VAULT_SEED: &[u8] = b"vault";
pub const POSITION_SEED: &[u8] = b"position";

// Fees in basis points (10000 = 100%)
// 10% = 1000 bps, 2% = 200 bps, 88% = 8800 bps
pub const TREASURY_FEE_BPS: u16 = 1000;
pub const CREATOR_FEE_BPS: u16 = 200;

#[program]
pub mod bulls_den {
    use super::*;

    /// One-time initialization of global config.
    /// Sets the only allowed $ANSEM mint, treasury, and admin.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.treasury = treasury;
        config.ansem_mint = ctx.accounts.ansem_mint.key();
        config.bump = ctx.bumps.config;
        config.paused = false;
        msg!("Bull's Den config initialized. Mint: {}", config.ansem_mint);
        Ok(())
    }

    /// Create a new market (called after admin approval offline).
    /// Creates market PDA + token vault that will hold all $ANSEM.
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        outcome_a: String,
        outcome_b: String,
        deadline: i64,
    ) -> Result<()> {
        require!(outcome_a.len() <= 64, ErrorCode::StringTooLong);
        require!(outcome_b.len() <= 64, ErrorCode::StringTooLong);
        let now = Clock::get()?.unix_timestamp;
        require!(deadline > now, ErrorCode::InvalidDeadline);
        require!(
            deadline <= now + 14 * 24 * 60 * 60,
            ErrorCode::DeadlineTooFar
        );

        let market = &mut ctx.accounts.market;
        market.market_id = market_id;
        market.creator = ctx.accounts.creator.key();
        market.outcome_a = outcome_a;
        market.outcome_b = outcome_b;
        market.deadline = deadline;
        market.total_a = 0;
        market.total_b = 0;
        market.status = MarketStatus::Open;
        market.winning_outcome = None;
        market.winners_pool = 0;
        market.bump = ctx.bumps.market;
        market.vault_bump = ctx.bumps.vault;

        msg!("Market {} created by {}", market_id, market.creator);
        Ok(())
    }

    /// User buys shares of one outcome. $ANSEM moves into the market vault.
    /// No fee is taken at entry. Creates or updates UserPosition PDA.
    pub fn buy_shares(
        ctx: Context<BuyShares>,
        amount: u64,
        outcome: u8, // 0 = A, 1 = B
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(outcome <= 1, ErrorCode::InvalidOutcome);

        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(
            Clock::get()?.unix_timestamp < market.deadline,
            ErrorCode::MarketExpired
        );

        // Transfer $ANSEM from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
        )?;

        // Update market totals
        if outcome == 0 {
            market.total_a = market.total_a.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        } else {
            market.total_b = market.total_b.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        }

        // Update or init user position
        let position = &mut ctx.accounts.position;
        if position.user == Pubkey::default() {
            // First time for this user on this market
            position.user = ctx.accounts.user.key();
            position.market_id = market.market_id;
            position.shares_a = 0;
            position.shares_b = 0;
            position.claimed = false;
            position.bump = ctx.bumps.position;
        }

        if outcome == 0 {
            position.shares_a = position.shares_a.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        } else {
            position.shares_b = position.shares_b.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        }

        emit!(BuyEvent {
            market_id: market.market_id,
            user: ctx.accounts.user.key(),
            amount,
            outcome,
        });

        Ok(())
    }

    /// Admin resolves the market.
    /// Pays 10% to treasury + 2% to creator immediately.
    /// Remaining 88% stays in vault for winners to claim via claim_winnings.
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winning_outcome: u8,
    ) -> Result<()> {
        require!(winning_outcome <= 1, ErrorCode::InvalidOutcome);

        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(
            Clock::get()?.unix_timestamp >= market.deadline,
            ErrorCode::TooEarlyToResolve
        );

        let total = ctx.accounts.vault.amount;
        require!(total > 0, ErrorCode::EmptyVault);

        let treasury_amount = (total as u128)
            .checked_mul(TREASURY_FEE_BPS as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let creator_amount = (total as u128)
            .checked_mul(CREATOR_FEE_BPS as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let winners_pool = total
            .checked_sub(treasury_amount)
            .ok_or(ErrorCode::Overflow)?
            .checked_sub(creator_amount)
            .ok_or(ErrorCode::Overflow)?;

        // 10% → treasury
        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.treasury_token_account,
            &ctx.accounts.market.to_account_info(),
            &ctx.accounts.token_program,
            treasury_amount,
            market.market_id,
            market.vault_bump,
        )?;

        // 2% → creator
        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.creator_token_account,
            &ctx.accounts.market.to_account_info(),
            &ctx.accounts.token_program,
            creator_amount,
            market.market_id,
            market.vault_bump,
        )?;

        market.status = MarketStatus::Resolved;
        market.winning_outcome = Some(winning_outcome);
        market.winners_pool = winners_pool;

        emit!(ResolveEvent {
            market_id: market.market_id,
            winning_outcome,
            total,
            treasury_amount,
            creator_amount,
            winners_pool,
        });

        Ok(())
    }

    /// Winner claims their pro-rata share of the 88% winners_pool.
    /// Can only be called once per position after market is resolved.
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        require!(market.status == MarketStatus::Resolved, ErrorCode::MarketNotResolved);
        require!(market.winning_outcome.is_some(), ErrorCode::NoWinningOutcome);

        let position = &mut ctx.accounts.position;
        require!(!position.claimed, ErrorCode::AlreadyClaimed);
        require!(position.user == ctx.accounts.user.key(), ErrorCode::Unauthorized);

        let winning_outcome = market.winning_outcome.unwrap();
        let user_winning_shares = if winning_outcome == 0 {
            position.shares_a
        } else {
            position.shares_b
        };

        require!(user_winning_shares > 0, ErrorCode::NoWinningShares);

        let total_winning_shares = if winning_outcome == 0 {
            market.total_a
        } else {
            market.total_b
        };

        require!(total_winning_shares > 0, ErrorCode::NoWinningShares);

        // Pro-rata: (user_shares / total_winning_shares) * winners_pool
        let claim_amount = (user_winning_shares as u128)
            .checked_mul(market.winners_pool as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(total_winning_shares as u128)
            .ok_or(ErrorCode::Overflow)? as u64;

        require!(claim_amount > 0, ErrorCode::ZeroClaim);

        // Transfer from vault to user
        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.user_token_account,
            &ctx.accounts.market.to_account_info(),
            &ctx.accounts.token_program,
            claim_amount,
            market.market_id,
            market.vault_bump,
        )?;

        position.claimed = true;

        emit!(ClaimEvent {
            market_id: market.market_id,
            user: ctx.accounts.user.key(),
            amount: claim_amount,
        });

        Ok(())
    }
}

// ========== Helper ==========
fn transfer_from_vault<'info>(
    vault: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    market: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
    market_id: u64,
    vault_bump: u8,
) -> Result<()> {
    let seeds = &[
        VAULT_SEED,
        &market_id.to_le_bytes(),
        &[vault_bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: vault.to_account_info(),
        to: to.to_account_info(),
        authority: market.clone(),
    };
    token::transfer(
        CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, signer),
        amount,
    )?;
    Ok(())
}

// ========== Accounts ==========

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub ansem_mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = payer,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, &market_id.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = payer,
        token::mint = ansem_mint,
        token::authority = market,
        seeds = [VAULT_SEED, &market_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    pub ansem_mint: Account<'info, Mint>,
    /// CHECK: Creator receives 2% fee
    pub creator: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, outcome: u8)]
pub struct BuyShares<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [VAULT_SEED, &market.market_id.to_le_bytes()],
        bump = market.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, UserPosition>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [VAULT_SEED, &market.market_id.to_le_bytes()],
        bump = market.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [VAULT_SEED, &market.market_id.to_le_bytes()],
        bump = market.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        has_one = user
    )]
    pub position: Account<'info, UserPosition>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ========== State ==========

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub ansem_mint: Pubkey,
    pub bump: u8,
    pub paused: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub market_id: u64,
    pub creator: Pubkey,
    #[max_len(64)]
    pub outcome_a: String,
    #[max_len(64)]
    pub outcome_b: String,
    pub deadline: i64,
    pub total_a: u64,
    pub total_b: u64,
    pub status: MarketStatus,
    pub winning_outcome: Option<u8>,
    pub winners_pool: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,
    pub market_id: u64,
    pub shares_a: u64,
    pub shares_b: u64,
    pub claimed: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,
    Resolved,
    Cancelled,
}

// ========== Events ==========

#[event]
pub struct BuyEvent {
    pub market_id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub outcome: u8,
}

#[event]
pub struct ResolveEvent {
    pub market_id: u64,
    pub winning_outcome: u8,
    pub total: u64,
    pub treasury_amount: u64,
    pub creator_amount: u64,
    pub winners_pool: u64,
}

#[event]
pub struct ClaimEvent {
    pub market_id: u64,
    pub user: Pubkey,
    pub amount: u64,
}

// ========== Errors ==========

#[error_code]
pub enum ErrorCode {
    #[msg("String too long")]
    StringTooLong,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Deadline more than 14 days away")]
    DeadlineTooFar,
    #[msg("Amount must be > 0")]
    ZeroAmount,
    #[msg("Invalid outcome (must be 0 or 1)")]
    InvalidOutcome,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market has expired")]
    MarketExpired,
    #[msg("Too early to resolve")]
    TooEarlyToResolve,
    #[msg("Vault is empty")]
    EmptyVault,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Market is not resolved")]
    MarketNotResolved,
    #[msg("No winning outcome set")]
    NoWinningOutcome,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("No winning shares")]
    NoWinningShares,
    #[msg("Claim amount is zero")]
    ZeroClaim,
}
