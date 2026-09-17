"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/roomClient";
import { describeScoreEvent, formatPoints, signedPoints } from "@/lib/scoreHistory";
import type { PlayerCredential, ScoreHistoryPage } from "@/lib/sessionTypes";

export default function ScoreHistory({ history, credential }: {
  history: ScoreHistoryPage | null; credential: PlayerCredential;
}) {
  // Keep only one 20-event page in memory, even during a long, busy session.
  const [older, setOlder] = useState<ScoreHistoryPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const page = older ?? history;

  async function loadOlder() {
    if (controller.current || !page?.nextCursor) return;
    const request = new AbortController();
    controller.current = request; setBusy(true); setError("");
    try {
      const data = await api<ScoreHistoryPage>(`/api/rooms?code=${credential.code}&historyBefore=${page.nextCursor}`, undefined, credential, request.signal);
      if (!request.signal.aborted) setOlder(data);
    } catch (e) {
      if (!request.signal.aborted) setError(e instanceof Error ? e.message : "Chưa tải được lịch sử.");
    } finally {
      controller.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  }

  return <section className="score-history panel" aria-labelledby="history-title">
    <div className="section-heading"><div><p className="eyebrow">CHỈ BẠN NHÌN THẤY</p><h2 id="history-title">Dòng điểm của bạn</h2></div>
      <span className="history-seal" aria-label="Lịch sử cá nhân">↗↙</span></div>
    <div className="history-toolbar"><span>{older ? "Đang xem trước đó" : "Mới nhất trước"} · {history?.total ?? 0} sự kiện</span>
      {older && <button className="text-link" disabled={busy} onClick={() => { setOlder(null); setError(""); }}>Về mới nhất</button>}</div>
    {!page?.events.length ? <div className="history-empty"><span aria-hidden="true">±</span><strong>{history ? "Mỗi điểm đều có câu chuyện." : "Lịch sử chưa sẵn sàng"}</strong>
      <p>{history ? "Điểm quiz, thẻ và tương tác với người chơi khác sẽ hiện ở đây." : "Quản trò cần cập nhật SQL lịch sử điểm."}</p></div> :
      <ol className="history-list" key={older?.events[0]?.id ?? "live"} aria-label="Lịch sử cộng trừ điểm cá nhân">
        {page.events.map((event) => <li key={event.id} className={`history-event ${event.delta < 0 ? "is-loss" : event.delta > 0 ? "is-gain" : "is-neutral"}`}>
          <span className="event-symbol" aria-hidden="true">{event.kind === "steal" ? "↗" : event.kind === "stolen" ? "↙" : event.kind.startsWith("split") ? "⇄" : event.delta < 0 ? "−" : event.delta > 0 ? "+" : "·"}</span>
          <div className="event-content"><p>{describeScoreEvent(event)}</p><div className="event-meta"><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><span>Còn {formatPoints(event.balance)} đ</span></div>
            {event.kind === "steal" && event.amount !== event.delta && <small className="muted">Điểm nhận đã giới hạn ở mức tối đa.</small>}</div>
          <strong className="event-delta">{signedPoints(event.delta)}<small>điểm</small></strong>
        </li>)}
      </ol>}
    {error && <p className="error" role="alert">{error}</p>}
    {page?.nextCursor && <button className="button history-more full-width" disabled={busy} onClick={() => { void loadOlder(); }}>{busy ? "Đang tải…" : "Xem 20 sự kiện cũ hơn ↓"}</button>}
    <p className="history-footnote">Ghi nhận số điểm thực tế. Lịch sử bắt đầu từ bản cập nhật này.</p>
  </section>;
}
