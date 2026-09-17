"use client";
import { describeScoreEvent, formatPoints, signedPoints } from "@/lib/scoreHistory";
import type { RoomSnapshot } from "@/lib/sessionTypes";

export default function PlayerScore({ me, rank }: { me: NonNullable<RoomSnapshot["me"]>; rank: number }) {
  const latest = me.history?.events[0];
  return <div className="personal-score">
    <div className="score-identity"><span className="avatar">{me.name.charAt(0).toUpperCase()}</span><div><strong>{me.name}</strong><span>Hành trình của bạn</span></div><span className="personal-rank">Hạng <b>#{rank}</b></span></div>
    <div className="score-metrics"><div className="score-main"><span className="eyebrow">ĐIỂM HIỆN TẠI</span><div className="score-number-line"><strong className="score-number" key={me.score}>{formatPoints(me.score)}</strong><span>điểm</span></div></div>
      <div className="score-detail"><strong>{me.correct}</strong><span>quiz đúng</span></div><div className="score-detail"><strong>{me.wins}</strong><span>ván thắng</span></div></div>
    <div className={`score-latest ${latest && latest.delta < 0 ? "is-loss" : "is-gain"}`} role="status" aria-live="polite">
      {latest ? <div key={latest.id}><strong>{signedPoints(latest.delta)}<small>đ</small></strong><span>{describeScoreEvent(latest)}</span></div> : <div><span className="score-ready-dot" /><span>Sẵn sàng ghi dấu điểm đầu tiên.</span></div>}
    </div>
  </div>;
}
