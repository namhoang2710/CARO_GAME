"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import GameBoard from "@/components/GameBoard";
import Leaderboard from "@/components/Leaderboard";
import QuizModal from "@/components/QuizModal";
import { QuizQuestion } from "@/data/questions";
import { makeBotMove } from "@/lib/botLogic";
import {
  Board,
  checkWinner,
  cloneBoard,
  createEmptyBoard,
  GameResult,
  getRandomQuestion,
  hasNearWinThreat,
  isBoardFull,
  shouldShowQuiz,
  WinnerState,
} from "@/lib/gameLogic";
import { LEADERBOARD_REFRESH_EVENT } from "@/lib/leaderboardEvents";
import { getResultLabel } from "@/lib/scoring";
import { applyTargetCardEffect, ScoreInsert, ScoreRow, submitScore, TargetCardEffect } from "@/lib/supabaseClient";
import {
  isSoundEnabled,
  playCardSound,
  playCorrectSound,
  playLoseSound,
  playMoveSound,
  playWinSound,
  playWrongSound,
  toggleSound,
} from "@/lib/soundEffects";

type Turn = "player" | "bot" | "round-end";
type CardTone = "emerald" | "cyan" | "fuchsia" | "amber" | "rose" | "slate";
type ScoreCardKind =
  | "gain"
  | "steal"
  | "double"
  | "reduce"
  | "split"
  | "lose"
  | "gamble"
  | "freezeSelf"
  | "freezeOpponent";

type ScoreCard = {
  id: string;
  title: string;
  badge: string;
  description: string;
  kind: ScoreCardKind;
  tone: CardTone;
  percent?: number;
  value?: number;
};

const BOT_THINK_DELAY_MS = 250;
const CARD_REVEAL_MS = 650;
const FREEZE_DURATION_MS = 8000;
const SCORE_SYNC_DELAY_MS = 30;

function resultFromWinner(winner: "X" | "O" | null): GameResult {
  if (winner === "X") {
    return "win";
  }

  if (winner === "O") {
    return "lose";
  }

  return "draw";
}

function getRoundBonus(result: GameResult, totalMoves: number): number {
  const resultBonus = result === "win" ? 100 : result === "draw" ? 50 : 20;
  const speedBonus = result === "win" && totalMoves < 15 ? 50 : 0;
  return resultBonus + speedBonus;
}

function makeCardDeck(): ScoreCard[] {
  const gambleValue = Math.random() > 0.42 ? 180 : -140;

  return [
    {
      id: "gain-120",
      title: "Tăng điểm",
      badge: "+120",
      description: "Cộng ngay 120 điểm vào quỹ hiện tại.",
      kind: "gain",
      tone: "emerald",
      value: 120,
    },
    {
      id: "gain-60",
      title: "Điểm nhanh",
      badge: "+60",
      description: "Nhận 60 điểm an toàn.",
      kind: "gain",
      tone: "cyan",
      value: 60,
    },
    ...[30, 50, 70, 100].map<ScoreCard>((percent) => ({
      id: `steal-${percent}`,
      title: `Cướp ${percent}%`,
      badge: `${percent}%`,
      description: `Chọn một người trên leaderboard để cướp ${percent}% điểm của họ.`,
      kind: "steal",
      percent,
      tone: "fuchsia",
    })),
    {
      id: "double",
      title: "Nhân đôi",
      badge: "x2",
      description: "Nhân đôi toàn bộ quỹ điểm hiện tại.",
      kind: "double",
      tone: "amber",
    },
    {
      id: "reduce",
      title: "Giảm điểm",
      badge: "-80",
      description: "Mất 80 điểm nếu chọn lá này.",
      kind: "reduce",
      tone: "rose",
      value: 80,
    },
    {
      id: "split",
      title: "Chia điểm",
      badge: "Chọn người",
      description: "Chọn một người trên leaderboard để chia đều tổng điểm của hai bên.",
      kind: "split",
      tone: "slate",
    },
    ...[30, 50, 70, 100].map<ScoreCard>((percent) => ({
      id: `lose-${percent}`,
      title: `Mất ${percent}%`,
      badge: `-${percent}%`,
      description: `Mất ${percent}% quỹ điểm hiện tại.`,
      kind: "lose",
      percent,
      tone: "rose",
    })),
    {
      id: "freeze-self",
      title: "Đóng băng mình",
      badge: "8s",
      description: "Sàn của bạn bị đóng băng 8 giây, không thể đặt quân trong thời gian này.",
      kind: "freezeSelf",
      tone: "slate",
    },
    {
      id: "freeze-opponent",
      title: "Đóng băng đối thủ",
      badge: "8s",
      description: "Đóng băng sàn của đối thủ 8 giây. Bot sẽ bị chậm lượt kế tiếp.",
      kind: "freezeOpponent",
      tone: "cyan",
    },
    {
      id: `gamble-${gambleValue}`,
      title: "Lật kèo",
      badge: gambleValue > 0 ? `+${gambleValue}` : `${gambleValue}`,
      description: gambleValue > 0 ? "Bài may mắn: cộng điểm lớn." : "Bài rủi ro: mất điểm lớn.",
      kind: "gamble",
      tone: gambleValue > 0 ? "emerald" : "rose",
      value: gambleValue,
    },
  ];
}

