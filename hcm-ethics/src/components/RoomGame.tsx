"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import GameBoard from "./GameBoard";
import Leaderboard from "./Leaderboard";
import QuizModal from "./QuizModal";
import RoomClock from "./RoomClock";
import PlayerScore from "./PlayerScore";
import ScoreHistory from "./ScoreHistory";
import { api } from "@/lib/roomClient";
import type { GameAction, PlayerCredential, RoomSnapshot } from "@/lib/sessionTypes";
import { playMoveSound, playCorrectSound, playWrongSound, playCardSound, toggleSound, isSoundEnabled, disposeAudio } from "@/lib/soundEffects";

export default function RoomGame({ snapshot, credential, accept, refresh, connectionError }: {
  snapshot: RoomSnapshot; credential: PlayerCredential; accept: (data: RoomSnapshot) => void; refresh: () => void; connectionError: string;
}) {
  const [pending, setPending] = useState<GameAction | null>(null);
  const busy = pending !== null;
  const [error, setError] = useState("");
  const [sound, setSound] = useState(isSoundEnabled);
  const [expired, setExpired] = useState(false);
  const [optimistic, setOptimistic] = useState<{ row: number; col: number } | null>(null);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const me = snapshot.me!;
  const game = me.game;
  useEffect(() => () => { controller.current?.abort(); disposeAudio(); }, []);

  const act = useCallback(async (move: GameAction) => {
    if (inFlight.current || expired) return;
    inFlight.current = true;
    controller.current = new AbortController();
    const request = controller.current;
    setPending(move); setError("");
    if (move.type === "move") { setOptimistic({ row: move.row!, col: move.col! }); playMoveSound(); }
    try {
      const data = await api<RoomSnapshot>("/api/rooms", { action: "play", code: credential.code, version: me.version, actionId: crypto.randomUUID(), move }, credential, request.signal);
      if (request.signal.aborted) return;
      accept(data);
      if (move.type === "answer") { if (data.me?.game.feedback?.correct) playCorrectSound(); else playWrongSound(); }
      if (move.type === "card") playCardSound();
    } catch (e) {
      if (!request.signal.aborted) { setError(e instanceof Error ? e.message : "Chưa thực hiện được thao tác."); refresh(); }
    } finally {
      inFlight.current = false;
      if (!request.signal.aborted) { setPending(null); setOptimistic(null); }
    }
  }, [accept, credential, me.version, refresh, expired]);

  useEffect(() => {
    if (busy || error || connectionError) return;
    const wait = game.stage === "frozen" ? Math.max(50, game.frozenUntil - Date.parse(snapshot.serverTime) + 100) : null;
    if (wait === null) return;
    const timer = setTimeout(() => { void act({ type: "thaw" }); }, wait);
    return () => clearTimeout(timer);
  }, [act, busy, error, connectionError, game.stage, game.frozenUntil, snapshot.serverTime]);

  const board = optimistic ? game.board.map((row, r) => row.map((cell, c) => r === optimistic.row && c === optimistic.col ? "X" as const : cell)) : game.board;
  return <div className="play-layout"><section className="board-panel panel"><div className="board-topline">
    <div><p className="eyebrow">LƯỢT CHƠI DUY NHẤT · BẠN LÀ <span className="text-x">X</span></p><h1>{busy ? pending.type === "move" ? "Bot đang đi…" : "Đang lưu thao tác…" : game.stage === "move" ? "Đến lượt bạn." : game.stage === "round" ? game.result === "win" ? "Bạn thắng ván này!" : game.result === "lose" ? "Bot thắng ván này." : "Ván cờ hòa." : game.stage === "frozen" ? "Đóng băng 8 giây" : "Chinh phục thử thách"}</h1></div>
    <button type="button" className="button subtle small" aria-pressed={sound} onClick={() => setSound(toggleSound())}>{sound ? "Âm thanh: bật" : "Âm thanh: tắt"}</button>
  </div>
  <PlayerScore me={me} rank={snapshot.players.findIndex((player) => player.id === me.id) + 1} />
  <div className="board-progress"><span>{game.stage === "round" ? "Ván đã hoàn thành" : game.stage === "move" ? "Mỗi 3 lượt mở một quiz" : "Thử thách của bạn"}</span><div className="quiz-pips" aria-hidden="true">{[0, 1, 2].map((pip) => <i key={pip} className={game.stage !== "move" || Math.ceil(game.roundMoves / 2) % 3 > pip ? "filled" : ""} />)}</div></div>
  <div className="board-stage"><GameBoard board={board} winnerState={game.winner} disabled={busy || expired || Boolean(connectionError) || game.stage !== "move"} onCellClick={(row, col) => { void act({ type: "move", row, col }); }} />
    {(game.stage === "frozen" || expired) && <div className="board-cover"><strong>{expired ? "Đã hết thời gian" : "Chờ tan băng"}</strong>{game.stage === "frozen" && !expired && <RoomClock endsAt={new Date(game.frozenUntil).toISOString()} serverTime={snapshot.serverTime} />}
      {(error || connectionError) && <button className="button" onClick={() => { void act({ type: "thaw" }); }}>Thử lại</button>}</div>}
  </div>
  <div className="board-caption"><span><i className="legend-x" /> Bạn · X</span><span><i className="legend-o" /> Bot · O</span><span>Nối 5 quân để thắng</span></div>
  {game.message && <p className="game-message" role="status">{game.message}</p>}
  {(error || connectionError) && <p className="error" role="alert">{error || connectionError} <button className="text-link" onClick={refresh}>Kết nối lại</button></p>}
  {game.stage === "round" && <p className="completed-notice" role="status">Đã hoàn thành lượt chơi. Bạn có thể theo dõi bảng xếp hạng và chờ phiên mới; không có ván chơi lại trong phiên này.</p>}
  </section><aside className="play-sidebar"><div className="session-timer panel"><div><p className="eyebrow">THỜI GIAN CÒN LẠI</p><span>Phòng {snapshot.room.code}</span></div><RoomClock endsAt={snapshot.room.ends_at} serverTime={snapshot.serverTime} onExpire={() => { setExpired(true); refresh(); }} /></div>
    <Leaderboard players={snapshot.players} currentId={me.id} busy={busy} onTarget={game.stage === "target" ? (targetId) => { void act({ type: "target", targetId }); } : undefined} />
    {game.stage === "target" && <button className="button full-width" disabled={busy} onClick={() => { void act({ type: "skip" }); }}>Bỏ qua thẻ này</button>}
    <ScoreHistory key={me.id} history={me.history} credential={credential} />
    <details className="rules panel"><summary>Luật chơi & cách tính điểm</summary><p>Mỗi người chỉ chơi một ván mỗi phiên. Mỗi 3 lượt của bạn mở một câu quiz. Đúng +30 điểm và chọn thẻ; sai mất 50% điểm.</p><p>Thắng +100, hòa +50, thua +20. Thắng dưới 15 nước cả hai bên được thêm 50 điểm. Hết ván không chơi lại; bảng điểm vẫn cập nhật thẻ tác động từ người khác đến hết phiên.</p><p>Thẻ có thể cộng, trừ, nhân đôi, cướp, chia điểm hoặc đóng băng. Điểm tối đa một tỷ. Cùng điểm: người vào phòng trước xếp trên.</p></details>
  </aside><QuizModal game={game} pending={pending} error={error || connectionError} onAnswer={(index) => { void act({ type: "answer", index }); }} onContinue={() => { void act({ type: "continue" }); }} onCard={(index) => { void act({ type: "card", index }); }} onAcknowledge={() => { void act({ type: "acknowledge" }); }} /></div>;
}
