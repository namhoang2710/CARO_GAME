import "server-only";
import { createClient } from "@supabase/supabase-js";

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new ApiError("Máy chủ chưa được cấu hình kết nối phòng chơi. Admin cần kiểm tra biến môi trường Supabase.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(12000) }) } });
}

const messages: Record<string, string> = {
  ROOM_NOT_FOUND: "Không tìm thấy phòng. Kiểm tra lại mã 6 số.", JOIN_CLOSED: "Phòng đã bắt đầu hoặc kết thúc. Hãy chờ mã phiên mới.",
  ROOM_FULL: "Phòng đã đủ người.", NAME_TAKEN: "Tên này đã có trong phòng. Hãy chọn tên khác.",
  ROOM_EMPTY: "Cần ít nhất một người tham gia để bắt đầu.", INVALID_PHASE: "Trạng thái phòng đã thay đổi. Hãy tải lại.",
  GAME_CLOSED: "Phiên chưa bắt đầu hoặc đã kết thúc.", PLAYER_NOT_FOUND: "Bạn chưa có trong phòng hoặc đã được admin đưa ra khỏi phòng.",
  VERSION_CONFLICT: "Trạng thái vừa thay đổi. Đã yêu cầu tải lại, vui lòng thử lại thao tác.",
  INVALID_TARGET: "Không thể chọn người chơi này.",
};

export function checkDatabase(error: { message: string; code?: string } | null) {
  if (!error) return;
  for (const [code, message] of Object.entries(messages)) {
    if (error.message.includes(code)) throw new ApiError(message, code === "VERSION_CONFLICT" ? 409 : code === "ROOM_NOT_FOUND" ? 404 : 400);
  }
  if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01" || error.message.includes("schema cache")) {
    throw new ApiError("Phòng chơi chưa được cài đặt. Admin cần chạy supabase/01-session-game.sql trên Supabase.", 503);
  }
  console.error("Caro database error", error.code);
  throw new ApiError("Chưa kết nối được phòng chơi. Vui lòng thử lại.", 503);
}

export function respond(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Authorization, Cookie" } });
}

export function failure(error: unknown) {
  if (error instanceof ApiError) return respond({ error: error.message }, error.status);
  console.error("Caro request failed", error instanceof Error ? error.name : "Unknown");
  return respond({ error: "Kết nối bị gián đoạn. Hãy thử lại sau ít giây." }, 503);
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new ApiError("Yêu cầu không hợp lệ.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError("Yêu cầu phải là JSON.");
  const text = await request.text();
  if (text.length > 4096) throw new ApiError("Yêu cầu quá lớn.", 413);
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    return body;
  } catch { throw new ApiError("Yêu cầu không hợp lệ."); }
}

export function roomCode(value: unknown): string {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) throw new ApiError("Mã phòng gồm 6 chữ số.");
  return value;
}

export function uuid(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new ApiError("Mã thao tác không hợp lệ.");
  return value;
}