function getRandomCards(): ScoreCard[] {
  return makeCardDeck()
    .map((card) => ({ card, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map(({ card }) => card);
}

function applyCardEffect(currentScore: number, card: ScoreCard): { nextScore: number; message: string } {
  if (card.kind === "gain") {
    return {
      nextScore: currentScore + (card.value ?? 0),
      message: `${card.title}: cộng ${card.value ?? 0} điểm.`,
    };
  }

  if (card.kind === "steal") {
    return {
      nextScore: currentScore,
      message: `Chọn một người trên leaderboard để cướp ${card.percent ?? 30}% điểm.`,
    };
  }

  if (card.kind === "double") {
    return {
      nextScore: currentScore * 2,
      message: "Nhân đôi quỹ điểm hiện tại.",
    };
  }

  if (card.kind === "split") {
    return {
      nextScore: currentScore,
      message: "Chọn một người trên leaderboard để chia điểm.",
    };
  }

  if (card.kind === "lose" && card.percent) {
    const lostScore = Math.ceil(currentScore * card.percent / 100);
    return {
      nextScore: currentScore - lostScore,
      message: `${card.title}: mất ${lostScore} điểm.`,
    };
  }

  const delta = card.kind === "gamble" ? (card.value ?? 0) : -(card.value ?? 0);
  return {
    nextScore: currentScore + delta,
    message: delta >= 0 ? `${card.title}: +${delta} điểm.` : `${card.title}: ${delta} điểm.`,
  };
}

function isTargetCard(card: ScoreCard): card is ScoreCard & { kind: TargetCardEffect } {
  return card.kind === "steal" || card.kind === "split";
}

export default function PlayPage() {
  const [playerName] = useState(() =>
    typeof window === "undefined" ? "Khách mời" : localStorage.getItem("caro-player-name") || "Khách mời",
  );
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [turn, setTurn] = useState<Turn>("player");
  const [winnerState, setWinnerState] = useState<WinnerState>({ winner: null, line: [] });
  const [roundResult, setRoundResult] = useState<GameResult | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [playerMoveCount, setPlayerMoveCount] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [enhancedBotNext, setEnhancedBotNext] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [cardChoices, setCardChoices] = useState<ScoreCard[] | null>(null);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [cardRevealBusy, setCardRevealBusy] = useState(false);
  const [targetingCard, setTargetingCard] = useState<(ScoreCard & { kind: TargetCardEffect }) | null>(null);
  const [targetActionLoading, setTargetActionLoading] = useState(false);
  const [playerFrozenUntil, setPlayerFrozenUntil] = useState<number | null>(null);
  const [botFrozenUntil, setBotFrozenUntil] = useState<number | null>(null);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>([]);
  const [pendingBotAfterQuiz, setPendingBotAfterQuiz] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const scoreRef = useRef(0);
  const roundEndingRef = useRef(false);
  const nextRoundTimerRef = useRef<number | null>(null);
  const botTurnTimerRef = useRef<number | null>(null);
  const liveSyncTimerRef = useRef<number | null>(null);
  const cardRevealTimerRef = useRef<number | null>(null);
  const playerFreezeTimerRef = useRef<number | null>(null);
  const botFreezeTimerRef = useRef<number | null>(null);
  const botFrozenUntilRef = useRef(0);
  const pendingScorePayloadRef = useRef<ScoreInsert | null>(null);
  const scoreSyncInFlightRef = useRef(false);

  useEffect(() => {
    queueLiveScoreSync(0, {
      result: "draw",
      correctAnswers: 0,
      wrongAnswers: 0,
      moves: 0,
    });

    return () => {
      if (liveSyncTimerRef.current) {
        window.clearTimeout(liveSyncTimerRef.current);
      }
      if (cardRevealTimerRef.current) {
        window.clearTimeout(cardRevealTimerRef.current);
      }
      if (botTurnTimerRef.current) {
        window.clearTimeout(botTurnTimerRef.current);
      }
      if (playerFreezeTimerRef.current) {
        window.clearTimeout(playerFreezeTimerRef.current);
      }
      if (botFreezeTimerRef.current) {
        window.clearTimeout(botFreezeTimerRef.current);
      }
    };
    // Initial row sync only resets when a new player enters; score changes sync via setScoreValue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName]);

  async function flushScoreSync() {
    if (scoreSyncInFlightRef.current) {
      return;
    }

    const payload = pendingScorePayloadRef.current;
    if (!payload) {
      return;
    }

    pendingScorePayloadRef.current = null;
    scoreSyncInFlightRef.current = true;
    const result = await submitScore(payload);
    scoreSyncInFlightRef.current = false;

    if (result.error) {
      setSubmitStatus(result.error);
    } else {
      window.dispatchEvent(new Event(LEADERBOARD_REFRESH_EVENT));
    }

    if (pendingScorePayloadRef.current) {
      void flushScoreSync();
    }
  }

  function queueLiveScoreSync(
    nextScore: number,
    stats: {
      result?: GameResult;
      correctAnswers?: number;
      wrongAnswers?: number;
      moves?: number;
    } = {},
  ) {
    pendingScorePayloadRef.current = {
      player_name: playerName,
      score: nextScore,
      result: stats.result ?? roundResult ?? "draw",
      correct_answers: stats.correctAnswers ?? correctAnswers,
      wrong_answers: stats.wrongAnswers ?? wrongAnswers,
      total_moves: stats.moves ?? totalMoves,
    };

    if (liveSyncTimerRef.current) {
      window.clearTimeout(liveSyncTimerRef.current);
    }

    liveSyncTimerRef.current = window.setTimeout(() => {
      void flushScoreSync();
    }, SCORE_SYNC_DELAY_MS);
  }

  function setScoreValue(
    nextScore: number,
    stats?: {
      result?: GameResult;
      correctAnswers?: number;
      wrongAnswers?: number;
      moves?: number;
    },
  ) {
    const safeScore = Math.max(0, Math.floor(nextScore));
    scoreRef.current = safeScore;
    setScore(safeScore);
    queueLiveScoreSync(safeScore, stats);
  }

  function updateScore(
    updater: (currentScore: number) => number,
    stats?: {
      result?: GameResult;
      correctAnswers?: number;
      wrongAnswers?: number;
      moves?: number;
    },
  ) {
    setScoreValue(updater(scoreRef.current), stats);
  }

  function clearNextRoundTimer() {
    if (nextRoundTimerRef.current) {
      window.clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
  }

  function clearBotTurnTimer() {
    if (botTurnTimerRef.current) {
      window.clearTimeout(botTurnTimerRef.current);
      botTurnTimerRef.current = null;
    }
  }

  function clearFreezeTimers() {
    if (playerFreezeTimerRef.current) {
      window.clearTimeout(playerFreezeTimerRef.current);
      playerFreezeTimerRef.current = null;
    }

    if (botFreezeTimerRef.current) {
      window.clearTimeout(botFreezeTimerRef.current);
      botFreezeTimerRef.current = null;
    }

    botFrozenUntilRef.current = 0;
    setPlayerFrozenUntil(null);
    setBotFrozenUntil(null);
  }

  function freezePlayer() {
    const until = Date.now() + FREEZE_DURATION_MS;
    setPlayerFrozenUntil(until);

    if (playerFreezeTimerRef.current) {
      window.clearTimeout(playerFreezeTimerRef.current);
    }

    playerFreezeTimerRef.current = window.setTimeout(() => {
      setPlayerFrozenUntil(null);
      playerFreezeTimerRef.current = null;
    }, FREEZE_DURATION_MS);
  }

  function freezeBot() {
    const until = Date.now() + FREEZE_DURATION_MS;
    botFrozenUntilRef.current = until;
    setBotFrozenUntil(until);

    if (botFreezeTimerRef.current) {
      window.clearTimeout(botFreezeTimerRef.current);
    }

    botFreezeTimerRef.current = window.setTimeout(() => {
      botFrozenUntilRef.current = 0;
      setBotFrozenUntil(null);
      botFreezeTimerRef.current = null;
    }, FREEZE_DURATION_MS);
  }

  function startNextRound() {
    if (cardRevealTimerRef.current) {
      window.clearTimeout(cardRevealTimerRef.current);
      cardRevealTimerRef.current = null;
    }
    clearBotTurnTimer();
    roundEndingRef.current = false;
    setBoard(createEmptyBoard());
    setTurn("player");
    setWinnerState({ winner: null, line: [] });
    setRoundResult(null);
    setPlayerMoveCount(0);
    setTotalMoves(0);
    setEnhancedBotNext(false);
    setCurrentQuestion(null);
    setCardChoices(null);
    setRevealedCardId(null);
    setCardRevealBusy(false);
    setTargetingCard(null);
    setTargetActionLoading(false);
    setPendingBotAfterQuiz(false);
    setSubmitStatus(null);
  }

  function finishRound(nextBoard: Board, moves: number, nextCorrect = correctAnswers, nextWrong = wrongAnswers) {
    if (roundEndingRef.current) {
      return;
    }
    clearBotTurnTimer();

    const checked = checkWinner(nextBoard);
    const finalResult = checked.winner ? resultFromWinner(checked.winner) : "draw";
    if (finalResult === "win") {
      playWinSound();
    } else if (finalResult === "lose") {
      playLoseSound();
    }
    const roundBonus = getRoundBonus(finalResult, moves);
    const finalScore = Math.max(0, scoreRef.current + roundBonus);

    roundEndingRef.current = true;
    setBoard(nextBoard);
    setWinnerState(checked);
    setRoundResult(finalResult);
    setTurn("round-end");
    setScoreValue(finalScore, {
      result: finalResult,
      correctAnswers: nextCorrect,
      wrongAnswers: nextWrong,
      moves,
    });
    setSubmitStatus("Leaderboard realtime đã cập nhật");

    clearNextRoundTimer();
    nextRoundTimerRef.current = window.setTimeout(() => {
      startNextRound();
    }, 1800);
  }

  function runBotTurn(startBoard: Board, movesBeforeBot: number, forceEnhanced = false) {
    if (roundEndingRef.current) {
      return;
    }

    setTurn("bot");
    const freezeDelay = Math.max(0, botFrozenUntilRef.current - Date.now());

    clearBotTurnTimer();
    botTurnTimerRef.current = window.setTimeout(() => {
      botTurnTimerRef.current = null;
      if (roundEndingRef.current) {
        return;
      }

      const botMove = makeBotMove(startBoard, { enhanced: forceEnhanced || enhancedBotNext });
      if (!botMove) {
        finishRound(startBoard, movesBeforeBot);
        return;
      }

      const nextBoard = cloneBoard(startBoard);
      nextBoard[botMove.row][botMove.col] = "O";
      playMoveSound(true);
      const nextMoves = movesBeforeBot + 1;
      const checked = checkWinner(nextBoard);

      setBoard(nextBoard);
      setTotalMoves(nextMoves);
      setEnhancedBotNext(false);

      if (checked.winner || isBoardFull(nextBoard)) {
        finishRound(nextBoard, nextMoves);
        return;
      }

      setTurn("player");
    }, BOT_THINK_DELAY_MS + freezeDelay);
  }

  function maybeOpenQuiz(nextBoard: Board, nextPlayerMoveCount: number): boolean {
    const regularQuiz = shouldShowQuiz(nextPlayerMoveCount);
    const bonusQuiz = hasNearWinThreat(nextBoard, "X") || hasNearWinThreat(nextBoard, "O");

    if (!regularQuiz && !bonusQuiz) {
      return false;
    }

    const question = getRandomQuestion(askedQuestionIds);
    if (!question) {
      return false;
    }

    setCurrentQuestion(question);
    setAskedQuestionIds((ids) => [...ids, question.id]);
    setPendingBotAfterQuiz(true);
    return true;
  }

  function handleCellClick(row: number, col: number) {
    if (turn !== "player" || playerFrozenUntil || roundResult || currentQuestion || cardChoices || targetingCard || board[row][col]) {
      return;
    }

    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = "X";
    playMoveSound(false);
    const nextPlayerMoves = playerMoveCount + 1;
    const nextMoves = totalMoves + 1;
    const checked = checkWinner(nextBoard);

    setCardMessage(null);
    setBoard(nextBoard);
    setPlayerMoveCount(nextPlayerMoves);
    setTotalMoves(nextMoves);

    if (checked.winner || isBoardFull(nextBoard)) {
      finishRound(nextBoard, nextMoves);
      return;
    }

    if (maybeOpenQuiz(nextBoard, nextPlayerMoves)) {
      return;
    }

    runBotTurn(nextBoard, nextMoves);
  }

  function resumeAfterQuiz(forceEnhancedBot: boolean) {
    if (pendingBotAfterQuiz) {
      setPendingBotAfterQuiz(false);
      runBotTurn(board, totalMoves, forceEnhancedBot);
    }
  }

  function handleQuizResolve(correct: boolean) {
    const nextCorrect = correct ? correctAnswers + 1 : correctAnswers;
    const nextWrong = correct ? wrongAnswers : wrongAnswers + 1;

    setCorrectAnswers(nextCorrect);
    setWrongAnswers(nextWrong);
    setCurrentQuestion(null);

    if (correct) {
      playCorrectSound();
      updateScore((currentScore) => currentScore + 30, {
        correctAnswers: nextCorrect,
        wrongAnswers: nextWrong,
        moves: totalMoves,
      });
      setCardMessage("Trả lời đúng: +30 điểm. Chọn 1 trong 3 lá bài để nhận hiệu ứng.");
      setCardChoices(getRandomCards());
      return;
    }

    playWrongSound();
    updateScore((currentScore) => currentScore * 0.5, {
      correctAnswers: nextCorrect,
      wrongAnswers: nextWrong,
      moves: totalMoves,
    });
    setCardMessage("Trả lời sai: mất 50% quỹ điểm hiện tại. Bot sẽ mạnh hơn ở lượt kế tiếp.");
    setEnhancedBotNext(true);
    resumeAfterQuiz(true);
  }

  function applyChosenCard(card: ScoreCard) {
    if (isTargetCard(card)) {
      setCardChoices(null);
      setRevealedCardId(null);
      setCardRevealBusy(false);
      setTargetingCard(card);
      setCardMessage(`${card.title}: chọn một người trên bảng xếp hạng bên phải để áp dụng.`);
      return;
    }

    if (card.kind === "freezeSelf") {
      freezePlayer();
      setCardMessage("Đóng băng mình: sàn của bạn bị khóa 8 giây.");
      setCardChoices(null);
      setRevealedCardId(null);
      setCardRevealBusy(false);
      resumeAfterQuiz(false);
      return;
    }

    if (card.kind === "freezeOpponent") {
      freezeBot();
      setCardMessage("Đóng băng đối thủ: bot bị chậm lượt kế tiếp 8 giây.");
      setCardChoices(null);
      setRevealedCardId(null);
      setCardRevealBusy(false);
      resumeAfterQuiz(false);
      return;
    }

    const effect = applyCardEffect(scoreRef.current, card);
    setCardMessage(effect.message);
    updateScore(() => effect.nextScore);
    setCardChoices(null);
    setRevealedCardId(null);
    setCardRevealBusy(false);
    resumeAfterQuiz(false);
  }

  function chooseCard(card: ScoreCard) {
    if (cardRevealBusy) {
      return;
    }

    playCardSound();
    setRevealedCardId(card.id);
    setCardRevealBusy(true);
    setCardMessage(`Đã lật lá "${card.title}". Hiệu ứng sẽ áp dụng ngay.`);

    if (cardRevealTimerRef.current) {
      window.clearTimeout(cardRevealTimerRef.current);
    }

    cardRevealTimerRef.current = window.setTimeout(() => {
      applyChosenCard(card);
    }, CARD_REVEAL_MS);
  }

  async function chooseTarget(row: ScoreRow) {
    if (!targetingCard || targetActionLoading) {
      return;
    }

    if (row.player_name === playerName) {
      setCardMessage("Không thể chọn chính mình trên leaderboard. Hãy chọn một đối thủ khác.");
      return;
    }

    setTargetActionLoading(true);
    setCardMessage(`Đang áp dụng ${targetingCard.title} lên ${row.player_name}...`);

    const { result, error } = await applyTargetCardEffect({
      targetScoreId: row.id,
      playerScore: scoreRef.current,
      effect: targetingCard.kind,
      percent: targetingCard.percent,
    });

    setTargetActionLoading(false);

    if (error || !result) {
      setCardMessage(`Không áp dụng được lá ${targetingCard.title}: ${error ?? "lỗi không xác định"}`);
      return;
    }

    setScoreValue(result.player_score);
    setCardMessage(`${result.message} Điểm của bạn hiện là ${result.player_score}.`);
    setTargetingCard(null);
    resumeAfterQuiz(false);
  }

  function resetGame() {
    clearNextRoundTimer();
    clearBotTurnTimer();
    clearFreezeTimers();
    if (cardRevealTimerRef.current) {
      window.clearTimeout(cardRevealTimerRef.current);
      cardRevealTimerRef.current = null;
    }
    roundEndingRef.current = false;
    setBoard(createEmptyBoard());
    setTurn("player");
    setWinnerState({ winner: null, line: [] });
    setRoundResult(null);
    setScoreValue(0, {
      result: "draw",
      correctAnswers: 0,
      wrongAnswers: 0,
      moves: 0,
    });
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setPlayerMoveCount(0);
    setTotalMoves(0);
    setEnhancedBotNext(false);
    setCurrentQuestion(null);
    setCardChoices(null);
    setRevealedCardId(null);
    setCardRevealBusy(false);
    setTargetingCard(null);
    setTargetActionLoading(false);
    setCardMessage(null);
    setAskedQuestionIds([]);
    setPendingBotAfterQuiz(false);
    setSubmitStatus(null);
  }

  const isPlayerFrozen = Boolean(playerFrozenUntil);
  const isBotFrozen = Boolean(botFrozenUntil);
  const turnLabel =
    isPlayerFrozen && turn === "player"
      ? "Sàn của bạn đang đóng băng"
      : isBotFrozen && turn === "bot"
        ? "Đối thủ đang bị đóng băng"
        : turn === "round-end"
          ? "Ván mới sắp bắt đầu"
          : turn === "bot"
            ? "Bot đang suy nghĩ..."
            : "Lượt của bạn";

  return (
    <main className="mobile-play-shell game-shell game-aurora min-h-screen px-2 py-2 sm:px-4 sm:py-5">
      <div className="play-page-grid mx-auto grid max-w-[1560px] gap-3 sm:gap-5 xl:grid-cols-[330px_1fr_390px]">
        <aside className="order-2 hidden space-y-4 xl:order-1 xl:block">
          <div className="game-panel rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-cyan-950/20 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Người chơi</p>
            <h1 className="mt-2 text-2xl font-black text-white">{playerName}</h1>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="stat-tile rounded-2xl bg-cyan-300/10 p-4">
                <p className="text-xs text-slate-300">Điểm</p>
                <p className="text-3xl font-black text-cyan-100">{score}</p>
              </div>
              <div className="stat-tile rounded-2xl bg-fuchsia-300/10 p-4">
                <p className="text-xs text-slate-300">Lượt ván này</p>
                <p className="text-3xl font-black text-fuchsia-100">{totalMoves}</p>
              </div>
            </div>
          </div>

          <div className="game-panel rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
            <h2 className="text-lg font-black text-white">Quiz</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="stat-tile rounded-2xl bg-emerald-300/10 p-4">
                <p className="text-xs text-slate-300">Đúng</p>
                <p className="text-3xl font-black text-emerald-100">{correctAnswers}</p>
              </div>
              <div className="stat-tile rounded-2xl bg-rose-300/10 p-4">
                <p className="text-xs text-slate-300">Sai</p>
                <p className="text-3xl font-black text-rose-100">{wrongAnswers}</p>
              </div>
            </div>
          </div>

          {cardMessage ? (
            <div className="status-toast rounded-[1.5rem] border border-cyan-300/25 bg-cyan-300/10 p-5 text-sm font-semibold leading-6 text-cyan-50 backdrop-blur">
              {cardMessage}
            </div>
          ) : null}
        </aside>

        <section className="play-board-panel order-1 rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-2 shadow-2xl shadow-fuchsia-950/20 backdrop-blur sm:rounded-[2rem] sm:p-4 xl:order-2">
          <div className="mobile-play-controls">
          <div className="mobile-play-header mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:mb-4 sm:flex sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="hidden text-xs font-black uppercase tracking-[0.24em] text-cyan-200 sm:block">Caro Quiz Battle</p>
              <h2 className="truncate text-base font-black leading-tight text-white sm:mt-1 sm:text-2xl">{turnLabel}</h2>
            </div>
            <div className="flex shrink-0 gap-1.5 sm:gap-2">
              <button
                aria-label={soundActive ? "Tắt âm thanh" : "Bật âm thanh"}
                className="min-h-8 rounded-lg border border-white/10 px-2 py-1.5 text-[0.68rem] font-bold text-white transition hover:border-cyan-300 hover:bg-cyan-300/10 sm:min-h-0 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm"
                onClick={() => setSoundActive(toggleSound())}
                title={soundActive ? "Âm thanh: Đang bật" : "Âm thanh: Đang tắt"}
                type="button"
              >
                {soundActive ? "🔊" : "🔇"}
              </button>
              <button
                className="min-h-8 rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.68rem] font-bold text-white transition hover:border-cyan-300 hover:bg-cyan-300/10 sm:min-h-0 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                onClick={resetGame}
                type="button"
              >
                Chơi lại
              </button>
              <Link
                className="min-h-8 rounded-lg bg-white/10 px-2.5 py-1.5 text-center text-[0.68rem] font-bold text-white transition hover:bg-white/15 sm:min-h-0 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                href="/leaderboard"
              >
                BXH
              </Link>
            </div>
          </div>

          <div className="mobile-stat-grid mb-2 grid grid-cols-4 gap-1.5 xl:hidden">
            <div className="mobile-stat rounded-lg bg-cyan-300/10 px-1.5 py-1.5 text-center">
              <p className="text-[0.58rem] font-bold leading-none text-slate-300">Điểm</p>
              <p className="mt-0.5 text-base font-black leading-none text-cyan-100">{score}</p>
            </div>
            <div className="mobile-stat rounded-lg bg-fuchsia-300/10 px-1.5 py-1.5 text-center">
              <p className="text-[0.58rem] font-bold leading-none text-slate-300">Lượt</p>
              <p className="mt-0.5 text-base font-black leading-none text-fuchsia-100">{totalMoves}</p>
            </div>
            <div className="mobile-stat rounded-lg bg-emerald-300/10 px-1.5 py-1.5 text-center">
              <p className="text-[0.58rem] font-bold leading-none text-slate-300">Đúng</p>
              <p className="mt-0.5 text-base font-black leading-none text-emerald-100">{correctAnswers}</p>
            </div>
            <div className="mobile-stat rounded-lg bg-rose-300/10 px-1.5 py-1.5 text-center">
              <p className="text-[0.58rem] font-bold leading-none text-slate-300">Sai</p>
              <p className="mt-0.5 text-base font-black leading-none text-rose-100">{wrongAnswers}</p>
            </div>
          </div>

          {cardMessage ? (
            <div className="mobile-card-message mb-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold leading-4 text-cyan-50 xl:hidden">
              {cardMessage}
            </div>
          ) : null}
          </div>

          <GameBoard
            board={board}
            disabled={
              turn !== "player" ||
              Boolean(roundResult) ||
              Boolean(currentQuestion) ||
              Boolean(cardChoices) ||
              Boolean(targetingCard) ||
              isPlayerFrozen
            }
            freezeLabel={isPlayerFrozen ? "Sàn của bạn bị đóng băng 8s" : "Đối thủ bị đóng băng 8s"}
            frozen={isPlayerFrozen || (isBotFrozen && turn === "bot")}
            onCellClick={handleCellClick}
            winnerState={winnerState}
          />

          {roundResult ? (
            <div className="mobile-round-result round-result-pop mt-5 rounded-[1.5rem] border border-yellow-300/30 bg-yellow-300/10 p-5 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-yellow-100">Kết quả ván</p>
              <h3 className="mt-2 text-4xl font-black text-white">{getResultLabel(roundResult)}</h3>
              <p className="mt-2 text-slate-200">
                +{getRoundBonus(roundResult, totalMoves)} điểm thưởng. Ván mới sẽ tự bắt đầu, điểm tiếp tục cộng dồn.
              </p>
              {submitStatus ? <p className="mt-2 text-sm text-cyan-100">{submitStatus}</p> : null}
            </div>
          ) : null}
        </section>

        <aside className="play-side-panel order-3 space-y-3 sm:space-y-4">
          <Leaderboard
            captureEnabled
            clearEnabled
            compact
            currentPlayer={{
              playerName,
              score,
              result: roundResult ?? "draw",
              correctAnswers,
              wrongAnswers,
              totalMoves,
            }}
            limit={5}
            selectMode={
              targetingCard
                ? {
                    label: targetActionLoading ? "Đang xử lý" : "Chọn đối thủ",
                    helper:
                      targetingCard.kind === "steal"
                        ? `Bấm người muốn cướp ${targetingCard.percent ?? 30}% điểm.`
                        : "Bấm người muốn chia đều điểm.",
                    disabledPlayerName: playerName,
                    onSelect: chooseTarget,
                  }
                : null
            }
          />

          <div className="game-panel hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5 text-sm leading-6 text-slate-300 backdrop-blur sm:block">
            <h2 className="mb-3 text-lg font-black text-white">Luật nhanh</h2>
            <p>Bàn 15x15. Người chơi là X, bot là O. Ai có 5 quân liên tiếp theo ngang, dọc hoặc chéo sẽ thắng.</p>
            <p className="mt-3">Sau mỗi 3 lượt của bạn, game mở quiz. Đúng: +30 điểm và chọn 1 lá bài. Sai: mất 50% điểm.</p>
            <p className="mt-3">Lá Cướp điểm và Chia điểm sẽ yêu cầu chọn trực tiếp một người trên leaderboard.</p>
            <p className="mt-3">Lá Đóng băng sẽ khóa sàn của bạn hoặc làm chậm bot trong 8 giây.</p>
            <p className="mt-3">Thắng ván sẽ cộng thưởng và tự sang ván mới, điểm không bị reset.</p>
          </div>
        </aside>
      </div>

      {cardChoices ? (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-md sm:p-4">
          <div className="modal-pop max-h-[calc(100svh-1rem)] w-full max-w-4xl overflow-y-auto rounded-[1.25rem] border border-white/10 bg-slate-950 p-3 text-white shadow-2xl shadow-fuchsia-900/30 sm:rounded-[1.75rem] sm:p-5">
            <div className="mb-5 text-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Chọn phần thưởng</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Chọn 1 trong 3 lá bài</h2>
              <p className="mt-2 text-sm text-slate-300">Có lá tăng điểm, có lá rủi ro. Chọn xong game sẽ tiếp tục.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {cardChoices.map((card) => (
                <button
                  className={[
                    "card-choice min-h-44 rounded-[1.1rem] border p-4 text-center transition sm:min-h-56 sm:rounded-[1.5rem] sm:p-5",
                    revealedCardId === card.id
                      ? "border-yellow-200 bg-gradient-to-br from-yellow-300/20 via-fuchsia-500/20 to-cyan-300/20 shadow-2xl shadow-yellow-400/20"
                      : "border-cyan-300/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-950 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-500/20",
                    cardRevealBusy && revealedCardId !== card.id ? "cursor-not-allowed opacity-45" : "",
                  ].join(" ")}
                  disabled={cardRevealBusy}
                  key={card.id}
                  onClick={() => chooseCard(card)}
                  type="button"
                >
                  {revealedCardId === card.id ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
                          Đã lật
                        </span>
                        <span className="rounded-full bg-slate-950/40 px-3 py-1 text-lg font-black text-white">
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-black text-white sm:mt-8 sm:text-2xl">{card.title}</h3>
                      <p className="mt-4 text-sm font-semibold leading-6 text-slate-100">{card.description}</p>
                      <div className="mt-6 rounded-full bg-yellow-200/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-yellow-100">
                        Đang áp dụng...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-200/10 text-4xl font-black text-cyan-100 sm:h-20 sm:w-20 sm:text-5xl">
                        ?
                      </div>
                      <h3 className="mt-5 text-xl font-black text-white sm:mt-8 sm:text-2xl">Lá bài bí mật</h3>
                      <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
                        Nội dung đang úp. Chọn lá này để lật và đọc hiệu ứng.
                      </p>
                      <div className="mt-8 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                        Chọn lá
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {targetingCard ? (
        <div className="target-banner fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(94vw,680px)] -translate-x-1/2 rounded-[1rem] border border-cyan-300/30 bg-slate-950/95 p-3 text-center text-white shadow-2xl shadow-cyan-900/40 sm:bottom-4 sm:rounded-[1.5rem] sm:p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">{targetingCard.title}</p>
          <p className="mt-1 text-sm text-slate-200">
            {targetingCard.kind === "steal"
              ? `Hãy bấm một đối thủ trên leaderboard để cướp ${targetingCard.percent ?? 30}% điểm của họ.`
              : "Hãy bấm một đối thủ trên leaderboard để chia đều tổng điểm của hai bên."}
          </p>
          <button
            className="mt-3 rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-slate-100 transition hover:bg-white/10"
            disabled={targetActionLoading}
            onClick={() => {
              setTargetingCard(null);
              setCardMessage("Đã bỏ chọn lá mục tiêu, game tiếp tục.");
              resumeAfterQuiz(false);
            }}
            type="button"
          >
            Bỏ qua lá này
          </button>
        </div>
      ) : null}

      <QuizModal onResolve={handleQuizResolve} question={currentQuestion} />
    </main>
  );
}
