"use client";
import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { Board, WinnerState } from "@/lib/gameLogic";

const BoardCell = memo(function BoardCell({ cell, row, col, winning, disabled, onChoose }: {
  cell: "X" | "O" | null; row: number; col: number; winning: boolean; disabled: boolean;
  onChoose: (row: number, col: number) => void;
}) {
  return <button type="button" className={`board-cell ${cell ? `piece-${cell.toLowerCase()}` : ""} ${winning ? "winning" : ""}`}
    aria-label={`Hàng ${row + 1}, cột ${col + 1}${cell ? `: ${cell}` : ": trống"}`}
    disabled={disabled || Boolean(cell)} onClick={() => onChoose(row, col)}>
    {cell && <span className="piece">{cell === "X" ? "×" : "○"}</span>}
  </button>;
});

export default memo(function GameBoard({ board, disabled, winnerState, onCellClick }: {
  board: Board; disabled: boolean; winnerState: WinnerState; onCellClick: (row: number, col: number) => void;
}) {
  // Stable cell handler + latest callback prevents memo from capturing an old board.
  const latest = useRef(onCellClick);
  useLayoutEffect(() => { latest.current = onCellClick; }, [onCellClick]);
  const choose = useCallback((row: number, col: number) => latest.current(row, col), []);
  const line = new Set(winnerState.line.map((move) => `${move.row}:${move.col}`));
  return <div className="board-wrap"><div className="game-board" role="group" aria-label="Bàn Caro 15 hàng, 15 cột">
    {board.map((row, r) => row.map((cell, c) => <BoardCell key={`${r}:${c}`} cell={cell} row={r} col={c}
      winning={line.has(`${r}:${c}`)} disabled={disabled} onChoose={choose} />))}
  </div></div>;
});
