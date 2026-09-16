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

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ result: null, error: "Chưa cấu hình Supabase trên server" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { targetScoreId, playerScore, effect, percent } = body;

    const { data, error } = await supabase.rpc("apply_score_card_target_effect", {
      p_target_score_id: targetScoreId,
      p_player_score: Math.max(0, Math.floor(playerScore)),
      p_effect: effect,
      p_percent: percent ?? null,
    });

    if (error) {
      return NextResponse.json({ result: null, error: error.message }, { status: 500 });
    }

    const firstRow = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ result: firstRow ?? null, error: null });
  } catch (err) {
    return NextResponse.json({ result: null, error: (err as Error)?.message ?? "Lỗi server" }, { status: 500 });
  }
}
