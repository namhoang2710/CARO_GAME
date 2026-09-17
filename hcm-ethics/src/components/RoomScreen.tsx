"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { readCredential } from "@/lib/sessionStorage";
import { api } from "@/lib/roomClient";
import type { Participant, PlayerCredential } from "@/lib/sessionTypes";
import Leaderboard from "./Leaderboard";
import RoomGame from "./RoomGame";
import ScoreHistory from "./ScoreHistory";
import RoomClock from "./RoomClock";
import QRCodeJoin from "./QRCodeJoin";

function downloadResults(code: string, players: Participant[]) {
  const cell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const rows = [["Hạng", "Tên", "Điểm", "Ván thắng", "Câu đúng", "Câu sai"], ...players.map((p, i) => [i + 1, p.name, p.score, p.wins, p.correct, p.wrong])];
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `caro-${code}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function RoomScreen({ code, mode = "player" }: { code: string; mode?: "player" | "host" | "spectator" }) {
  const [credential, setCredential] = useState<PlayerCredential | null>(null);
  const [ready, setReady] = useState(mode !== "player");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (mode !== "player") return;
    const stored = readCredential();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCredential(stored?.code === code ? stored : null);
    setReady(true);
  }, [code, mode]);
  const { snapshot, error, live, accept, refresh } = useRoom(ready ? code : "", credential);
  async function control(action: string, playerId?: string) {
    if (busy) return;
    if (action === "end" && !window.confirm("Kết thúc phiên cho tất cả người chơi và chốt bảng xếp hạng?")) return;
    setBusy(true); setActionError("");
    try { await api("/api/admin", { action, code, playerId }); refresh(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Không thực hiện được thao tác."); }
    finally { setBusy(false); }
  }
  if (!/^\d{6}$/.test(code)) return <main className="center-page"><div className="panel empty-state"><h1>Bạn cần mã phòng.</h1><p>Nhận mã 6 số từ quản trò để tham gia hoặc xem kết quả.</p><Link href="/" className="button primary">Về trang tham gia</Link></div></main>;
  if (!snapshot) return <main className="center-page"><div className="panel loading-panel" aria-busy={!error}><h1>{error ? "Chưa mở được phòng" : "Đang kết nối phòng…"}</h1><p role={error ? "alert" : "status"}>{error || `Mã ${code}`}</p><div className="actions"><button className="button" onClick={refresh}>Thử lại</button><Link className="text-link" href="/">Về trang chủ</Link></div></div></main>;
  const { room, players, me } = snapshot;
  const waiting = room.status === "waiting";
  const finished = room.status === "finished";
  const host = mode === "host";
  const online = players.filter((p) => Date.parse(snapshot.serverTime) - Date.parse(p.last_seen) < 45000).length;
  return <main className={`room-page ${mode === "spectator" ? "presenter-view" : ""}`}>
    <header className="site-header"><Link className="brand" href="/">caro<span>club.</span></Link><div className="header-room"><span>Phòng <strong>{code}</strong></span><span className={`status-tag ${finished ? "finished" : ""}`}>{finished ? "Đã kết thúc" : waiting ? "Phòng chờ" : "Đang chơi"}</span></div>
      <Link href={host ? "/admin" : "/"} className="text-link">{host ? "Các phiên" : "Trang chủ"} ↗</Link></header>
    {!finished && <div className="connection-line" role="status"><span className={`connection-dot ${live && !error ? "online" : ""}`} />{error ? "Mất kết nối · đang thử lại" : live ? "Đang kết nối trực tiếp" : "Đang cập nhật định kỳ"}<button className="text-link" onClick={refresh}>Làm mới</button></div>}
    {(actionError || (error && (waiting || finished || mode !== "player"))) && <p className="error" role="alert">{actionError || error}</p>}

    {waiting ? <><div className="lobby-layout"><section className="lobby-heading"><p className="eyebrow">{host ? "BẠN LÀ QUẢN TRÒ" : "CẢ LỚP CÙNG SẴN SÀNG"}</p><h1>{room.title}</h1><p className="intro-copy">{me ? `${me.name}, bạn đã có mặt. Chờ quản trò bắt đầu nhé!` : "Nhập mã phòng hoặc quét QR để tham gia cuộc đua."}</p>
      <div className="room-pin" aria-label={`Mã phòng ${code}`}>{code.slice(0, 3)} <span>{code.slice(3)}</span></div>
      <div className="lobby-metrics"><span><strong>{players.length}<small>/{room.capacity}</small></strong>người đã tham gia</span><span><strong>{room.duration_minutes}<small> phút</small></strong>thời gian phiên</span></div>
      <div className="actions"><button className="button" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/?room=${code}`); setCopied(true); } catch { setActionError(`Chia sẻ đường dẫn ${window.location.origin}/?room=${code}`); } }}>{copied ? "Đã sao chép link" : "Sao chép link mời"}</button>
        {!me && !host && <Link className="button primary" href={`/?room=${code}`}>Tham gia phòng</Link>}
        {host && <button className="button primary" disabled={busy || players.length === 0} onClick={() => { void control("start"); }}>{busy ? "Đang xử lý…" : `Bắt đầu · ${players.length} người →`}</button>}</div>
      <p className="quiet">{host ? "Bắt đầu sẽ đóng nhận người mới. Người đã vào có thể kết nối lại." : "Mọi người bắt đầu cùng lúc khi quản trò mở phiên."}</p>
    </section><QRCodeJoin code={code} /></div>
    <section className="roster-section"><div className="section-heading"><h2>Đã vào phòng <span className="muted">({players.length})</span></h2><span className="quiet">{online} đang kết nối</span></div>
      {players.length ? <ul className="roster">{[...players].sort((a,b) => a.joined_at.localeCompare(b.joined_at)).map((p) => <li key={p.id}><span className="avatar">{p.name.charAt(0).toUpperCase()}</span><strong>{p.name}</strong>{p.id === me?.id && <small>Bạn</small>}{host && <button className="text-link" disabled={busy} aria-label={`Đưa ${p.name} ra khỏi phòng`} onClick={() => { void control("remove", p.id); }}>×</button>}</li>)}</ul> : <div className="empty-state dashed"><strong>Ghế đầu tiên đang chờ.</strong><p>Đưa mã phòng lên màn hình để mọi người tham gia.</p></div>}
    </section>{host && <button className="text-link danger-text" disabled={busy} onClick={() => { void control("end"); }}>Đóng phòng chờ</button>}</> :
      finished ? <><section className="results-heading"><p className="eyebrow">PHIÊN {code} · HOÀN THÀNH</p><h1>Cuộc đua đã khép lại.</h1><p className="intro-copy">{players[0] ? `Chúc mừng ${players[0].name} dẫn đầu với ${players[0].score.toLocaleString("vi-VN")} điểm!` : "Phiên đã đóng. Hẹn gặp bạn ở phòng tiếp theo."}</p><div className="actions"><Link className="button primary" href={host ? "/admin" : "/"}>{host ? "Tạo phiên tiếp theo →" : "Tham gia phiên khác →"}</Link><button className="button" onClick={() => downloadResults(code, players)}>Tải kết quả CSV</button></div></section><Leaderboard players={players} currentId={me?.id} finished /></> :
        mode === "player" && me && credential ? <RoomGame key={room.id} snapshot={snapshot} credential={credential} accept={accept} refresh={refresh} connectionError={error} /> :
          <><div className="host-live-heading"><div><p className="eyebrow">{room.title}</p><h1>Cuộc đua đang diễn ra.</h1><p className="muted">{players.length} người chơi · {online} đang kết nối</p></div><RoomClock endsAt={room.ends_at} serverTime={snapshot.serverTime} onExpire={refresh} /></div>
          {mode === "player" && <p className="notice">Bạn chưa tham gia phiên này hoặc đã bị đưa ra khỏi phòng. Bạn có thể xem bảng xếp hạng và chờ phiên tiếp theo.</p>}
          <Leaderboard players={players} /><div className="actions">{host && <button className="button danger" disabled={busy} onClick={() => { void control("end"); }}>Kết thúc & chốt điểm</button>}<button className="button" onClick={() => downloadResults(code, players)}>Tải bảng điểm</button></div></>}
    {finished && me && credential && <div className="final-personal-history"><ScoreHistory key={me.id} history={me.history} credential={credential} /></div>}
    {host && <p className="quiet"><Link target="_blank" href={`/presenter?room=${code}`} className="text-link">Mở màn hình trình chiếu ↗</Link></p>}
  </main>;
}
