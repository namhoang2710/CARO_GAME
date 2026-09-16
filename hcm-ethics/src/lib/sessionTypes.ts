import type { Board, GameResult, WinnerState } from "./gameLogic";

export type Room = {
  id: string; code: string; title: string; status: "waiting" | "active" | "finished";
  capacity: number; duration_minutes: number; created_at: string;
  started_at: string | null; ends_at: string | null; ended_at: string | null; revision: number;
};
export type Participant = {
  id: string; name: string; score: number; wins: number; correct: number;
  wrong: number; moves: number; joined_at: string; last_seen: string;
};
export type Card = {
  kind: "gain" | "double" | "lose" | "steal" | "split" | "freeze" | "gamble";
  title: string; value: number;
};
export type GameView = {
  board: Board; stage: "move" | "quiz" | "feedback" | "cards" | "reveal" | "target" | "frozen" | "round";
  round: number; roundMoves: number; result: GameResult | null; winner: WinnerState;
  question: { id: string; question: string; options: string[]; difficulty: string } | null;
  feedback: { correct: boolean; correctIndex: number; explanation: string; selected: number } | null;
  cardCount: number; targetCard: Card | null; revealedCard?: Card | null; frozenUntil: number; message: string;
};
export type RoomSnapshot = {
  room: Room; players: Participant[]; serverTime: string;
  me: (Participant & { version: number; game: GameView }) | null;
};
export type PlayerCredential = { code: string; token: string; name: string };
export type GameAction = {
  type: "move" | "answer" | "continue" | "card" | "acknowledge" | "target" | "skip" | "thaw" | "next";
  row?: number; col?: number; index?: number; targetId?: string;
};
