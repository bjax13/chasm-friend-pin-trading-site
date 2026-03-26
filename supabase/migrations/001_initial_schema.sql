-- =============================================================================
-- ChasmFriend Pin Trading Site — Initial Schema
-- =============================================================================
-- Tables: profiles, pin_inventory, connect_requests
-- Row Level Security (RLS) is enabled on all tables.
-- Contact info (email, discord_handle, social_handle) is only readable via
-- server-side service-role queries; RLS prevents direct client access.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Extends the built-in auth.users table.
-- discord_handle and social_handle are optional contact details that are
-- only revealed to another user once both parties have a 'connected' request.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  discord_handle text,
  social_handle  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Automatically create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

-- Users can read and update only their own profile.
-- Contact info for other users is exposed exclusively through server-side
-- service-role queries in Server Actions (after checking connect status).
create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No direct insert from the client — the trigger handles it.

-- ---------------------------------------------------------------------------
-- pin_inventory
-- ---------------------------------------------------------------------------
-- One row per (user, pin_name) pair.
-- has_it = true  → user owns this pin and is willing to trade it
-- wants_it = true → user is looking for this pin
-- A row may have both true (owns a duplicate, still wants more) or neither
-- (row exists but user cleared both flags — effectively a no-op row).
-- Valid pin_name values: Howlerina | Shredhead | Burpslurper | Cleverclaws | Darren
-- ---------------------------------------------------------------------------
create table if not exists public.pin_inventory (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  pin_name   text not null,
  has_it     boolean not null default false,
  wants_it   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pin_inventory_user_pin_unique unique (user_id, pin_name),
  constraint pin_inventory_pin_name_check check (
    pin_name in ('Howlerina', 'Shredhead', 'Burpslurper', 'Cleverclaws', 'Darren')
  )
);

create index if not exists pin_inventory_user_id_idx on public.pin_inventory (user_id);
create index if not exists pin_inventory_has_it_idx   on public.pin_inventory (pin_name, has_it)  where has_it = true;
create index if not exists pin_inventory_wants_it_idx on public.pin_inventory (pin_name, wants_it) where wants_it = true;

drop trigger if exists pin_inventory_updated_at on public.pin_inventory;
create trigger pin_inventory_updated_at
  before update on public.pin_inventory
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.pin_inventory enable row level security;

-- Users can read and write only their own inventory rows.
create policy "pin_inventory: owner select"
  on public.pin_inventory for select
  using (auth.uid() = user_id);

create policy "pin_inventory: owner insert"
  on public.pin_inventory for insert
  with check (auth.uid() = user_id);

create policy "pin_inventory: owner update"
  on public.pin_inventory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pin_inventory: owner delete"
  on public.pin_inventory for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- connect_requests
-- ---------------------------------------------------------------------------
-- Tracks the two-sided opt-in consent flow between two users.
-- Flow: requester sends a request (status = 'pending')
--       recipient accepts (status = 'connected') or declines/requester cancels (status = 'cancelled')
-- Contact info is only exposed when status = 'connected'.
-- A pair may have at most one non-cancelled request at a time (enforced by
-- the partial unique index below).
-- ---------------------------------------------------------------------------
create table if not exists public.connect_requests (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint connect_requests_no_self_connect check (requester_id <> recipient_id),
  constraint connect_requests_status_check check (
    status in ('pending', 'connected', 'cancelled')
  )
);

-- Prevent duplicate active requests between the same pair (in either direction).
create unique index if not exists connect_requests_active_pair_idx
  on public.connect_requests (
    least(requester_id::text, recipient_id::text),
    greatest(requester_id::text, recipient_id::text)
  )
  where status <> 'cancelled';

create index if not exists connect_requests_requester_idx on public.connect_requests (requester_id);
create index if not exists connect_requests_recipient_idx on public.connect_requests (recipient_id);
create index if not exists connect_requests_status_idx    on public.connect_requests (status);

drop trigger if exists connect_requests_updated_at on public.connect_requests;
create trigger connect_requests_updated_at
  before update on public.connect_requests
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.connect_requests enable row level security;

-- A user can see requests where they are the requester or the recipient.
create policy "connect_requests: participant select"
  on public.connect_requests for select
  using (
    auth.uid() = requester_id
    or auth.uid() = recipient_id
  );

-- Only the requester can create a new request.
create policy "connect_requests: requester insert"
  on public.connect_requests for insert
  with check (auth.uid() = requester_id);

-- Both participants can update the request (recipient accepts/declines,
-- requester cancels). Status transitions are enforced in the Server Action.
create policy "connect_requests: participant update"
  on public.connect_requests for update
  using (
    auth.uid() = requester_id
    or auth.uid() = recipient_id
  );

-- Soft-delete via status = 'cancelled'; no hard deletes from the client.
-- (Hard deletes are only performed via service-role if ever needed.)
