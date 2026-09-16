"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, RequestError } from "@/lib/roomClient";
import type { Room } from "@/lib/sessionTypes";
import RoomScreen from "./RoomScreen";

export default function AdminDashboard({ code }: { code?: string }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("Caro Quiz · MLN131");
  const [duration, setDuration] = useState(10);
  const [capacity, setCapacity] = useState(50);
  const [observedAt, setObservedAt] = useState(0);
  const load = useCallback(async () => {
    try { const data = await api<{ authenticated: boolean; rooms: Room[] }>("/api/admin"); setAuthenticated(data.authenticated); setRooms(data.rooms); setObservedAt(Date.now()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Không tải được danh sách phiên."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // Load an external authenticated resource; state updates occur after fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      if (!authenticated) { await api("/api/admin", { action: "login", password }); setPassword(""); await load(); }
      else { const data = await api<{ room: Room }>("/api/admin", { action: "create", title, duration, capacity, actionId: crypto.randomUUID() }); window.location.assign(`/admin?room=${data.room.code}`); }
    } catch (e) { setError(e instanceof Error ? e.message : "Thao tác thất bại."); if (e instanceof RequestError && e.status === 401) setAuthenticated(false); }
    finally { setBusy(false); }
  }
  if (authenticated && code) return <RoomScreen code={code} mode="host" />;
  return <main className="admin-page"><header className="site-header"><Link href="/" className="brand">caro<span>club.</span></Link><span className="eyebrow">BÀN QUẢN TRÒ</span>{authenticated && <button className="text-link" onClick={async () => { try { await api("/api/admin", { action: "logout" }); setAuthenticated(false); } catch (e) { setError(e instanceof Error ? e.message : "Chưa đăng xuất được."); } }}>Đăng xuất</button>}</header>
    <section className="admin-heading"><p className="eyebrow">MỖI PHIÊN, MỘT CUỘC ĐUA MỚI</p><h1>{authenticated ? "Sân chơi do bạn dẫn dắt." : "Chào quản trò."}</h1><p className="intro-copy">Tạo phòng, đón người chơi và bắt đầu khi cả lớp sẵn sàng.</p></section>
    {loading ? <p role="status">Đang kiểm tra đăng nhập…</p> : <div className="admin-layout"><form onSubmit={submit} className="panel form-stack admin-form"><h2>{authenticated ? "Tạo phiên mới" : "Đăng nhập quản trò"}</h2>
      {authenticated ? <><label>Tên phiên<input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></label><div className="form-pair"><label>Thời lượng (phút)<input type="number" min={1} max={120} required value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label><label>Số người tối đa<input type="number" min={1} max={200} required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></label></div><p className="quiet">Bảng điểm bắt đầu từ 0. Phiên mới có mã tham gia riêng.</p></> : <label>Mật khẩu quản trò<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
      {error && <p className="error" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? "Đang xử lý…" : authenticated ? "Tạo phòng chờ →" : "Đăng nhập →"}</button>
    </form>{authenticated && <section><div className="section-heading"><h2>Các phiên gần đây</h2><button className="text-link" onClick={() => { void load(); }}>Làm mới</button></div>{rooms.length ? <ul className="room-list">{rooms.map((room) => <li key={room.id}><Link href={`/admin?room=${room.code}`}><div><strong>{room.title}</strong><small>Mã {room.code} · {room.duration_minutes} phút</small></div><span className="status-tag">{room.status === "waiting" ? "Phòng chờ" : room.status === "finished" || (room.ends_at && Date.parse(room.ends_at) < observedAt) ? "Đã kết thúc" : "Đang chơi"}</span><span aria-hidden="true">↗</span></Link></li>)}</ul> : <div className="empty-state dashed"><strong>Chưa có phiên nào.</strong><p>Tạo phòng đầu tiên để bắt đầu.</p></div>}</section>}</div>}
  </main>;
}
