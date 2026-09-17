import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { newGame } from "../src/lib/server/gameEngine";
import type { ScoreHistoryPage } from "../src/lib/sessionTypes";
import { describeScoreEvent } from "../src/lib/scoreHistory";

const db = new PGlite();
const hash = (name: string) => createHash("sha256").update(name).digest("hex");
type Snapshot = { players: Record<string, unknown>[]; me: { id: string; score: number; version: number; history: ScoreHistoryPage; state: Record<string, unknown> } | null };
before(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["01-session-game.sql", "02-private-score-history.sql", "02-private-score-history.sql"]) {
    await db.exec(readFileSync(new URL(`../supabase/${file}`, import.meta.url), "utf8"));
  }
});
after(async () => { await db.close(); });
async function room(code: string, scores = [100, 200, 0]) {
  await db.query("insert into caro_rooms(code,title) values($1,'History test')", [code]);
  for (const [i, name] of ["An", "Bình", "Chi"].entries()) {
    await db.query("select caro_join($1,$2,$3,$4)", [code,name,hash(name),JSON.stringify(newGame())]);
    await db.query("update caro_players set score=$1 where room_id=(select id from caro_rooms where code=$2) and name=$3", [scores[i],code,name]);
  }
  await db.query("select caro_room_control($1,'start')", [code]);
}
async function snapshot(code: string, name = "") {
  return (await db.query<{ data: Snapshot }>("select caro_snapshot($1,$2) data", [code,hash(name)])).rows[0].data;
}
async function commit(code: string, name: string, score: number, target: string | null = null, effect: string | null = null,
  percent = 50, action = randomUUID(), state: Record<string, unknown> = newGame()) {
  const current = (await snapshot(code,name)).me!;
  return (await db.query<{ data: Snapshot }>("select caro_commit_v2($1,$2,$3,$4,$5,$6,$7,$8,$9) data", [
    code,hash(name),current.version,action,JSON.stringify(state),JSON.stringify({score,wins:0,correct:0,wrong:0,moves:1}),target,effect,percent,
  ])).rows[0].data;
}

test("steal creates personalized two-sided history, actual balances, no duplicate replay", async () => {
  await room("710001");
  const target = (await snapshot("710001","Bình")).me!.id;
  const action = randomUUID();
  const result = await commit("710001","An",100,target,"steal",50,action);
  const victim = (await snapshot("710001","Bình")).me!;
  assert.equal(result.me!.score,200); assert.equal(victim.score,100);
  const own = result.me!.history.events[0], loss = victim.history.events[0];
  assert.equal(own.delta,100); assert.equal(own.balance,200); assert.equal(own.counterpart_name,"Bình");
  assert.equal(loss.delta,-100); assert.equal(loss.balance,100); assert.equal(loss.counterpart_name,"An");
  assert.equal(describeScoreEvent(own),"Bạn đã cướp 100 điểm từ Bình");
  assert.equal(describeScoreEvent(loss),"An đã cướp 100 điểm của bạn");
  assert.equal((await commit("710001","An",100,target,"steal",50,action)).me!.history.total,1);
  await commit("710001","An",230);
  await assert.rejects(commit("710001","An",100,target,"steal",50,action), /VERSION_CONFLICT/);
  assert.equal((await snapshot("710001","Bình")).me!.history.total,1);
});

test("only the owner sees history; spectators, another player/room and DB public roles cannot read it", async () => {
  await room("710002");
  assert.equal((await snapshot("710001","Chi")).me!.history.total,0);
  assert.equal((await snapshot("710002","An")).me!.history.total,0);
  const publicView = await snapshot("710001");
  assert.equal(publicView.me,null);
  for (const player of publicView.players) assert.equal("history" in player,false);
  await assert.rejects(db.query("select caro_history('710001','wrong',null)"), /PLAYER_NOT_FOUND/);
  for (const role of ["anon","authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query("select * from caro_score_events"), /permission denied/);
      await assert.rejects(db.query("select caro_history('710001',$1,null)",[hash("An")]), /permission denied/);
      await assert.rejects(db.query("select caro_commit_v2('710001',$1,0,$2,'{}','{}',null,null,0)",[hash("An"),randomUUID()]), /permission denied/);
    } finally { await db.exec("reset role"); }
  }
});

