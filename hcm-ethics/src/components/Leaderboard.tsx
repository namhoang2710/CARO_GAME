"use client";

import { useEffect, useMemo, useState } from "react";
import LeaderboardClearButton from "@/components/LeaderboardClearButton";
import { LEADERBOARD_REFRESH_EVENT } from "@/lib/leaderboardEvents";
import { fetchLeaderboard, isLocalMode, type ScoreRow, subscribeLeaderboard } from "@/lib/supabaseClient";
import { getResultLabel } from "@/lib/scoring";

type LeaderboardProps = {
  limit?: number;
  compact?: boolean;
  captureEnabled?: boolean;
  clearEnabled?: boolean;
  currentPlayer?: {
    playerName: string;
    score: number;
    result?: ScoreRow["result"];
    correctAnswers?: number;
    wrongAnswers?: number;
    totalMoves?: number;
  };
  selectMode?: {
    label: string;
    helper: string;
    disabledPlayerName?: string;
    onSelect: (row: ScoreRow) => void;
  } | null;
};

function drawLeaderboardImage(rows: ScoreRow[], compact: boolean) {
  const width = compact ? 900 : 1100;
  const rowHeight = 78;
  const height = 150 + Math.max(rows.length, 1) * rowHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(0.55, "#1e1b4b");
  gradient.addColorStop(1, "#4c1d95");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  for (let x = 0; x < width; x += 44) {
    ctx.fillRect(x, 0, 1, height);
  }
  for (let y = 0; y < height; y += 44) {
    ctx.fillRect(0, y, width, 1);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px Arial";
  ctx.fillText("Caro Quiz Battle - Leaderboard", 44, 62);
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "700 20px Arial";
  ctx.fillText(new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date()), 46, 96);

  if (rows.length === 0) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "700 28px Arial";
    ctx.fillText("Chưa có điểm trên bảng xếp hạng", 46, 170);
  }

  rows.forEach((row, index) => {
    const top = 126 + index * rowHeight;
    ctx.fillStyle =
      index === 0
        ? "rgba(250, 204, 21, 0.22)"
        : index === 1
          ? "rgba(226, 232, 240, 0.14)"
          : index === 2
            ? "rgba(251, 146, 60, 0.16)"
            : "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(36, top, width - 72, 58, 18);
    ctx.fill();

    ctx.fillStyle = index < 3 ? "#fef3c7" : "#e2e8f0";
    ctx.font = "900 28px Arial";
    ctx.fillText(`#${index + 1}`, 62, top + 38);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 28px Arial";
    ctx.fillText(row.player_name.slice(0, 22), 140, top + 38);

    ctx.fillStyle = "#67e8f9";
    ctx.font = "900 30px Arial";
    ctx.fillText(`${row.score} điểm`, width - 270, top + 38);
  });

  const link = document.createElement("a");
  link.download = `caro-leaderboard-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function Leaderboard({
  limit = 10,
  compact = false,
  captureEnabled = false,
  clearEnabled = false,
  currentPlayer,
  selectMode = null,
}: LeaderboardProps) {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      const result = await fetchLeaderboard(limit);
      if (!active) {
        return;
      }

      setRows(result.rows);
      setStatus(result.error);
      setLoading(false);
    }

    void loadRows();
    const unsubscribe = subscribeLeaderboard(() => {
      void loadRows();
    });
    window.addEventListener(LEADERBOARD_REFRESH_EVENT, loadRows);

    return () => {
      active = false;
      window.removeEventListener(LEADERBOARD_REFRESH_EVENT, loadRows);
      unsubscribe?.();
    };
  }, [limit]);

  const displayRows = useMemo(() => {
    const localPlayer = currentPlayer;
    const playerName = localPlayer?.playerName.trim();
    if (!localPlayer || !playerName) {
      return rows;
    }

    const normalizedPlayerName = playerName.toLowerCase();
    const rowIndex = rows.findIndex((row) => row.player_name.trim().toLowerCase() === normalizedPlayerName);
    const existingRow = rowIndex >= 0 ? rows[rowIndex] : null;
    const localRow: ScoreRow = {
      id: existingRow?.id ?? `local-${normalizedPlayerName}`,
      player_name: playerName,
      score: Math.max(0, Math.floor(localPlayer.score)),
      result: localPlayer.result ?? existingRow?.result ?? "draw",
      correct_answers: localPlayer.correctAnswers ?? existingRow?.correct_answers ?? 0,
      wrong_answers: localPlayer.wrongAnswers ?? existingRow?.wrong_answers ?? 0,
      total_moves: localPlayer.totalMoves ?? existingRow?.total_moves ?? 0,
      created_at: existingRow?.created_at ?? new Date().toISOString(),
    };

    const mergedRows = rowIndex >= 0
      ? rows.map((row, index) => (index === rowIndex ? localRow : row))
      : [...rows, localRow];

    return mergedRows
      .sort((firstRow, secondRow) => {
        if (secondRow.score !== firstRow.score) {
          return secondRow.score - firstRow.score;
        }

        return new Date(firstRow.created_at).getTime() - new Date(secondRow.created_at).getTime();
      })
      .slice(0, limit);
  }, [currentPlayer, limit, rows]);

  if (status) {
    return (
      <div className="rounded-[1.5rem] border border-amber-300/30 bg-amber-300/10 p-6 text-center text-amber-100">
        <p className="text-lg font-black">{status}</p>
        <p className="mt-2 text-sm text-amber-50/80">
          Game vẫn chơi được bình thường. Leaderboard sẽ hoạt động sau khi cấu hình Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-fuchsia-900/20 backdrop-blur sm:rounded-[1.5rem]">
      <div className="flex flex-col items-stretch justify-between gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className={compact ? "text-xl font-black text-white" : "text-2xl font-black text-white"}>
            Bảng xếp hạng
          </h2>
          {selectMode ? <p className="mt-1 text-xs font-semibold text-cyan-100">{selectMode.helper}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {captureEnabled ? (
            <button
              className="min-h-9 rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
              onClick={() => drawLeaderboardImage(displayRows, compact)}
              type="button"
            >
              Chụp hình
            </button>
          ) : null}
          {clearEnabled ? (
            <LeaderboardClearButton
              className="rounded-full bg-rose-300 px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              inputClassName="min-h-9 w-24 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs font-semibold text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 sm:w-28"
              onCleared={() => setRows([])}
              wrapperClassName="flex flex-wrap items-center gap-2 sm:justify-end"
            />
          ) : null}
          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-100">
            {selectMode ? selectMode.label : isLocalMode ? "Local Realtime" : "Cloud Realtime"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-300">Đang tải leaderboard...</div>
      ) : displayRows.length === 0 ? (
        <div className="p-8 text-center text-slate-300">Chưa có điểm. Hãy là người đầu tiên lên bảng.</div>
      ) : compact ? (
        <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
          {displayRows.map((row, index) => {
            const disabled = Boolean(selectMode?.disabledPlayerName && row.player_name === selectMode.disabledPlayerName);
            const className = [
              "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition sm:rounded-2xl sm:px-4 sm:py-3",
              selectMode && !disabled ? "hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-300/15" : "",
              disabled ? "cursor-not-allowed opacity-45" : "",
              index === 0
                ? "border-yellow-300/30 bg-yellow-300/15 text-yellow-100"
                : index === 1
                  ? "border-slate-200/20 bg-slate-200/10 text-slate-100"
                  : index === 2
                    ? "border-amber-400/25 bg-amber-500/15 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-slate-200",
            ].join(" ");

            const content = (
              <>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{index + 1}</p>
                  <p className="truncate text-sm font-black">{row.player_name}</p>
                </div>
                <p className="shrink-0 text-lg font-black text-cyan-100">{row.score}</p>
              </>
            );

            return selectMode ? (
              <button
                className={className}
                disabled={disabled}
                key={row.id}
                onClick={() => selectMode.onSelect(row)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div className={className} key={row.id}>
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Điểm</th>
                <th className="px-4 py-3">Trận thắng</th>
                <th className="px-4 py-3">Câu đúng</th>
                {!compact ? <th className="px-4 py-3">Thời gian</th> : null}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, index) => {
                const rankClass =
                  index === 0
                    ? "bg-yellow-300/15 text-yellow-100"
                    : index === 1
                      ? "bg-slate-200/10 text-slate-100"
                      : index === 2
                        ? "bg-amber-600/15 text-amber-100"
                        : "text-slate-200";

                return (
                  <tr className={`border-t border-white/10 ${rankClass}`} key={row.id}>
                    <td className="px-4 py-4 text-lg font-black">#{index + 1}</td>
                    <td className="px-4 py-4 font-bold">{row.player_name}</td>
                    <td className="px-4 py-4 text-lg font-black text-cyan-100">{row.score}</td>
                    <td className="px-4 py-4">
                      {row.result === "win" ? 1 : 0}
                      <span className="ml-2 text-xs text-slate-400">({getResultLabel(row.result)})</span>
                    </td>
                    <td className="px-4 py-4">{row.correct_answers}</td>
                    {!compact ? (
                      <td className="px-4 py-4 text-slate-300">
                        {new Intl.DateTimeFormat("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        }).format(new Date(row.created_at))}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
