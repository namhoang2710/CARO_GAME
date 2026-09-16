"use client";
import { useEffect, useRef } from "react";
import type { GameView } from "@/lib/sessionTypes";

export default function QuizModal({ game, busy, error, onAnswer, onContinue, onCard }: {
  game: GameView; busy: boolean; error: string; onAnswer: (index: number) => void; onContinue: () => void; onCard: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const show = ["quiz", "feedback", "cards"].includes(game.stage);
  useEffect(() => {
    if (show && !dialog.current?.open) dialog.current?.showModal();
    if (!show) dialog.current?.close();
  }, [show]);
  return <dialog className="game-dialog" ref={dialog} onCancel={(event) => event.preventDefault()} aria-labelledby="quiz-title">
    {game.stage === "cards" ? <><p className="eyebrow">PHẦN THƯỞNG CỦA BẠN</p><h2 id="quiz-title">Chọn một lá. Đổi cuộc đua.</h2>
      <p className="muted">Có cơ hội, cũng có rủi ro. Hiệu ứng chỉ lộ khi bạn chọn.</p>
      <div className="card-grid">{Array.from({ length: game.cardCount }, (_, index) => <button key={index} disabled={busy} className="mystery-card" onClick={() => onCard(index)}><span aria-hidden="true">?</span><strong>Lá {index + 1}</strong><small>Lật thẻ →</small></button>)}</div></> :
      <><div className="section-heading"><p className="eyebrow">QUIZ · +30 ĐIỂM</p><span className="count-label">{game.question?.difficulty === "easy" ? "Cơ bản" : game.question?.difficulty === "hard" ? "Thử thách" : "Vận dụng"}</span></div>
        <h2 id="quiz-title">{game.question?.question}</h2><div className="answer-list">{game.question?.options.map((option, index) =>
          <button key={`${game.question?.id}-${index}`} disabled={busy || Boolean(game.feedback)} onClick={() => onAnswer(index)}
            className={`answer ${game.feedback?.correctIndex === index ? "answer-correct" : ""} ${game.feedback && game.feedback.selected === index && !game.feedback.correct ? "answer-wrong" : ""}`}>
            <span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        {game.feedback && <div className="quiz-feedback"><strong>{game.feedback.correct ? "Chính xác! +30 điểm." : "Chưa đúng. Mất 50% điểm hiện tại."}</strong><p>{game.feedback.explanation}</p>
          <button className="button primary" disabled={busy} onClick={onContinue}>Tiếp tục →</button></div>}
      </>}
    {busy && <p className="quiet" role="status">Đang xử lý…</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </dialog>;
}
