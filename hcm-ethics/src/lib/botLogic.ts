import { BOARD_SIZE, Board, Mark, Move, WIN_LENGTH, getAvailableMoves, isInside } from "@/lib/gameLogic";

type BotOptions = {
  enhanced?: boolean;
};

type DirectionEvaluation = {
  consecutive: number;
  openEnds: number;
  score: number;
};

type ThreatSummary = {
  score: number;
  win: boolean;
  openFours: number;
  fours: number;
  openThrees: number;
  threes: number;
  openTwos: number;
  maxConsecutive: number;
};

type ScoreWeights = {
  win: number;
  four: number;
  openThree: number;
  openTwo: number;
  semiOpenThree: number;
  semiOpenTwo: number;
};

const BOT_SYMBOL: Mark = "O";
const PLAYER_SYMBOL: Mark = "X";
const CANDIDATE_RADIUS = 2;
const LINE_SCAN_RADIUS = WIN_LENGTH - 1;

const DIRECTIONS = [
  { dx: 0, dy: 1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
];

const ATTACK_WEIGHTS: ScoreWeights = {
  win: 1_000_000,
  four: 100_000,
  openThree: 30_000,
  openTwo: 5_000,
  semiOpenThree: 8_000,
  semiOpenTwo: 1_200,
};

const DEFENSE_WEIGHTS: ScoreWeights = {
  win: 900_000,
  four: 90_000,
  openThree: 25_000,
  openTwo: 3_000,
  semiOpenThree: 7_000,
  semiOpenTwo: 900,
};

export function makeBotMove(board: Board, options: BotOptions = {}): Move | null {
  return findBestMoveWithOptions(board, BOT_SYMBOL, PLAYER_SYMBOL, options);
}

export function findBestMove(board: Board, botSymbol: Mark, playerSymbol: Mark): Move | null {
  return findBestMoveWithOptions(board, botSymbol, playerSymbol);
}

function findBestMoveWithOptions(
  board: Board,
  botSymbol: Mark,
  playerSymbol: Mark,
  options: BotOptions = {},
): Move | null {
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) {
    return null;
  }

  const winningMove = findImmediateMove(board, candidates, botSymbol);
  if (winningMove) {
    return winningMove;
  }

  const blockingMove = findImmediateMove(board, candidates, playerSymbol);
  if (blockingMove) {
    return blockingMove;
  }

  // Compute each candidate's attack/defense once, reused by every tactical pass.
  // This cache is local to one move; no boards accumulate between games.
  const attack = new Map(candidates.map((move) => [move, analyzeMoveThreat(board, move.row, move.col, botSymbol, ATTACK_WEIGHTS)]));
  const defense = new Map(candidates.map((move) => [move, analyzeMoveThreat(board, move.row, move.col, playerSymbol, DEFENSE_WEIGHTS)]));
  const botFourMove = findBestThreatMove(board, candidates, attack, (threat) =>
    threat.openFours > 0 || threat.fours > 0,
  );
  if (botFourMove) {
    return botFourMove;
  }

  const playerFourMove = findBestThreatMove(board, candidates, defense, (threat) =>
    threat.openFours > 0 || threat.fours > 0,
  );
  if (playerFourMove) {
    return playerFourMove;
  }

  const botOpenThreeMove = findBestThreatMove(board, candidates, attack, (threat) =>
    threat.openThrees > 0 || threat.threes >= 2,
  );
  if (botOpenThreeMove) {
    return botOpenThreeMove;
  }

  const playerOpenThreeMove = findBestThreatMove(board, candidates, defense, (threat) =>
    threat.openThrees > 0 || threat.threes >= 2,
  );
  if (playerOpenThreeMove) {
    return playerOpenThreeMove;
  }

  const defenseMultiplier = options.enhanced ? 1.18 : 1;
  let bestMove: Move | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of candidates) {
    const attackThreat = attack.get(move)!;
    const defenseThreat = defense.get(move)!;
    const attackScore = attackThreat.score;
    const defenseScore = defenseThreat.score * defenseMultiplier;
    const positionalScore = getCenterScore(move.row, move.col) + getNeighborScore(board, move.row, move.col);
    const totalScore = attackScore + defenseScore + positionalScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

export function scoreMove(board: Board, row: number, col: number, symbol: Mark): number {
  if (!isInside(row, col) || board[row][col] !== null) {
    return Number.NEGATIVE_INFINITY;
  }

  return (
    scorePattern(board, row, col, symbol, ATTACK_WEIGHTS) +
    getCenterScore(row, col) +
    getNeighborScore(board, row, col)
  );
}

export function evaluateDirection(
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  symbol: Mark,
): DirectionEvaluation {
  const forwardCount = countConsecutive(board, row, col, dx, dy, symbol);
  const backwardCount = countConsecutive(board, row, col, -dx, -dy, symbol);
  const consecutive = 1 + forwardCount + backwardCount;

  const forwardEndRow = row + dx * (forwardCount + 1);
  const forwardEndCol = col + dy * (forwardCount + 1);
  const backwardEndRow = row - dx * (backwardCount + 1);
  const backwardEndCol = col - dy * (backwardCount + 1);
  const openEnds =
    Number(isOpenEnd(board, forwardEndRow, forwardEndCol)) +
    Number(isOpenEnd(board, backwardEndRow, backwardEndCol));

  return {
    consecutive,
    openEnds,
    score: getDirectionPatternScore(consecutive, openEnds, ATTACK_WEIGHTS),
  };
}

export function countConsecutive(
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  symbol: Mark,
): number {
  let count = 0;
  let nextRow = row + dx;
  let nextCol = col + dy;

  while (isInside(nextRow, nextCol) && board[nextRow][nextCol] === symbol) {
    count += 1;
    nextRow += dx;
    nextCol += dy;
  }

  return count;
}

export function isOpenEnd(board: Board, row: number, col: number): boolean {
  return isInside(row, col) && board[row][col] === null;
}

export function getCandidateMoves(board: Board): Move[] {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return [];
  }

  const occupiedMoves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]) {
        occupiedMoves.push({ row, col });
      }
    }
  }

  if (occupiedMoves.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    return [{ row: center, col: center }];
  }

  const candidateKeys = new Set<string>();
  const candidates: Move[] = [];

  for (const occupied of occupiedMoves) {
    for (let row = occupied.row - CANDIDATE_RADIUS; row <= occupied.row + CANDIDATE_RADIUS; row += 1) {
      for (let col = occupied.col - CANDIDATE_RADIUS; col <= occupied.col + CANDIDATE_RADIUS; col += 1) {
        if (!isInside(row, col) || board[row][col] !== null) {
          continue;
        }

        const key = `${row}:${col}`;
        if (!candidateKeys.has(key)) {
          candidateKeys.add(key);
          candidates.push({ row, col });
        }
      }
    }
  }

  const scopedCandidates = candidates.length > 0 ? candidates : availableMoves;
  return scopedCandidates.sort(compareMovesByBoardPressure(board));
}

