"use client";

import React, { useMemo } from "react";
import { Board, Move, WinnerState } from "@/lib/gameLogic";

type GameBoardProps = {
  board: Board;
  disabled?: boolean;
  hintMove?: Move | null;
  removeMode?: boolean;
  frozen?: boolean;
  freezeLabel?: string;
  winnerState?: WinnerState;
  onCellClick: (row: number, col: number) => void;
};

type CellProps = {
  cell: "X" | "O" | null;
  rowIndex: number;
  colIndex: number;
  disabled: boolean;
  isHint: boolean;
  isWinner: boolean;
  canRemove: boolean;
  onCellClick: (row: number, col: number) => void;
};

const BoardCell = React.memo(
  function BoardCell({
    cell,
    rowIndex,
    colIndex,
    disabled,
    isHint,
    isWinner,
    canRemove,
    onCellClick,
  }: CellProps) {
    return (
      <button
        aria-label={`Ô ${rowIndex + 1}-${colIndex + 1}`}
        className={[
          "board-cell aspect-square min-w-0 rounded-[0.25rem] border text-[clamp(0.65rem,4.5vw,1.75rem)] font-black leading-none select-none sm:rounded-md",
          "focus:outline-none focus:ring-1 focus:ring-cyan-300",
          cell === "X" ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-200" : "",
          cell === "O" ? "border-fuchsia-300/70 bg-fuchsia-400/20 text-fuchsia-200" : "",
          !cell && !disabled
            ? "border-white/10 bg-white/[0.05] text-white active:bg-cyan-300/20"
            : "border-white/10 bg-white/[0.03]",
          isHint ? "border-emerald-300 bg-emerald-300/30 ring-2 ring-emerald-300/80" : "",
          canRemove ? "border-amber-300 bg-amber-300/25 ring-2 ring-amber-300/80" : "",
          isWinner ? "border-yellow-200 bg-yellow-300/40 text-yellow-100 ring-2 ring-yellow-200" : "",
        ].join(" ")}
        disabled={disabled || (!canRemove && Boolean(cell))}
        onClick={() => onCellClick(rowIndex, colIndex)}
        type="button"
      >
        {cell ?? ""}
      </button>
    );
  },
  (prev, next) =>
    prev.cell === next.cell &&
    prev.disabled === next.disabled &&
    prev.isHint === next.isHint &&
    prev.isWinner === next.isWinner &&
    prev.canRemove === next.canRemove &&
    prev.rowIndex === next.rowIndex &&
    prev.colIndex === next.colIndex,
);

export default function GameBoard({
  board,
  disabled = false,
  hintMove,
  removeMode = false,
  frozen = false,
  freezeLabel = "Sàn đang bị đóng băng",
  winnerState,
  onCellClick,
}: GameBoardProps) {
  // Tạo Set O(1) để kiểm tra ô chiến thắng, tránh lặp O(N) 225 lần
  const winnerSet = useMemo(() => {
    if (!winnerState?.line || winnerState.line.length === 0) {
      return null;
    }
    return new Set(winnerState.line.map((m) => `${m.row}-${m.col}`));
  }, [winnerState]);

  return (
    <div className="board-wrap relative mx-auto w-full max-w-[min(100%,calc(100svw-0.75rem),760px)]">
      <div
        className="game-board grid w-full gap-px rounded-[0.75rem] border border-white/15 bg-slate-950/80 p-1 shadow-xl shadow-fuchsia-950/30 sm:gap-0.5 sm:rounded-[1.25rem] sm:p-2"
        style={{ gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const isHint = Boolean(hintMove && hintMove.row === rowIndex && hintMove.col === colIndex);
            const isWinner = Boolean(winnerSet?.has(key));
            const canRemove = removeMode && cell === "O";

            return (
              <BoardCell
                canRemove={canRemove}
                cell={cell}
                colIndex={colIndex}
                disabled={disabled}
                isHint={isHint}
                isWinner={isWinner}
                key={key}
                onCellClick={onCellClick}
                rowIndex={rowIndex}
              />
            );
          }),
        )}
      </div>
      {frozen ? (
        <div className="frost-overlay absolute inset-0 flex items-center justify-center rounded-[1.25rem] border border-cyan-200/40 bg-slate-950/70 text-center text-lg font-black text-cyan-100 backdrop-blur-sm sm:text-xl">
          {freezeLabel}
        </div>
      ) : null}
    </div>
  );
}
