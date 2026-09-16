"use client";
import { useEffect, useRef, useState } from "react";

export default function RoomClock({ endsAt, serverTime, onExpire }: { endsAt: string | null; serverTime: string; onExpire?: () => void }) {
  const [now, setNow] = useState(() => Date.parse(serverTime));
  const fired = useRef(false);
  useEffect(() => {
    const offset = Date.parse(serverTime) - Date.now();
    const tick = () => setNow(Date.now() + offset);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [serverTime]);
  const seconds = endsAt ? Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000)) : 0;
  useEffect(() => {
    if (endsAt && seconds === 0 && !fired.current) { fired.current = true; onExpire?.(); }
  }, [endsAt, seconds, onExpire]);
  return <span className={`room-clock ${seconds < 60 ? "clock-urgent" : ""}`} aria-label={`Còn ${Math.floor(seconds / 60)} phút ${seconds % 60} giây`}>
    {String(Math.floor(seconds / 60)).padStart(2, "0")}<span>:</span>{String(seconds % 60).padStart(2, "0")}
  </span>;
}
