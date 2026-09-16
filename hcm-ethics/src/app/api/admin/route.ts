import { randomInt } from "node:crypto";
import { adminLogin, adminLogout, isAdmin, requireAdmin } from "@/lib/server/auth";
import { database, checkDatabase, failure, readBody, respond, ApiError, roomCode, uuid } from "@/lib/server/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdmin())) return respond({ authenticated: false, rooms: [] });
    const { data, error } = await database().from("caro_rooms").select("*").order("created_at", { ascending: false }).limit(30);
    checkDatabase(error);
    return respond({ authenticated: true, rooms: data ?? [] });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    if (body.action === "login") {
      await adminLogin(body.password, request);
      return respond({ ok: true });
    }
    await requireAdmin();
    if (body.action === "logout") { await adminLogout(); return respond({ ok: true }); }
    if (body.action === "create") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const duration = Number(body.duration);
      const capacity = Number(body.capacity);
      const id = uuid(body.actionId);
      if (!title || title.length > 80 || !Number.isInteger(duration) || duration < 1 || duration > 120 || !Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
        throw new ApiError("Tên phòng tối đa 80 ký tự; thời lượng 1–120 phút; số người 1–200.");
      }
      const db = database();
      const existing = await db.from("caro_rooms").select("*").eq("id", id).maybeSingle();
      checkDatabase(existing.error);
      if (existing.data) return respond({ room: existing.data });
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data, error } = await db.from("caro_rooms").insert({ id, code: String(randomInt(100000, 1000000)), title, duration_minutes: duration, capacity }).select().single();
        if (error?.code === "23505") continue;
        checkDatabase(error);
        return respond({ room: data });
      }
      throw new ApiError("Chưa tạo được mã phòng. Hãy thử lại.", 503);
    }
    if (!["start", "end", "remove"].includes(String(body.action))) throw new ApiError("Thao tác không hợp lệ.");
    const { error } = await database().rpc("caro_room_control", { p_code: roomCode(body.code), p_action: body.action,
      p_player_id: body.action === "remove" ? uuid(body.playerId) : null });
    checkDatabase(error);
    return respond({ ok: true });
  } catch (error) { return failure(error); }
}
