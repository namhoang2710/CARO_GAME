import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ClearPayload = {
  password?: unknown;
};

function normalizeSupabaseUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  const trimmedUrl = url.trim().replace(/\/+$/, "");
  const restEndpointSuffix = "/rest/v1";
  return trimmedUrl.endsWith(restEndpointSuffix)
    ? trimmedUrl.slice(0, -restEndpointSuffix.length)
    : trimmedUrl;
}

export async function POST(request: Request) {
  const expectedPassword = process.env.LEADERBOARD_CLEAR_PASSWORD?.trim();
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!expectedPassword) {
    return jsonResponse({ error: "Chưa cấu hình pass xóa BXH trên server." }, 500);
  }

  const payload = await parsePayload(request);
  const password = typeof payload?.password === "string" ? payload.password.trim() : "";

  if (!password || !isPasswordMatch(password, expectedPassword)) {
    return jsonResponse({ error: "Pass xóa BXH không đúng." }, 403);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    // Chưa cấu hình Supabase trên cloud: Cho phép xóa cục bộ ở client
    return jsonResponse({ ok: true, localOnly: true }, 200);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.rpc("clear_leaderboard");

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
}

async function parsePayload(request: Request): Promise<ClearPayload | null> {
  try {
    return (await request.json()) as ClearPayload;
  } catch {
    return null;
  }
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
    status,
  });
}

function isPasswordMatch(password: string, expectedPassword: string): boolean {
  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(expectedPassword);

  if (passwordBuffer.length !== expectedPasswordBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
}
