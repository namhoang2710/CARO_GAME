-- Caro rooms v1. Run once in Supabase SQL Editor before deploying the new app.
-- Idempotent; preserves the old scores table and any completed room results.
begin;

create table if not exists public.caro_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  title text not null check (length(title) between 1 and 80),
  status text not null default 'waiting' check (status in ('waiting','active','finished')),
  capacity int not null default 50 check (capacity between 1 and 200),
  duration_minutes int not null default 10 check (duration_minutes between 1 and 120),
  created_at timestamptz not null default now(),
  started_at timestamptz, ends_at timestamptz, ended_at timestamptz,
  revision bigint not null default 0
);
create table if not exists public.caro_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.caro_rooms(id) on delete cascade,
  name text not null check (length(name) between 1 and 28),
  token_hash text not null check (length(token_hash) = 64),
  score int not null default 0 check (score between 0 and 1000000000),
  wins int not null default 0, correct int not null default 0,
  wrong int not null default 0, moves int not null default 0,
  version int not null default 0, state jsonb not null,
  last_action uuid,
  joined_at timestamptz not null default now(), last_seen timestamptz not null default now(),
  unique(room_id, token_hash)
);
create unique index if not exists caro_player_name_unique on public.caro_players(room_id, lower(trim(name)));
create index if not exists caro_player_rank on public.caro_players(room_id, score desc, joined_at, id);
create table if not exists public.caro_rate_limits (
  key text primary key, window_start timestamptz not null, attempts int not null
);

alter table public.caro_rooms enable row level security;
alter table public.caro_players enable row level security;
alter table public.caro_rate_limits enable row level security;
revoke all on public.caro_rooms, public.caro_players, public.caro_rate_limits from anon, authenticated;
-- Only room metadata is public, for filtered Realtime subscriptions.
grant select on public.caro_rooms to anon, authenticated;
drop policy if exists caro_room_read on public.caro_rooms;
create policy caro_room_read on public.caro_rooms for select to anon, authenticated using (true);
grant all on public.caro_rooms, public.caro_players, public.caro_rate_limits to service_role;

