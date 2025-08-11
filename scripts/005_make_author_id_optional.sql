-- Make ideas.author_id optional for a public, no-auth board.
-- This prevents NOT NULL violations when inserting without an auth context.

do $$
begin
  -- Only run if the column exists.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'ideas'
      and column_name  = 'author_id'
  ) then
    -- Drop DEFAULT (commonly auth.uid()) so it won't try to insert null.
    execute 'alter table public.ideas alter column author_id drop default';
    -- Allow NULL values.
    execute 'alter table public.ideas alter column author_id drop not null';
  end if;
end$$;

-- Optional: ensure public read/write policies are applied (keeps your board open).
drop policy if exists ideas_public_all on public.ideas;
create policy ideas_public_all on public.ideas
  for all using (true) with check (true);
