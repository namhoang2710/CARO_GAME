import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { GameResult } from "@/lib/gameLogic";
import { LEADERBOARD_REFRESH_EVENT } from "@/lib/leaderboardEvents";

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

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isLocalMode = !isSupabaseConfigured;

export const supabase = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type ScoreRow = {
  id: string;
  player_name: string;
  score: number;
  result: GameResult;
  correct_answers: number;
  wrong_answers: number;
  total_moves: number;
  created_at: string;
};

export type ScoreInsert = Omit<ScoreRow, "id" | "created_at">;
export type TargetCardEffect = "steal" | "split";

export type TargetCardEffectResult = {
  player_score: number;
  target_score: number;
  delta: number;
  message: string;
};

// ==============================================================================
// LOCAL STORAGE & BROADCASTCHANNEL ENGINE (Fallback khi chưa có Supabase Cloud)
// ==============================================================================
const LOCAL_STORAGE_KEY = "caro_quiz_leaderboard_data";
const BROADCAST_CHANNEL_NAME = "caro_leaderboard_channel";

const INITIAL_MOCK_ROWS: ScoreRow[] = [
  {
    id: "mock-1",
    player_name: "Minh Anh",
    score: 420,
    result: "win",
    correct_answers: 4,
    wrong_answers: 0,
    total_moves: 14,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "mock-2",
    player_name: "Tuấn Hưng",
    score: 310,
    result: "win",
    correct_answers: 3,
    wrong_answers: 1,
    total_moves: 18,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "mock-3",
    player_name: "Phương Thảo",
    score: 250,
    result: "draw",
    correct_answers: 2,
    wrong_answers: 0,
    total_moves: 22,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

function getLocalBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  try {
    return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    return null;
  }
}

function notifyLocalChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(LEADERBOARD_REFRESH_EVENT));
  const channel = getLocalBroadcastChannel();
  channel?.postMessage({ type: "refresh" });
  channel?.close();
}

function readLocalScores(): ScoreRow[] {
  if (typeof window === "undefined") {
    return INITIAL_MOCK_ROWS;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ROWS));
      return INITIAL_MOCK_ROWS;
    }
    return JSON.parse(raw) as ScoreRow[];
  } catch {
    return INITIAL_MOCK_ROWS;
  }
}

function writeLocalScores(rows: ScoreRow[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore quota errors
  }
}

// ==============================================================================
// PUBLIC API FUNCTIONS (Tự động chọn Cloud hoặc Local Fallback)
// ==============================================================================
export async function fetchLeaderboard(limit = 10): Promise<{
  rows: ScoreRow[];
  error: string | null;
}> {
  // 1. Thử gọi API proxy server Next.js (bỏ qua mọi lỗi IPv6/DNS phía client)
  try {
    const res = await fetch(`/api/leaderboard?limit=${limit}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.rows) && json.rows.length > 0) {
        return { rows: json.rows, error: null };
      }
    }
  } catch {}

  // 2. Thử gọi trực tiếp Supabase client nếu có
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });
      if (!error && Array.isArray(data) && data.length > 0) {
        return { rows: data as ScoreRow[], error: null };
      }
    } catch {}
  }

  // 3. Fallback mượt mà về Local Storage dự phòng
  const local = readLocalScores();
  const sorted = [...local]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, Math.max(1, Math.min(limit, 50)));
  return { rows: sorted, error: null };
}

function submitLocalScoreFallback(payload: ScoreInsert): { error: string | null } {
  const rows = readLocalScores();
  const cleanName = payload.player_name.trim();
  if (!cleanName) {
    return { error: "Tên không được để trống" };
  }

  const existingIndex = rows.findIndex(
    (r) => r.player_name.trim().toLowerCase() === cleanName.toLowerCase(),
  );

  const updatedRow: ScoreRow = {
    id: existingIndex >= 0 ? rows[existingIndex].id : `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    player_name: cleanName,
    score: Math.max(0, payload.score),
    result: payload.result,
    correct_answers: payload.correct_answers,
    wrong_answers: payload.wrong_answers,
    total_moves: payload.total_moves,
    created_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    rows[existingIndex] = updatedRow;
  } else {
    rows.push(updatedRow);
  }

  writeLocalScores(rows);
  notifyLocalChange();
  return { error: null };
}

export async function submitScore(payload: ScoreInsert): Promise<{ error: string | null }> {
  // Backup local ngay lập tức
  submitLocalScoreFallback(payload);

  // 1. Gửi qua server-side proxy
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}

  // 2. Đồng thời sync qua Supabase client nếu có
  if (supabase) {
    try {
      await supabase.rpc("upsert_player_score", {
        p_player_name: payload.player_name,
        p_score: payload.score,
        p_result: payload.result,
        p_correct_answers: payload.correct_answers,
        p_wrong_answers: payload.wrong_answers,
        p_total_moves: payload.total_moves,
      });
    } catch {}
  }

  return { error: null };
}

