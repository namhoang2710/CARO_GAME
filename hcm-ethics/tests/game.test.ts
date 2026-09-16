import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceGame, newGame, publicGame, type GameStats } from "../src/lib/server/gameEngine";
import { makeBotMove } from "../src/lib/botLogic";
import { createEmptyBoard, checkWinner } from "../src/lib/gameLogic";

const zero: GameStats = { score: 0, wins: 0, correct: 0, wrong: 0, moves: 0 };

test("server accepts one X and one O, rejects occupied and invalid coordinates", () => {
  const initial = newGame();
  const next = advanceGame(initial, zero, { type: "move", row: 7, col: 7 });
  assert.equal(next.game.board.flat().filter((x) => x === "X").length, 1);
  assert.equal(next.game.board.flat().filter((x) => x === "O").length, 1);
  assert.equal(initial.board.flat().filter(Boolean).length, 0);
  assert.equal(next.stats.moves, 2);
  assert.throws(() => advanceGame(next.game, next.stats, { type: "move", row: 7, col: 7 }));
  for (const row of [-1, 15, 1.5, NaN]) assert.throws(() => advanceGame(initial, zero, { type: "move", row, col: 0 }));
});

test("quiz every third player move hides answers and cards until resolved", () => {
  const initial = newGame(); initial.roundMoves = 4;
  const quiz = advanceGame(initial, { ...zero, score: 101 }, { type: "move", row: 7, col: 7 });
  assert.equal(quiz.game.stage, "quiz");
  assert.equal("correctAnswerIndex" in publicGame(quiz.game).question!, false);
  assert.equal("explanation" in publicGame(quiz.game).question!, false);
  const answer = advanceGame(quiz.game, quiz.stats, { type: "answer", index: quiz.game.question!.correctAnswerIndex });
  assert.equal(answer.stats.score, 131);
  assert.equal(answer.stats.correct, 1);
  assert.throws(() => advanceGame(answer.game, answer.stats, { type: "answer", index: 0 }));
  const cards = advanceGame(answer.game, answer.stats, { type: "continue" });
  assert.equal(cards.game.cards.length, 3);
  assert.equal("cards" in publicGame(cards.game), false);
  const chosen = advanceGame(cards.game, cards.stats, { type: "card", index: 0 });
  assert.equal(chosen.game.cards.length, 0);
  assert.throws(() => advanceGame(chosen.game, chosen.stats, { type: "card", index: 0 }));
});

test("wrong answer halves score, freeze cannot be bypassed, next round keeps stats", () => {
  const initial = newGame(); initial.roundMoves = 4;
  const quiz = advanceGame(initial, { ...zero, score: 101 }, { type: "move", row: 7, col: 7 });
  const answer = advanceGame(quiz.game, quiz.stats, { type: "answer", index: (quiz.game.question!.correctAnswerIndex + 1) % 4 });
  assert.equal(answer.stats.score, 50);
  assert.equal(answer.stats.wrong, 1);
  const frozen = newGame(); frozen.stage = "frozen"; frozen.frozenUntil = 8000;
  assert.throws(() => advanceGame(frozen, zero, { type: "thaw" }, 7999));
  assert.equal(advanceGame(frozen, zero, { type: "thaw" }, 8001).game.stage, "move");
  frozen.stage = "round";
  const next = advanceGame(frozen, { ...zero, score: 50, wins: 2 }, { type: "next" });
  assert.equal(next.game.round, 2); assert.equal(next.stats.score, 50); assert.equal(next.stats.wins, 2);
});

test("five-in-a-row in all directions and bot immediate defense", () => {
  for (const [dr, dc] of [[1,0], [0,1], [1,1], [1,-1]]) {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) board[5 + dr * i][7 + dc * i] = "X";
    assert.equal(checkWinner(board).winner, "X");
    assert.equal(checkWinner(board).line.length, 5);
  }
  const board = createEmptyBoard();
  for (let i = 0; i < 4; i++) board[7][i] = "X";
  assert.deepEqual(makeBotMove(board), { row: 7, col: 4 });
});

test("win bonus paid once, score cap, and requested card comes from server deck", () => {
  const game = newGame();
  for (let i = 0; i < 4; i++) game.board[7][i] = "X";
  game.roundMoves = 8;
  const win = advanceGame(game, zero, { type: "move", row: 7, col: 4 });
  assert.equal(win.stats.score, 150); assert.equal(win.stats.wins, 1);
  assert.throws(() => advanceGame(win.game, win.stats, { type: "move", row: 8, col: 4 }));
  const cards = newGame(); cards.stage = "cards"; cards.cards = [{ kind: "double", title: "Nhân đôi", value: 2 }];
  assert.equal(advanceGame(cards, { ...zero, score: 999999999 }, { type: "card", index: 0 }).stats.score, 1000000000);
  assert.throws(() => advanceGame(cards, zero, { type: "card", index: 2 }));
});