function findImmediateMove(board: Board, candidates: Move[], symbol: Mark): Move | null {
  return candidates.find((move) => wouldWin(board, move.row, move.col, symbol)) ?? null;
}

function wouldWin(board: Board, row: number, col: number, symbol: Mark): boolean {
  return DIRECTIONS.some((direction) => {
    const evaluation = evaluateDirection(board, row, col, direction.dx, direction.dy, symbol);
    return evaluation.consecutive >= WIN_LENGTH;
  });
}

function scorePattern(board: Board, row: number, col: number, symbol: Mark, weights: ScoreWeights): number {
  return analyzeMoveThreat(board, row, col, symbol, weights).score;
}

function analyzeMoveThreat(board: Board, row: number, col: number, symbol: Mark, weights: ScoreWeights): ThreatSummary {
  if (!isInside(row, col) || board[row][col] !== null) {
    return {
      score: Number.NEGATIVE_INFINITY,
      win: false,
      openFours: 0,
      fours: 0,
      openThrees: 0,
      threes: 0,
      openTwos: 0,
      maxConsecutive: 0,
    };
  }

  const summary: ThreatSummary = {
    score: 0,
    win: false,
    openFours: 0,
    fours: 0,
    openThrees: 0,
    threes: 0,
    openTwos: 0,
    maxConsecutive: 0,
  };

  for (const direction of DIRECTIONS) {
    const evaluation = evaluateDirection(board, row, col, direction.dx, direction.dy, symbol);
    const windowThreat = evaluateLineWindows(board, row, col, direction.dx, direction.dy, symbol, weights);

    summary.score += Math.max(
      getDirectionPatternScore(evaluation.consecutive, evaluation.openEnds, weights),
      windowThreat.score,
    );
    summary.win ||= evaluation.consecutive >= WIN_LENGTH || windowThreat.win;
    summary.openFours += windowThreat.openFours;
    summary.fours += windowThreat.fours + Number(evaluation.consecutive === 4 && evaluation.openEnds === 1);
    summary.openThrees += windowThreat.openThrees + Number(evaluation.consecutive === 3 && evaluation.openEnds === 2);
    summary.threes += windowThreat.threes + Number(evaluation.consecutive === 3 && evaluation.openEnds === 1);
    summary.openTwos += windowThreat.openTwos + Number(evaluation.consecutive === 2 && evaluation.openEnds === 2);
    summary.maxConsecutive = Math.max(summary.maxConsecutive, evaluation.consecutive, windowThreat.maxConsecutive);
  }

  summary.score += getForkBonus(summary, weights);
  return summary;
}

