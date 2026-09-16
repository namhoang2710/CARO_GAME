// Imported only by the server route. No client-supplied scores or card outcomes.
import { createEmptyBoard, cloneBoard, checkWinner, isBoardFull, isInside, shouldShowQuiz } from "../gameLogic";
import { makeBotMove } from "../botLogic";
import { getRandomQuestion, type QuizQuestion } from "../../data/questions";
import type { Card, GameAction, GameView } from "../sessionTypes";

export type GameState = Omit<GameView, "question" | "cardCount" | "targetCard"> & {
  question: QuizQuestion | null; cards: Card[]; targetCard: Card | null; asked: string[];
};
export type GameStats = { score: number; wins: number; correct: number; wrong: number; moves: number };
export const MAX_SCORE = 1_000_000_000;

export function newGame(): GameState {
  return { board: createEmptyBoard(), stage: "move", round: 1, roundMoves: 0, result: null,
    winner: { winner: null, line: [] }, question: null, feedback: null, cards: [],
    targetCard: null, asked: [], frozenUntil: 0, message: "Bạn đi trước. Nối 5 quân để thắng!" };
}

export function publicGame(game: GameState): GameView {
  const q = game.question;
  return { board: game.board, stage: game.stage, round: game.round, roundMoves: game.roundMoves,
    result: game.result, winner: game.winner, frozenUntil: game.frozenUntil, message: game.message,
    feedback: game.feedback, cardCount: game.cards.length, targetCard: game.targetCard,
    question: q ? { id: q.id, question: q.question, options: q.options, difficulty: q.difficulty } : null };
}

function drawCards(): Card[] {
  const deck: Card[] = [
    { kind: "gain", title: "Thêm 120 điểm", value: 120 }, { kind: "gain", title: "Thêm 60 điểm", value: 60 },
    { kind: "double", title: "Nhân đôi", value: 2 }, { kind: "gain", title: "Mất 80 điểm", value: -80 },
    { kind: "split", title: "Chia đều điểm", value: 0 },
    { kind: "freeze", title: "Đóng băng 8 giây", value: 8 },
    { kind: "gamble", title: "Lật kèo", value: Math.random() < 0.58 ? 180 : -140 },
    ...[30, 50, 70, 100].flatMap<Card>((value) => [
      { kind: "steal", title: `Cướp ${value}%`, value }, { kind: "lose", title: `Mất ${value}%`, value },
    ]),
  ];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 3);
}

function finish(game: GameState, stats: GameStats): boolean {
  const winner = checkWinner(game.board);
  if (!winner.winner && !isBoardFull(game.board)) return false;
  game.winner = winner;
  game.result = winner.winner === "X" ? "win" : winner.winner === "O" ? "lose" : "draw";
  game.stage = "round";
  const bonus = game.result === "win" ? 100 + (game.roundMoves < 15 ? 50 : 0) : game.result === "draw" ? 50 : 20;
  stats.score += bonus;
  stats.wins += Number(game.result === "win");
  game.message = `+${bonus} điểm thưởng. Điểm tiếp tục cộng dồn trong phiên.`;
  return true;
}

function botTurn(game: GameState, stats: GameStats, enhanced = false) {
  const move = makeBotMove(game.board, { enhanced });
  if (move) {
    game.board[move.row][move.col] = "O";
    game.roundMoves++;
    stats.moves++;
  }
  if (!finish(game, stats)) game.stage = "move";
}

