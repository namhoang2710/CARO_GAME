"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/roomClient";
import { clearGameSession } from "@/lib/sessionStorage";
import type { PlayerCredential, RoomSnapshot } from "@/lib/sessionTypes";

export function useRoom(code: string, credential: PlayerCredential | null) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const sequence = useRef(0);
  const refreshRef = useRef<() => void>(() => {});
  const accept = useCallback((data: RoomSnapshot) => {
    sequence.current++;
    setSnapshot(data);
    setError("");
    if (data.room.status === "finished" && credential) clearGameSession();
  }, [credential]);
  const roomId = snapshot?.room.id;
  const ended = snapshot?.room.status === "finished";

  useEffect(() => {
    if (!/^\d{6}$/.test(code)) return;
    let disposed = false;
    let inFlight = false;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    let generation = 0;
    const controller = new AbortController();
    async function refresh() {
      if (disposed || inFlight || document.hidden) return;
      inFlight = true;
      const ticket = ++sequence.current;
      try {
        const data = await api<RoomSnapshot>(`/api/rooms?code=${code}`, undefined, credential, controller.signal);
        if (!disposed && ticket === sequence.current) accept(data);
      } catch (e) {
        if (!disposed && ticket === sequence.current) setError(e instanceof Error ? e.message : "Mất kết nối.");
      } finally { inFlight = false; }
    }
    // Throttle instead of trailing debounce: a busy room still refreshes on time.
    function schedule() {
      if (!scheduled && !disposed) scheduled = setTimeout(() => { scheduled = undefined; void refresh(); }, 500);
    }
    async function connect() {
      const ticket = ++generation;
      unsubscribe?.(); unsubscribe = undefined;
      if (document.hidden || ended || !roomId) return;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
      if (!url || !key) return;
      try {
        const { createClient } = await import("@supabase/supabase-js");
        if (disposed || ticket !== generation) return;
        const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const channel = db.channel(`room-${roomId}`).on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "caro_rooms", filter: `id=eq.${roomId}`,
        }, schedule).subscribe((status) => {
          if (!disposed && ticket === generation) {
            setLive(status === "SUBSCRIBED");
            if (status === "SUBSCRIBED") schedule();
          }
        });
        unsubscribe = () => { void db.removeChannel(channel); };
      } catch { if (!disposed) setLive(false); }
    }
    function visibility() { void connect(); if (!document.hidden) void refresh(); else setLive(false); }
    refreshRef.current = () => { void refresh(); };
    void refresh(); void connect();
    const poll = ended ? undefined : setInterval(() => { void refresh(); }, 12000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", visibility);
    return () => {
      disposed = true; generation++; controller.abort();
      clearInterval(poll); clearTimeout(scheduled); unsubscribe?.();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", visibility);
    };
  }, [code, credential, accept, roomId, ended]);

  return { snapshot, error, live, accept, refresh: useCallback(() => refreshRef.current(), []) };
}