function evaluateLineWindows(
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  symbol: Mark,
  weights: ScoreWeights,
): ThreatSummary {
  const opponent = symbol === "X" ? "O" : "X";
  const cells: CellSnapshot[] = [];
  const candidateIndex = LINE_SCAN_RADIUS;
  const summary: ThreatSummary = {
    score: 0,
    win: false,
    openFours: 0,
    fours: 0,
    openThrees: 0,
    threes: 0,
    openTwos: 0,
    maxConsecutive: 0,
  };

  for (let offset = -LINE_SCAN_RADIUS; offset <= LINE_SCAN_RADIUS; offset += 1) {
    const nextRow = row + dx * offset;
    const nextCol = col + dy * offset;

    cells.push({
      mark: offset === 0 ? symbol : isInside(nextRow, nextCol) ? board[nextRow][nextCol] : opponent,
    });
  }

  for (let start = 0; start <= cells.length - WIN_LENGTH; start += 1) {
    const end = start + WIN_LENGTH - 1;
    if (candidateIndex < start || candidateIndex > end) {
      continue;
    }

    const window = cells.slice(start, start + WIN_LENGTH);
    if (window.some((cell) => cell.mark === opponent)) {
      continue;
    }

    const ownCount = window.filter((cell) => cell.mark === symbol).length;
    const openEnds = Number(cells[start - 1]?.mark === null) + Number(cells[end + 1]?.mark === null);
    const windowScore = getWindowScore(ownCount, openEnds, weights);

    summary.score = Math.max(summary.score, windowScore);
    summary.win ||= ownCount >= WIN_LENGTH;
    summary.openFours += Number(ownCount === 4 && openEnds === 2);
    summary.fours += Number(ownCount === 4 && openEnds < 2);
    summary.openThrees += Number(ownCount === 3 && openEnds === 2);
    summary.threes += Number(ownCount === 3 && openEnds === 1);
    summary.openTwos += Number(ownCount === 2 && openEnds === 2);
    summary.maxConsecutive = Math.max(summary.maxConsecutive, ownCount);
  }

  return summary;
}

