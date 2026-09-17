"use client";
import { useEffect, useRef } from "react";
import type { GameAction, GameView } from "@/lib/sessionTypes";

export default function QuizModal({ game, pending, error, onAnswer, onContinue, onCard, onAcknowledge }: {
  game: GameView; pending: GameAction | null; error: string; onAnswer: (index: number) => void; onContinue: () => void; onCard: (index: number) => void; onAcknowledge: () => void;
}) {
  const busy = pending !== null;
  const dialog = useRef<HTMLDialogElement>(null);
  const show = ["quiz", "feedback", "cards", "reveal"].includes(game.stage);
  const card = game.revealedCard;
  useEffect(() => {
    if (show && !dialog.current?.open) dialog.current?.showModal();
    if (!show) dialog.current?.close();
  }, [show]);
  return <dialog className="game-dialog" ref={dialog} onCancel={(event) => event.preventDefault()} aria-labelledby="quiz-title">
    {game.stage === "reveal" && card ? <div className="card-reveal"><p className="eyebrow">BẠN ĐÃ BỐC ĐƯỢC</p><h2 id="quiz-title">{card.title}</h2>
      <p>{card.kind === "steal" ? `Chọn một người để lấy ${card.value}% điểm của họ.` : card.kind === "split" ? "Chọn một người để chia đều tổng điểm của hai bạn." : card.kind === "freeze" ? "Bàn cờ sẽ đóng băng 8 giây sau khi bạn xác nhận." : card.kind === "double" ? "Nhân đôi số điểm hiện tại của bạn." : card.kind === "lose" ? `Bạn sẽ mất ${card.value}% số điểm hiện tại.` : `${card.value >= 0 ? "Cộng" : "Trừ"} ${Math.abs(card.value)} điểm vào điểm của bạn.`}</p>
      <button className="button primary full-width" disabled={busy} onClick={onAcknowledge}>{card.kind === "steal" || card.kind === "split" ? "Đã hiểu · Chọn đối thủ →" : "Đã hiểu · Áp dụng thẻ →"}</button></div> : game.stage === "cards" ? <><p className="eyebrow">PHẦN THƯỞNG CỦA BẠN</p><h2 id="quiz-title">Chọn một lá. Đổi cuộc đua.</h2>
      <p className="muted">Có cơ hội, cũng có rủi ro. Hiệu ứng chỉ lộ khi bạn chọn.</p>
      <div className="card-grid">{Array.from({ length: game.cardCount }, (_, index) => <button key={index} disabled={busy} aria-pressed={pending?.type === "card" && pending.index === index} className="mystery-card" onClick={() => onCard(index)}><span aria-hidden="true">?</span><strong>Lá {index + 1}</strong><small>{pending?.type === "card" && pending.index === index ? "Đang lật…" : "Lật thẻ →"}</small></button>)}</div></> :
      <><div className="section-heading"><p className="eyebrow">QUIZ · +30 ĐIỂM</p><span className="count-label">{game.question?.difficulty === "easy" ? "Cơ bản" : game.question?.difficulty === "hard" ? "Thử thách" : "Vận dụng"}</span></div>
        <h2 id="quiz-title">{game.question?.question}</h2><div className="answer-list">{game.question?.options.map((option, index) =>
          <button key={`${game.question?.id}-${index}`} disabled={busy || Boolean(game.feedback)} aria-pressed={pending?.type === "answer" && pending.index === index || game.feedback?.selected === index} onClick={() => onAnswer(index)}
            className={`answer ${game.feedback?.correctIndex === index ? "answer-correct" : ""} ${game.feedback && game.feedback.selected === index && !game.feedback.correct ? "answer-wrong" : ""}`}>
            <span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        {game.feedback && <div className="quiz-feedback"><strong>{game.feedback.correct ? "Chính xác! +30 điểm." : "Chưa đúng. Mất 50% điểm hiện tại."}</strong><p>{game.feedback.explanation}</p>
          <button className="button primary" disabled={busy} onClick={onContinue}>Tiếp tục →</button></div>}
      </>}
    {busy && <p className="quiet" role="status">{pending.type === "answer" ? "Đã chọn đáp án · Đang kiểm tra…" : pending.type === "card" ? "Đã chọn lá bài · Đang mở thẻ…" : "Đang lưu thao tác…"}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </dialog>;
}
