"use client";
import { memo } from "react";
import type { Participant } from "@/lib/sessionTypes";

export default memo(function Leaderboard({ players, currentId, finished = false, onTarget, busy = false }: {
  players: Participant[]; currentId?: string; finished?: boolean; onTarget?: (id: string) => void; busy?: boolean;
}) {
  return <section className="leaderboard panel"><div className="section-heading"><div><p className="eyebrow">{finished ? "KẾT QUẢ CHÍNH THỨC" : "BẢNG ĐIỂM CỦA PHIÊN"}</p>
    <h2>Bảng xếp hạng</h2></div><span className="count-label">{players.length} người</span></div>
    {onTarget && <p className="notice">Chọn một đối thủ để áp dụng thẻ, hoặc bỏ qua.</p>}
    {!players.length ? <div className="empty-state"><strong>Chưa có người tham gia</strong><p>Chia sẻ mã phòng để cả lớp cùng vào.</p></div> :
      <ol className="rank-list">{players.map((player, index) => <li key={player.id} className={`${index === 0 && finished ? "champion" : ""} ${player.id === currentId ? "is-you" : ""}`}>
        <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="rank-person"><strong>{player.name}{player.id === currentId && <small> Bạn</small>}</strong><span>{player.wins} ván thắng · {player.correct} câu đúng</span></div>
        {onTarget ? <button className="button small" disabled={busy || player.id === currentId} onClick={() => onTarget(player.id)}>{player.score.toLocaleString("vi-VN")} đ</button> :
          <strong className="rank-score">{player.score.toLocaleString("vi-VN")}<small>điểm</small></strong>}
      </li>)}</ol>}
  </section>;
});