test("split plus round bonus are separate entries; failure rolls back scores and history", async () => {
  await room("710003",[101,200,0]);
  const target = (await snapshot("710003","Bình")).me!.id;
  const finished = { ...newGame(), stage:"round", result:"lose" };
  const result = (await commit("710003","An",121,target,"split",0,randomUUID(),finished)).me!;
  assert.equal(result.score,171);
  assert.deepEqual(result.history.events.map(e=>[e.kind,e.delta,e.balance]),[["split",50,171],["round",20,121]]);
  const victim = (await snapshot("710003","Bình")).me!;
  assert.equal(victim.score,150); assert.equal(victim.history.events[0].delta,-50);
  const otherRoomTarget = (await snapshot("710002","Chi")).me!.id;
  await assert.rejects(commit("710003","An",999,otherRoomTarget,"steal"), /INVALID_TARGET/);
  const unchanged = (await snapshot("710003","An")).me!;
  assert.equal(unchanged.score,171); assert.equal(unchanged.history.total,2);
});

test("score cap records real received delta, full stolen amount, and zero-impact cards", async () => {
  await room("710004",[999999990,100,0]);
  const target = (await snapshot("710004","Bình")).me!.id;
  const result = (await commit("710004","An",999999990,target,"steal",100)).me!;
  assert.equal(result.history.events[0].delta,10); assert.equal(result.history.events[0].amount,100);
  assert.equal((await snapshot("710004","Bình")).me!.history.events[0].delta,-100);
  await db.query("update caro_players set state=$1 where id=$2", [JSON.stringify({ ...newGame(),stage:"reveal",revealedCard:{kind:"freeze",title:"Đóng băng 8 giây",value:8} }),target]);
  const frozen = (await commit("710004","Bình",0,null,null,0,randomUUID(),{...newGame(),stage:"frozen",frozenUntil:Date.now()+8000})).me!;
  assert.equal(frozen.history.events[0].kind,"card"); assert.equal(frozen.history.events[0].delta,0);
});

test("quiz penalties log even at zero; paginated history remains after room completion", async () => {
  // IDs crossing digit widths must sort numerically, not by their JSON string alias.
  await db.query("select setval('caro_score_events_id_seq',98,true)");
  await room("710005",[0,0,0]);
  const self = (await snapshot("710005","An")).me!;
  await db.query("update caro_players set state=$1 where id=$2",[JSON.stringify({...newGame(),stage:"quiz"}),self.id]);
  await commit("710005","An",0,null,null,0,randomUUID(),{...newGame(),stage:"feedback",feedback:{correct:false}});
  for(let score=1;score<=24;score++) await commit("710005","An",score);
  const first = (await snapshot("710005","An")).me!.history;
  assert.equal(first.total,25); assert.equal(first.events.length,20); assert.ok(first.nextCursor);
  const second = (await db.query<{ data:ScoreHistoryPage }>("select caro_history($1,$2,$3) data",["710005",hash("An"),first.nextCursor])).rows[0].data;
  assert.equal(second.events.length,5); assert.equal(second.nextCursor,null);
  assert.equal(second.events.at(-1)!.kind,"quiz"); assert.equal(second.events.at(-1)!.delta,0);
  assert.equal(new Set([...first.events,...second.events].map(e=>e.id)).size,25);
  await db.query("select caro_room_control('710005','end')");
  const ended=(await snapshot("710005","An")).me!;
  assert.deepEqual(ended.state,{}); assert.equal(ended.history.total,25);
});
