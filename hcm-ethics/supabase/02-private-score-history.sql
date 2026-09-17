-- Run AFTER 01-session-game.sql, before deploying the history UI.
-- Additive/idempotent. Existing rooms/scores remain intact. No invented backfill.
begin;

create table if not exists public.caro_score_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.caro_rooms(id) on delete cascade,
  player_id uuid not null references public.caro_players(id) on delete cascade,
  action_id uuid not null,
  phase text not null,
  kind text not null,
  label text not null,
  delta int not null,
  balance int not null check (balance between 0 and 1000000000),
  counterpart_name text,
  amount int,
  created_at timestamptz not null default clock_timestamp(),
  unique(player_id, action_id, phase)
);
create index if not exists caro_events_player_page on public.caro_score_events(player_id, id desc);
alter table public.caro_score_events enable row level security;
revoke all on public.caro_score_events from public, anon, authenticated;
revoke all on sequence public.caro_score_events_id_seq from public, anon, authenticated;
grant all on public.caro_score_events to service_role;
grant usage, select on sequence public.caro_score_events_id_seq to service_role;

-- The token identifies the owner; never accept a player id from a browser.
create or replace function public.caro_history(p_code text, p_token_hash text, p_before bigint default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pid uuid; entries jsonb; cursor_id bigint; total_count bigint;
begin
  select p.id into pid from caro_players p join caro_rooms r on r.id=p.room_id
    where r.code=p_code and p.token_hash=p_token_hash;
  if pid is null then raise exception 'PLAYER_NOT_FOUND'; end if;
  select coalesce(jsonb_agg(x order by x.sort_id desc), '[]'::jsonb), min(x.sort_id) into entries, cursor_id
  from (select id::text as id, id as sort_id, kind, label, delta, balance, counterpart_name, amount, created_at
    from caro_score_events where player_id=pid and (p_before is null or id<p_before)
    order by caro_score_events.id desc limit 20) x;
  select coalesce(jsonb_agg(e - 'sort_id'), '[]'::jsonb) into entries from jsonb_array_elements(entries) e;
  select count(*) into total_count from caro_score_events where player_id=pid;
  return jsonb_build_object('events', entries, 'total', total_count, 'nextCursor',
    case when exists(select 1 from caro_score_events where player_id=pid and id<cursor_id) then cursor_id::text else null end);
end $$;

create or replace function public.caro_snapshot(p_code text, p_token_hash text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare r caro_rooms; roster jsonb; self jsonb;
begin
  select * into r from caro_rooms where code=p_code;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.status='active' and r.ends_at<=clock_timestamp() then
    perform caro_room_control(p_code, 'end');
    select * into r from caro_rooms where code=p_code;
  end if;
  update caro_players set last_seen=clock_timestamp()
    where room_id=r.id and token_hash=p_token_hash and last_seen<now()-interval '20 seconds';
  select coalesce(jsonb_agg(x order by x.score desc, x.joined_at, x.id), '[]'::jsonb) into roster
    from (select id, name, score, wins, correct, wrong, moves, joined_at, last_seen from caro_players where room_id=r.id) x;
  select to_jsonb(p) - 'token_hash' - 'room_id' - 'last_action' into self
    from caro_players p where room_id=r.id and token_hash=p_token_hash;
  if self is not null then self := self || jsonb_build_object('history', caro_history(p_code, p_token_hash)); end if;
  return jsonb_build_object('room', to_jsonb(r), 'players', roster, 'me', self, 'serverTime', clock_timestamp());
end $$;

-- Hold the same room lock as the original commit across BOTH score and ledger
-- writes. Return the authoritative snapshot without a third network round trip.
create or replace function public.caro_commit_v2(
  p_code text, p_token_hash text, p_version int, p_action_id uuid,
  p_state jsonb, p_stats jsonb, p_target_id uuid default null,
  p_effect text default null, p_percent int default 0
) returns jsonb language plpgsql security definer set search_path = public as $$
declare r caro_rooms; actor caro_players; other caro_players; saved caro_players;
  base_score int; other_score int; transferred int; reason text; event_kind text; ended boolean;
begin
  select * into r from caro_rooms where code=p_code for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  select * into actor from caro_players where room_id=r.id and token_hash=p_token_hash for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if actor.last_action=p_action_id then return caro_snapshot(p_code,p_token_hash); end if;
  -- An older replay must not create duplicate ledger entries either.
  if exists(select 1 from caro_score_events where player_id=actor.id and action_id=p_action_id) then
    raise exception 'VERSION_CONFLICT';
  end if;
  if p_target_id is not null then
    select * into other from caro_players where id=p_target_id and room_id=r.id;
  end if;
  perform caro_commit(p_code,p_token_hash,p_version,p_action_id,p_state,p_stats,p_target_id,p_effect,p_percent);
  select * into saved from caro_players where id=actor.id;
  base_score := greatest(0,least(1000000000,(p_stats->>'score')::bigint))::int;
  ended := p_state->>'result' is not null and actor.state->>'result' is null;

  event_kind := 'score'; reason := 'Điều chỉnh điểm';
  if actor.state->>'stage'='quiz' and p_state->>'stage'='feedback' then
    event_kind := 'quiz';
    reason := case when (p_state->'feedback'->>'correct')::boolean then 'Trả lời đúng câu hỏi' else 'Trả lời sai · mất 50% điểm' end;
  elsif actor.state->>'stage'='reveal' then
    event_kind := 'card'; reason := coalesce(actor.state->'revealedCard'->>'title','Áp dụng thẻ');
  end if;
  if ended then
    reason := case when event_kind='card' then reason || ' · ' else '' end ||
      case p_state->>'result' when 'win' then 'Thưởng thắng ván' when 'lose' then 'Thưởng kết thúc ván' else 'Thưởng ván hòa' end;
    if event_kind<>'card' then event_kind := 'round'; end if;
  end if;
  if base_score<>actor.score or event_kind in ('quiz','card') then
    insert into caro_score_events(room_id,player_id,action_id,phase,kind,label,delta,balance)
      values(r.id,actor.id,p_action_id,'self',event_kind,reason,base_score-actor.score,base_score);
  end if;
  if p_target_id is not null then
    select score into other_score from caro_players where id=other.id;
    transferred := case when p_effect='steal' then other.score-other_score else abs(other_score-other.score) end;
    insert into caro_score_events(room_id,player_id,action_id,phase,kind,label,delta,balance,counterpart_name,amount) values
      (r.id,actor.id,p_action_id,'transfer',case when p_effect='steal' then 'steal' else 'split' end,
        case when p_effect='steal' then 'Bạn đã cướp điểm' else 'Bạn đã chia đều điểm' end,
        saved.score-base_score,saved.score,other.name,transferred),
      (r.id,other.id,p_action_id,'transfer',case when p_effect='steal' then 'stolen' else 'split_received' end,
        case when p_effect='steal' then 'Bạn bị cướp điểm' else 'Bạn được chia đều điểm' end,
        other_score-other.score,other_score,actor.name,transferred);
  end if;
  return caro_snapshot(p_code,p_token_hash);
end $$;

revoke all on function public.caro_history(text,text,bigint), public.caro_commit_v2(text,text,int,uuid,jsonb,jsonb,uuid,text,int) from public, anon, authenticated;
grant execute on function public.caro_history(text,text,bigint), public.caro_commit_v2(text,text,int,uuid,jsonb,jsonb,uuid,text,int) to service_role;
-- Preserve the existing snapshot's service-only privileges explicitly.
revoke all on function public.caro_snapshot(text,text) from public, anon, authenticated;
grant execute on function public.caro_snapshot(text,text) to service_role;
notify pgrst, 'reload schema';
commit;