export function advanceGame(previous: GameState, previousStats: GameStats, action: GameAction, now = Date.now()) {
  const game = structuredClone(previous);
  const { score, wins, correct, wrong, moves } = previousStats;
  const stats: GameStats = { score, wins, correct, wrong, moves };
  let target: { id: string; effect: "steal" | "split"; percent: number } | null = null;
  const requireStage = (...stages: GameState["stage"][]) => {
    if (!stages.includes(game.stage)) throw new Error("Thao tác không phù hợp với lượt hiện tại. Hãy tải lại trạng thái.");
  };
  if (action.type === "move") {
    requireStage("move");
    const { row, col } = action;
    if (!Number.isInteger(row) || !Number.isInteger(col) || !isInside(row!, col!) || game.board[row!][col!]) {
      throw new Error("Ô cờ không hợp lệ.");
    }
    game.board = cloneBoard(game.board);
    game.board[row!][col!] = "X";
    game.roundMoves++;
    stats.moves++;
    game.message = "";
    if (!finish(game, stats)) {
      if (shouldShowQuiz(Math.ceil(game.roundMoves / 2))) {
        game.question = getRandomQuestion(game.asked);
        if (game.question) {
          if (game.asked.includes(game.question.id)) game.asked = [];
          game.asked.push(game.question.id);
          game.feedback = null;
          game.stage = "quiz";
        } else botTurn(game, stats);
      } else botTurn(game, stats);
    }
  } else if (action.type === "answer") {
    requireStage("quiz");
    const q = game.question;
    if (!q || !Number.isInteger(action.index) || action.index! < 0 || action.index! >= q.options.length) throw new Error("Đáp án không hợp lệ.");
    const correct = action.index === q.correctAnswerIndex;
    stats.correct += Number(correct);
    stats.wrong += Number(!correct);
    stats.score = correct ? stats.score + 30 : Math.floor(stats.score / 2);
    game.feedback = { correct, correctIndex: q.correctAnswerIndex, explanation: q.explanation, selected: action.index! };
    game.message = correct ? "Chính xác! +30 điểm và một lượt chọn thẻ." : "Chưa đúng. Bạn mất 50% điểm hiện tại.";
    game.stage = "feedback";
  } else if (action.type === "continue") {
    requireStage("feedback");
    if (game.feedback?.correct) {
      game.cards = drawCards();
      game.stage = "cards";
    } else botTurn(game, stats, true);
    game.question = null;
    game.feedback = null;
  } else if (action.type === "card") {
    requireStage("cards");
    if (!Number.isInteger(action.index) || !game.cards[action.index!]) throw new Error("Thẻ không hợp lệ.");
    const card = game.cards[action.index!];
    game.cards = [];
    game.message = card.title;
    if (card.kind === "steal" || card.kind === "split") {
      game.targetCard = card;
      game.stage = "target";
    } else if (card.kind === "freeze") {
      game.frozenUntil = now + 8000;
      game.stage = "frozen";
    } else {
      if (card.kind === "double") stats.score *= 2;
      else if (card.kind === "lose") stats.score -= Math.ceil(stats.score * card.value / 100);
      else stats.score += card.value;
      botTurn(game, stats);
    }
  } else if (action.type === "target" || action.type === "skip") {
    requireStage("target");
    const card = game.targetCard;
    if (action.type === "target") {
      if (!action.targetId || !card || (card.kind !== "steal" && card.kind !== "split")) throw new Error("Hãy chọn một đối thủ.");
      target = { id: action.targetId, effect: card.kind, percent: card.value };
      game.message = `${card.title}: đã áp dụng lên đối thủ.`;
    } else game.message = "Đã bỏ qua thẻ. Tiếp tục ván cờ.";
    game.targetCard = null;
    botTurn(game, stats);
  } else if (action.type === "thaw") {
    requireStage("frozen");
    if (now < game.frozenUntil) throw new Error("Chưa hết thời gian đóng băng.");
    game.frozenUntil = 0;
    botTurn(game, stats);
  } else if (action.type === "next") {
    requireStage("round");
    Object.assign(game, newGame(), { round: game.round + 1, asked: game.asked });
  } else throw new Error("Thao tác không hợp lệ.");
  stats.score = Math.min(MAX_SCORE, Math.max(0, Math.floor(stats.score)));
  return { game, stats, target };
}
