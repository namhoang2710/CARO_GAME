import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { newGame } from "../src/lib/server/gameEngine";

const db = new PGlite();
const state = newGame();
const hash = (name: string) => createHash("sha256").update(name).digest("hex");
const sql = readFileSync(new URL("../supabase/01-session-game.sql", import.meta.url), "utf8");
before(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(sql);
  await db.exec(sql); // Migration must be safe to re-run.
  const history = readFileSync(new URL("../supabase/02-private-score-history.sql", import.meta.url), "utf8");
  await db.exec(history);
  await db.exec(history);
});
after(async () => { await db.close(); });
async function create(code: string, capacity = 2) {
  await db.query("insert into caro_rooms(code,title,capacity,duration_minutes) values($1,'Test room',$2,10)", [code, capacity]);
}
async function join(code: string, name: string) {
  const r = await db.query<{ id: string }>("select caro_join($1,$2,$3,$4) as id", [code, name, hash(name), JSON.stringify(state)]);
  return r.rows[0].id;
}
async function snap(code: string, name = "") {
  const r = await db.query<{ data: { room: { status: string }; players: { id: string; score: number }[]; me: { version: number; score: number; state: unknown } | null } }>("select caro_snapshot($1,$2) as data", [code, hash(name)]);
  return r.rows[0].data;
}
async function commit(code: string, name: string, score: number, version: number, target: string | null = null, effect: string | null = null, actionId = randomUUID()) {
  await db.query("select caro_commit($1,$2,$3,$4,$5,$6,$7,$8,50)", [code, hash(name), version, actionId, JSON.stringify(state), JSON.stringify({ score, wins: 0, correct: 0, wrong: 0, moves: 1 }), target, effect]);
}

test("capacity, duplicate names, join/start race boundary and session isolation", async () => {
  await create("111111"); await create("222222");
  await join("111111", "An"); await join("111111", "Binh");
  await assert.rejects(join("111111", "Chi"), /ROOM_FULL/);
  await assert.rejects(commit("111111", "An", 100, 0), /GAME_CLOSED/);
  await join("222222", "An");
  await assert.rejects(join("222222", "an"), /NAME_TAKEN/);
  await db.query("select caro_room_control('111111','start')");
  await assert.rejects(join("111111", "New"), /JOIN_CLOSED/);
  await join("111111", "An"); // A valid participant can reconnect after start.
  assert.equal((await snap("222222")).players.length, 1);
  assert.equal((await snap("111111", "wrong-token")).me, null);
});

test("steal is atomic, stale writes/repeated requests cannot overwrite scores", async () => {
  await create("333333");
  await join("333333", "Player"); const target = await join("333333", "Target");
  await db.query("select caro_room_control('333333','start')");
  await commit("333333", "Player", 100, 0); await commit("333333", "Target", 200, 0);
  const action = randomUUID();
  await commit("333333", "Player", 100, 1, target, "steal", action);
  assert.equal((await snap("333333", "Player")).me?.score, 200);
  assert.equal((await snap("333333", "Target")).me?.score, 100);
  await commit("333333", "Player", 100, 1, target, "steal", action);
  assert.equal((await snap("333333", "Target")).me?.score, 100);
  await assert.rejects(commit("333333", "Target", 200, 1), /VERSION_CONFLICT/);
  const other = (await snap("222222")).players[0].id;
  await assert.rejects(commit("333333", "Player", 200, 2, other, "steal"), /INVALID_TARGET/);
});

test("end locks gameplay, frees private board, and retains final leaderboard", async () => {
  await create("444444"); await join("444444", "Final");
  await db.query("select caro_room_control('444444','start')");
  await commit("444444", "Final", 300, 0);
  await db.query("select caro_room_control('444444','end')");
  await assert.rejects(commit("444444", "Final", 400, 1), /GAME_CLOSED/);
  const final = await snap("444444", "Final");
  assert.equal(final.room.status, "finished"); assert.equal(final.me?.score, 300); assert.deepEqual(final.me?.state, {});
});

test("server deadline rejects writes even if no admin/browser is present", async () => {
  await create("555555"); await join("555555", "Timeout");
  await db.query("select caro_room_control('555555','start')");
  await db.query("update caro_rooms set ends_at=now()-interval '1 second' where code='555555'");
  await assert.rejects(commit("555555", "Timeout", 1000, 0), /GAME_CLOSED/);
  assert.equal((await snap("555555")).room.status, "finished");
});

test("anon cannot read tokens/state, submit scores or control rooms", async () => {
  await db.exec("set role anon");
  try {
    await assert.rejects(db.query("select * from caro_players"), /permission denied/);
    await assert.rejects(db.query("select caro_room_control('111111','end')"), /permission denied/);
    await assert.rejects(db.query("select caro_snapshot('111111','')"), /permission denied/);
    await assert.rejects(db.query("update caro_rooms set status='finished'"), /permission denied/);
    const publicRooms = await db.query("select code,status from caro_rooms");
    assert.ok(publicRooms.rows.length);
  } finally { await db.exec("reset role"); }
});
