-- Bull's Den Supabase Schema

-- Users (wallet + verified email required for creating markets)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  email text unique,
  email_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Market submissions (before admin approval)
create table public.market_submissions (
  id uuid primary key default gen_random_uuid(),
  creator_wallet text not null references public.users(wallet_address),
  title text not null,
  description text,
  outcome_a text not null,
  outcome_b text not null,
  deadline timestamptz not null,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  admin_notes text,
  created_at timestamptz default now()
);

-- Live / resolved markets (synced with on-chain)
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  onchain_market_id bigint unique,
  onchain_address text,
  creator_wallet text not null,
  title text not null,
  description text,
  outcome_a text not null,
  outcome_b text not null,
  deadline timestamptz not null,
  image_url text,
  status text not null default 'open' check (status in ('open', 'resolved', 'cancelled')),
  winning_outcome smallint, -- 0 or 1
  total_a numeric default 0,
  total_b numeric default 0,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Appeals
create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id),
  submitter_wallet text not null,
  reason text not null,
  evidence_url text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_response text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Resolution audit log
create table public.resolution_logs (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id),
  resolved_by text not null,
  winning_outcome smallint not null,
  total_pool numeric,
  treasury_amount numeric,
  creator_amount numeric,
  winners_pool numeric,
  tx_signature text,
  created_at timestamptz default now()
);

-- Enable RLS later as needed
-- Basic indexes
create index on public.market_submissions (status);
create index on public.markets (status, deadline);
create index on public.appeals (status);