create or replace function public.caro_rate_limit(p_key text, p_limit int, p_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into caro_rate_limits as r values (p_key, clock_timestamp(), 1)
  on conflict (key) do update set
    attempts = case when r.window_start < clock_timestamp() - make_interval(secs => p_seconds) then 1 else r.attempts + 1 end,
    window_start = case when r.window_start < clock_timestamp() - make_interval(secs => p_seconds) then clock_timestamp() else r.window_start end
  returning attempts into n;
  delete from caro_rate_limits where window_start < now() - interval '1 day';
  return n <= p_limit;
end $$;

create or replace function public.caro_join(p_code text, p_name text, p_token_hash text, p_state jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare r caro_rooms; pid uuid;
begin
  select * into r from caro_rooms where code = p_code for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  select id into pid from caro_players where room_id = r.id and token_hash = p_token_hash;
  if found then return pid; end if;
  if r.status <> 'waiting' then raise exception 'JOIN_CLOSED'; end if;
  if (select count(*) from caro_players where room_id = r.id) >= r.capacity then raise exception 'ROOM_FULL'; end if;
  if exists(select 1 from caro_players where room_id = r.id and lower(trim(name)) = lower(trim(p_name))) then raise exception 'NAME_TAKEN'; end if;
  insert into caro_players(room_id, name, token_hash, state) values(r.id, trim(p_name), p_token_hash, p_state) returning id into pid;
  update caro_rooms set revision = revision + 1 where id = r.id;
  return pid;
end $$;

create or replace function public.caro_room_control(p_code text, p_action text, p_player_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare r caro_rooms;
begin
  select * into r from caro_rooms where code = p_code for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if p_action = 'start' then
    if r.status <> 'waiting' then raise exception 'INVALID_PHASE'; end if;
    if not exists(select 1 from caro_players where room_id = r.id) then raise exception 'ROOM_EMPTY'; end if;
    update caro_rooms set status = 'active', started_at = clock_timestamp(),
      ends_at = clock_timestamp() + make_interval(mins => duration_minutes), revision = revision + 1 where id = r.id;
  elsif p_action = 'end' then
    update caro_rooms set status = 'finished', ended_at = coalesce(ended_at, clock_timestamp()), revision = revision + 1 where id = r.id;
    update caro_players set state = '{}'::jsonb where room_id = r.id;
  elsif p_action = 'remove' then
    if r.status <> 'waiting' then raise exception 'INVALID_PHASE'; end if;
    delete from caro_players where room_id = r.id and id = p_player_id;
    update caro_rooms set revision = revision + 1 where id = r.id;
  else raise exception 'INVALID_ACTION'; end if;
end $$;

create or replace function public.caro_snapshot(p_code text, p_token_hash text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r caro_rooms; roster jsonb; self jsonb;
begin
  select * into r from caro_rooms where code = p_code;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.status = 'active' and r.ends_at <= clock_timestamp() then
    perform caro_room_control(p_code, 'end');
    select * into r from caro_rooms where code = p_code;
  end if;
  update caro_players set last_seen = clock_timestamp()
    where room_id = r.id and token_hash = p_token_hash and last_seen < now() - interval '20 seconds';
  select coalesce(jsonb_agg(x order by x.score desc, x.joined_at, x.id), '[]'::jsonb) into roster
    from (select id, name, score, wins, correct, wrong, moves, joined_at, last_seen from caro_players where room_id = r.id) x;
  select to_jsonb(p) - 'token_hash' - 'room_id' - 'last_action' into self
    from caro_players p where room_id = r.id and token_hash = p_token_hash;
  return jsonb_build_object('room', to_jsonb(r), 'players', roster, 'me', self, 'serverTime', clock_timestamp());
end $$;

-- All writes for a room are serialized here, so score steals, joins, finish and
-- move commits cannot race. The lock is held only for this short transaction.
create or replace function public.caro_commit(
  p_code text, p_token_hash text, p_version int, p_action_id uuid,
  p_state jsonb, p_stats jsonb, p_target_id uuid default null,
  p_effect text default null, p_percent int default 0
) returns void language plpgsql security definer set search_path = public as $$
declare r caro_rooms; actor caro_players; target caro_players; next_score int; target_score int; amount int;
begin
  select * into r from caro_rooms where code = p_code for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.status <> 'active' or r.ends_at <= clock_timestamp() then raise exception 'GAME_CLOSED'; end if;
  select * into actor from caro_players where room_id = r.id and token_hash = p_token_hash for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if actor.last_action = p_action_id then return; end if;
  if actor.version <> p_version then raise exception 'VERSION_CONFLICT'; end if;
  next_score := greatest(0, least(1000000000, (p_stats->>'score')::bigint))::int;
  if p_target_id is not null then
    if p_target_id = actor.id then raise exception 'INVALID_TARGET'; end if;
    select * into target from caro_players where id = p_target_id and room_id = r.id for update;
    if not found then raise exception 'INVALID_TARGET'; end if;
    if p_effect = 'steal' and p_percent in (30,50,70,100) then
      amount := ceil(target.score::numeric * p_percent / 100)::int;
      target_score := target.score - amount;
      next_score := least(1000000000::bigint, next_score::bigint + amount)::int;
    elsif p_effect = 'split' then
      target_score := floor((actor.score::bigint + target.score) / 2.0)::int;
      -- Preserve any round bonus earned by the bot turn after the chosen card.
      next_score := least(1000000000::bigint, ceil((actor.score::bigint + target.score) / 2.0)::bigint + next_score - actor.score)::int;
    else raise exception 'INVALID_TARGET'; end if;
    update caro_players set score = target_score, version = version + 1 where id = target.id;
  end if;
  update caro_players set score = next_score, state = p_state, version = version + 1, last_action = p_action_id,
    wins = (p_stats->>'wins')::int, correct = (p_stats->>'correct')::int, wrong = (p_stats->>'wrong')::int,
    moves = (p_stats->>'moves')::int, last_seen = clock_timestamp() where id = actor.id;
  if actor.score <> next_score or actor.correct <> (p_stats->>'correct')::int or actor.wrong <> (p_stats->>'wrong')::int or p_target_id is not null then
    update caro_rooms set revision = revision + 1 where id = r.id;
  end if;
end $$;

revoke all on function public.caro_rate_limit(text,int,int), public.caro_join(text,text,text,jsonb),
  public.caro_room_control(text,text,uuid), public.caro_snapshot(text,text),
  public.caro_commit(text,text,int,uuid,jsonb,jsonb,uuid,text,int) from public, anon, authenticated;
grant execute on function public.caro_rate_limit(text,int,int), public.caro_join(text,text,text,jsonb),
  public.caro_room_control(text,text,uuid), public.caro_snapshot(text,text),
  public.caro_commit(text,text,int,uuid,jsonb,jsonb,uuid,text,int) to service_role;

-- Retire anonymous writes to the previous global leaderboard, preserving data.
do $$ declare f record;
begin
  if to_regclass('public.scores') is not null then
    revoke insert, update, delete on public.scores from anon, authenticated;
  end if;
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('upsert_player_score','apply_score_card_target_effect','clear_leaderboard')
  loop execute format('revoke execute on function %s from public, anon, authenticated', f.signature); end loop;
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='caro_rooms'
  ) then alter publication supabase_realtime add table public.caro_rooms; end if;
end $$;
notify pgrst, 'reload schema';
commit;