function applyLocalTargetEffect(payload: {
  targetScoreId: string;
  playerScore: number;
  effect: TargetCardEffect;
  percent?: number;
}): { result: TargetCardEffectResult | null; error: string | null } {
  const rows = readLocalScores();
  const targetIndex = rows.findIndex((r) => r.id === payload.targetScoreId);

  if (targetIndex < 0) {
    return { result: null, error: "Không tìm thấy người chơi được chọn" };
  }

  const targetRow = rows[targetIndex];
  const safePercent = Math.max(0, Math.min(payload.percent ?? 25, 100));
  const currentTargetScore = targetRow.score;
  let nextPlayerScore = payload.playerScore;
  let nextTargetScore = currentTargetScore;
  let effectDelta = 0;
  let message = "";

  if (payload.effect === "steal") {
    effectDelta = Math.min(currentTargetScore, Math.ceil((currentTargetScore * safePercent) / 100));
    nextTargetScore = Math.max(0, currentTargetScore - effectDelta);
    nextPlayerScore = payload.playerScore + effectDelta;
    message = `Cướp ${effectDelta} điểm (${safePercent}%) từ ${targetRow.player_name}.`;
  } else if (payload.effect === "split") {
    nextPlayerScore = Math.ceil((payload.playerScore + currentTargetScore) / 2);
    nextTargetScore = Math.floor((payload.playerScore + currentTargetScore) / 2);
    effectDelta = nextPlayerScore - payload.playerScore;
    message = `Chia đều điểm với ${targetRow.player_name}. Bạn ${effectDelta >= 0 ? "+" : ""}${effectDelta} điểm.`;
  }

  rows[targetIndex] = {
    ...targetRow,
    score: nextTargetScore,
  };
  writeLocalScores(rows);
  notifyLocalChange();

  return {
    result: {
      player_score: Math.max(0, nextPlayerScore),
      target_score: Math.max(0, nextTargetScore),
      delta: effectDelta,
      message,
    },
    error: null,
  };
}

export async function applyTargetCardEffect(payload: {
  targetScoreId: string;
  playerScore: number;
  effect: TargetCardEffect;
  percent?: number;
}): Promise<{ result: TargetCardEffectResult | null; error: string | null }> {
  // 1. Thử qua server-side proxy
  try {
    const res = await fetch("/api/leaderboard/effect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return { result: data.result, error: null };
      }
    }
  } catch {}

  // 2. Thử qua Supabase client
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("apply_score_card_target_effect", {
        p_target_score_id: payload.targetScoreId,
        p_player_score: Math.max(0, Math.floor(payload.playerScore)),
        p_effect: payload.effect,
        p_percent: payload.percent ?? null,
      });

      if (!error) {
        const firstRow = Array.isArray(data) ? data[0] : data;
        if (firstRow) {
          return { result: firstRow as TargetCardEffectResult, error: null };
        }
      }
    } catch {}
  }

  // 3. Fallback sang local
  return applyLocalTargetEffect(payload);
}

export async function clearLeaderboard(password: string): Promise<{ error: string | null }> {
  const response = await fetch("/api/leaderboard/clear", {
    body: JSON.stringify({ password }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean; localOnly?: boolean };

  if (!response.ok) {
    return { error: data.error ?? "Không xóa được bảng xếp hạng" };
  }

  // Nếu server phản hồi ok, đồng thời xóa luôn local storage
  if (typeof window !== "undefined") {
    writeLocalScores([]);
    notifyLocalChange();
  }

  return { error: null };
}

export function subscribeLeaderboard(onChange: () => void): (() => void) | null {
  if (!supabase) {
    if (typeof window === "undefined") {
      return null;
    }

    const channel = getLocalBroadcastChannel();
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === "refresh") {
        onChange();
      }
    };
    channel?.addEventListener("message", handleBroadcast);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        onChange();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.removeEventListener("message", handleBroadcast);
      channel?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }

  const channel: RealtimeChannel = supabase
    .channel("scores-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "scores" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
