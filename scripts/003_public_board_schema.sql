-- Public, no-auth shared board with realtime.

-- Extensions (safe if already enabled)
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Ideas table
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in ('working','closed','future')),
  message_count integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Messages table (no auth, store display name)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  text text not null,
  author_name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.ideas enable row level security;
alter table public.messages enable row level security;

-- Open policies so anon can read/write (public board)
create policy if not exists ideas_public_all on public.ideas
  for all using (true) with check (true);

create policy if not exists messages_public_all on public.messages
  for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.messages;

-- Triggers to maintain message_count
create or replace function public.inc_message_count() returns trigger as $$
begin
  update public.ideas set message_count = message_count + 1 where id = new.idea_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.dec_message_count() returns trigger as $$
begin
  update public.ideas set message_count = greatest(0, message_count - 1) where id = old.idea_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_messages_inc on public.messages;
create trigger trg_messages_inc after insert on public.messages
for each row execute function public.inc_message_count();

drop trigger if exists trg_messages_dec on public.messages;
create trigger trg_messages_dec after delete on public.messages
for each row execute function public.dec_message_count();
