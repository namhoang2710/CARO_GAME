import { playerToken, limitRequest, tokenHash } from "@/lib/server/auth";
import { ApiError, checkDatabase, database, failure, readBody, respond, roomCode, uuid } from "@/lib/server/database";
import { advanceGame, newGame, publicGame, type GameState } from "@/lib/server/gameEngine";
import type { GameAction, Participant, Room, RoomSnapshot, ScoreHistoryPage } from "@/lib/sessionTypes";

export const runtime = "nodejs";
// Keep game actions close to the project's Supabase database (Tokyo).
export const preferredRegion = "hnd1";
export const dynamic = "force-dynamic";
type RawSnapshot = { room: Room; players: Participant[]; serverTime: string;
  me: (Participant & { version: number; state: GameState; history?: ScoreHistoryPage }) | null };

async function snapshot(code: string, hash: string): Promise<RawSnapshot> {
  const { data, error } = await database().rpc("caro_snapshot", { p_code: code, p_token_hash: hash });
  checkDatabase(error);
  return data as RawSnapshot;
}
function view(data: RawSnapshot): RoomSnapshot {
  const me = data.me;
  return { ...data, me: me ? { id: me.id, name: me.name, score: me.score, wins: me.wins, correct: me.correct,
    wrong: me.wrong, moves: me.moves, joined_at: me.joined_at, last_seen: me.last_seen, version: me.version,
    game: publicGame(data.room.status === "finished" ? newGame() : me.state), history: me.history ?? null } : null };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const code = roomCode(params.get("code"));
    const hash = request.headers.has("authorization") ? playerToken(request) : "";
    if (params.has("historyBefore")) {
      if (!hash) throw new ApiError("Bạn cần tham gia phòng để xem lịch sử cá nhân.", 401);
      const before = params.get("historyBefore")!;
      if (!/^[1-9][0-9]{0,17}$/.test(before)) throw new ApiError("Mốc lịch sử không hợp lệ.");
      const { data, error } = await database().rpc("caro_history", { p_code: code, p_token_hash: hash, p_before: before });
      checkDatabase(error);
      return respond(data);
    }
    return respond(view(await snapshot(code, hash)));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const code = roomCode(body.code);
    const hash = playerToken(request);
    if (body.action === "join") {
      const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local";
      await limitRequest(`join:${code}:${tokenHash(ip)}`, 240, 60);
      const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
      if (!name || name.length > 28 || /[\u0000-\u001f]/.test(name)) throw new ApiError("Tên người chơi cần có 1–28 ký tự.");
      const { error } = await database().rpc("caro_join", { p_code: code, p_name: name, p_token_hash: hash, p_state: newGame() });
      checkDatabase(error);
      return respond(view(await snapshot(code, hash)));
    }
    if (body.action !== "play") throw new ApiError("Thao tác không hợp lệ.");
    const data = await snapshot(code, hash);
    if (data.room.status !== "active") throw new ApiError("Phiên chưa bắt đầu hoặc đã kết thúc.");
    if (!data.me) throw new ApiError("Bạn không còn trong phòng. Hãy nhập mã phòng lại.", 401);
    if (!Number.isInteger(body.version) || body.version !== data.me.version) throw new ApiError("Điểm hoặc ván cờ vừa thay đổi. Hãy thử lại thao tác.", 409);
    if (!body.move || typeof body.move !== "object") throw new ApiError("Nước đi không hợp lệ.");
    const actionId = uuid(body.actionId);
    const action = body.move as GameAction;
    if (action.type === "target") uuid(action.targetId);
    let result: ReturnType<typeof advanceGame>;
    try { result = advanceGame(data.me.state, data.me, action); }
    catch (error) { throw new ApiError(error instanceof Error ? error.message : "Thao tác không hợp lệ."); }
    const { data: committed, error } = await database().rpc("caro_commit_v2", {
      p_code: code, p_token_hash: hash, p_version: body.version, p_action_id: actionId,
      p_state: result.game, p_stats: result.stats, p_target_id: result.target?.id ?? null,
      p_effect: result.target?.effect ?? null, p_percent: result.target?.percent ?? 0,
    });
    if (error?.code === "PGRST202") throw new ApiError("Admin cần chạy supabase/02-private-score-history.sql trước khi dùng bản mới.", 503);
    checkDatabase(error);
    return respond(view(committed as RawSnapshot));
  } catch (error) { return failure(error); }
}
