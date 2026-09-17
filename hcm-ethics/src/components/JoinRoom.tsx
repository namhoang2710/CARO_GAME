"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/roomClient";
import { clearGameSession, clearLegacyStorage, readCredential, saveCredential } from "@/lib/sessionStorage";
import type { PlayerCredential, RoomSnapshot } from "@/lib/sessionTypes";

export default function JoinRoom() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resume, setResume] = useState<PlayerCredential | null>(null);
  useEffect(() => {
    clearLegacyStorage();
    const existing = readCredential();
    // Browser state is loaded after hydration to keep server/client markup equal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResume(existing);
    const query = new URLSearchParams(window.location.search).get("room");
    if (query && /^\d{6}$/.test(query)) setCode(query);
  }, []);
  async function join(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const existing = readCredential();
      const credential = existing?.code === code && existing.name === name.trim() ? existing : { code, name: name.trim(), token: crypto.randomUUID() };
      saveCredential(credential);
      await api<RoomSnapshot>("/api/rooms", { action: "join", code, name }, credential);
      window.location.assign(`/play?room=${code}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa vào được phòng."); setBusy(false); }
  }
  return <main className="join-page">
    <header className="site-header"><Link className="brand" href="/">caro<span>club.</span></Link><Link className="text-link" href="/admin">Dành cho quản trò ↗</Link></header>
    <div className="join-layout">
      <section className="join-intro"><p className="eyebrow">MLN131 · CHƠI CÙNG LỚP</p>
        <h1>Một nước cờ.<br />Một lần <span>bứt phá.</span></h1>
        <p className="intro-copy">Đấu Caro với bot, chinh phục quiz và lật thẻ bất ngờ. Cùng bắt đầu, cùng đua lên bảng xếp hạng.</p>
        <div className="game-facts"><span>15 × 15 <small>Bàn cờ</small></span><span>45 <small>Câu hỏi</small></span><span>01 <small>Nhà vô địch</small></span></div>
        <p className="quiet">Nhận mã từ quản trò. Vào phòng. Chờ hiệu lệnh.</p>
      </section>
      <section className="join-panel panel"><div className="mini-marks" aria-hidden="true"><span>×</span><span>○</span></div>
        <p className="eyebrow">SẴN SÀNG CHƯA?</p><h2>Vào phòng chơi</h2><p className="muted">Nhập mã phiên đang hiển thị trên màn hình lớp.</p>
        <form onSubmit={join} className="form-stack">
          <label>Mã phòng<input autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" placeholder="000 000" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="pin-input" /></label>
          <label>Tên của bạn<input autoComplete="nickname" placeholder="Tên để mọi người nhận ra bạn" maxLength={28} required value={name} onChange={(e) => setName(e.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="button primary" disabled={busy || code.length !== 6 || !name.trim()}>{busy ? "Đang vào phòng…" : "Tham gia phòng →"}</button>
        </form>
        {resume && <div className="resume-row"><Link href={`/play?room=${resume.code}`}>Tiếp tục phòng {resume.code}</Link><button className="text-link" onClick={() => { clearGameSession(); setResume(null); }}>Quên phiên</button></div>}
        <p className="panel-note">Game chỉ bắt đầu khi quản trò mở phiên.</p>
      </section>
    </div>
    <footer className="site-footer"><span>Caro Quiz Battle</span><span>MLN131 · Sứ mệnh lịch sử của giai cấp công nhân</span></footer>
  </main>;
}
