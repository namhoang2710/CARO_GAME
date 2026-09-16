import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(searchParams.get("limit") ?? "10") || 10, 50));

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ rows: [], error: "Supabase chưa được cấu hình biến môi trường trên server." });
  }

  try {
    const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });
    if (error) {
      return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [], error: null });
  } catch (err) {
    return NextResponse.json({ rows: [], error: (err as Error)?.message ?? "Lỗi server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Chưa cấu hình Supabase trên server" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { player_name, score, result, correct_answers, wrong_answers, total_moves } = body;

    const { error } = await supabase.rpc("upsert_player_score", {
      p_player_name: player_name,
      p_score: score,
      p_result: result,
      p_correct_answers: correct_answers,
      p_wrong_answers: wrong_answers,
      p_total_moves: total_moves,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, error: null });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Lỗi server" }, { status: 500 });
  }
}
