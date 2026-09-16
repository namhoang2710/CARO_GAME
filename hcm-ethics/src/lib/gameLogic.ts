import { getRandomQuestion } from "@/data/questions";

export const BOARD_SIZE = 15;
export const WIN_LENGTH = 5;

export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = Cell[][];
export type Move = { row: number; col: number };
export type GameResult = "win" | "lose" | "draw";

export type WinnerState = {
  winner: Mark | null;
  line: Move[];
};

const DIRECTIONS = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function isInside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function getAvailableMoves(board: Board): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!board[row][col]) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

export function isBoardFull(board: Board): boolean {
  return getAvailableMoves(board).length === 0;
}

export function checkWinner(board: Board): WinnerState {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const mark = board[row][col];
      if (!mark) {
        continue;
      }

      for (const direction of DIRECTIONS) {
        const line: Move[] = [{ row, col }];

        for (let step = 1; step < WIN_LENGTH; step += 1) {
          const nextRow = row + direction.row * step;
          const nextCol = col + direction.col * step;

          if (!isInside(nextRow, nextCol) || board[nextRow][nextCol] !== mark) {
            break;
          }

          line.push({ row: nextRow, col: nextCol });
        }

        if (line.length === WIN_LENGTH) {
          return { winner: mark, line };
        }
      }
    }
  }

  return { winner: null, line: [] };
}

export function shouldShowQuiz(playerMoveCount: number): boolean {
  return playerMoveCount > 0 && playerMoveCount % 3 === 0;
}

export function getLineScore(board: Board, move: Move, mark: Mark): number {
  let best = 0;

  for (const direction of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    for (const multiplier of [-1, 1]) {
      let row = move.row + direction.row * multiplier;
      let col = move.col + direction.col * multiplier;

      while (isInside(row, col) && board[row][col] === mark) {
        count += 1;
        row += direction.row * multiplier;
        col += direction.col * multiplier;
      }

      if (isInside(row, col) && board[row][col] === null) {
        openEnds += 1;
      }
    }

    best = Math.max(best, count * 10 + openEnds * 3);
  }

  return best;
}

export function getNearbyAvailableMoves(board: Board, radius = 2): Move[] {
  const moves: Move[] = [];
  const visited = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            const key = `${nr},${nc}`;
            if (isInside(nr, nc) && board[nr][nc] === null && !visited.has(key)) {
              visited.add(key);
              moves.push({ row: nr, col: nc });
            }
          }
        }
      }
    }
  }

  return moves;
}

export function hasNearWinThreat(board: Board, mark: Mark): boolean {
  const candidates = getNearbyAvailableMoves(board, 1);
  if (candidates.length === 0) {
    return false;
  }

  for (const move of candidates) {
    if (getLineScore(board, move, mark) >= 43) {
      return true;
    }
  }

  return false;
}

export function suggestPlayerMove(board: Board): Move | null {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) {
    return null;
  }

  const scored = moves.map((move) => {
    const attackBoard = cloneBoard(board);
    attackBoard[move.row][move.col] = "X";
    const defendBoard = cloneBoard(board);
    defendBoard[move.row][move.col] = "O";

    const attackWin = checkWinner(attackBoard).winner === "X";
    const defendWin = checkWinner(defendBoard).winner === "O";

    return {
      move,
      score:
        (attackWin ? 10_000 : 0) +
        (defendWin ? 9_000 : 0) +
        getLineScore(attackBoard, move, "X") * 3 +
        getLineScore(defendBoard, move, "O") * 2 +
        adjacencyScore(board, move),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.move ?? null;
}

export function adjacencyScore(board: Board, move: Move): number {
  let score = 0;
  for (let row = move.row - 1; row <= move.row + 1; row += 1) {
    for (let col = move.col - 1; col <= move.col + 1; col += 1) {
      if (row === move.row && col === move.col) {
        continue;
      }

      if (isInside(row, col) && board[row][col]) {
        score += board[row][col] === "X" ? 5 : 4;
      }
    }
  }

  const center = Math.floor(BOARD_SIZE / 2);
  score += Math.max(0, 6 - Math.abs(move.row - center) - Math.abs(move.col - center));
  return score;
}

export { getRandomQuestion };