function getDirectionPatternScore(consecutive: number, openEnds: number, weights: ScoreWeights): number {
  if (consecutive >= WIN_LENGTH) {
    return weights.win;
  }

  if (consecutive >= 4 && openEnds > 0) {
    return weights.four;
  }

  if (consecutive === 3 && openEnds === 2) {
    return weights.openThree;
  }

  if (consecutive === 3 && openEnds === 1) {
    return weights.semiOpenThree;
  }

  if (consecutive === 2 && openEnds === 2) {
    return weights.openTwo;
  }

  if (consecutive === 2 && openEnds === 1) {
    return weights.semiOpenTwo;
  }

  return 0;
}

type CellSnapshot = {
  mark: Mark | null;
};

function getWindowScore(ownCount: number, openEnds: number, weights: ScoreWeights): number {
  if (ownCount >= WIN_LENGTH) {
    return weights.win;
  }

  if (ownCount === 4) {
    return weights.four + (openEnds === 2 ? 60_000 : 0);
  }

  if (ownCount === 3 && openEnds === 2) {
    return weights.openThree;
  }

  if (ownCount === 3 && openEnds === 1) {
    return weights.semiOpenThree;
  }

  if (ownCount === 2 && openEnds === 2) {
    return weights.openTwo;
  }

  if (ownCount === 2 && openEnds === 1) {
    return weights.semiOpenTwo;
  }

  return 0;
}

function getForkBonus(threat: ThreatSummary, weights: ScoreWeights): number {
  const fourThreats = threat.openFours + threat.fours;
  const threeThreats = threat.openThrees + threat.threes;

  if (fourThreats >= 2) {
    return weights.four;
  }

  if (fourThreats >= 1 && threat.openThrees >= 1) {
    return Math.round(weights.four * 0.75);
  }

  if (threat.openThrees >= 2) {
    return weights.openThree;
  }

  if (threeThreats >= 2) {
    return Math.round(weights.openThree * 0.55);
  }

  return 0;
}

function findBestThreatMove(
  board: Board,
  candidates: Move[],
  threats: Map<Move, ThreatSummary>,
  predicate: (threat: ThreatSummary) => boolean,
): Move | null {
  let bestMove: Move | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of candidates) {
    const threat = threats.get(move)!;
    if (!predicate(threat)) {
      continue;
    }

    const positionalScore = getCenterScore(move.row, move.col) + getNeighborScore(board, move.row, move.col);
    const totalScore = threat.score + positionalScore;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

function getCenterScore(row: number, col: number): number {
  const center = (BOARD_SIZE - 1) / 2;
  const distance = Math.abs(row - center) + Math.abs(col - center);
  return Math.max(0, Math.round(500 - distance * 70));
}

function getNeighborScore(board: Board, row: number, col: number): number {
  let hasNeighbor = false;
  let densityScore = 0;

  for (let nextRow = row - CANDIDATE_RADIUS; nextRow <= row + CANDIDATE_RADIUS; nextRow += 1) {
    for (let nextCol = col - CANDIDATE_RADIUS; nextCol <= col + CANDIDATE_RADIUS; nextCol += 1) {
      if ((nextRow === row && nextCol === col) || !isInside(nextRow, nextCol) || !board[nextRow][nextCol]) {
        continue;
      }

      hasNeighbor = true;
      const distance = Math.max(Math.abs(nextRow - row), Math.abs(nextCol - col));
      densityScore += distance === 1 ? 45 : 18;
    }
  }

  return (hasNeighbor ? 300 : 0) + Math.min(densityScore, 260);
}

function compareMovesByBoardPressure(board: Board): (a: Move, b: Move) => number {
  return (a, b) => {
    const scoreA = getCenterScore(a.row, a.col) + getNeighborScore(board, a.row, a.col);
    const scoreB = getCenterScore(b.row, b.col) + getNeighborScore(board, b.row, b.col);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    if (a.row !== b.row) {
      return a.row - b.row;
    }

    return a.col - b.col;
  };
}
