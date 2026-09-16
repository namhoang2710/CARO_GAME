"use client";

import { useSyncExternalStore } from "react";

const DEFAULT_GAME_URL = "https://hcm-pro-black.vercel.app/game";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot() {
  if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_GAME_URL) {
    return `${window.location.origin}/game`;
  }
  return normalizeGameUrl(process.env.NEXT_PUBLIC_GAME_URL || DEFAULT_GAME_URL);
}

function getServerSnapshot() {
  return normalizeGameUrl(process.env.NEXT_PUBLIC_GAME_URL || DEFAULT_GAME_URL);
}

export default function QRCodeJoin() {
  const currentUrl = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=18&data=${encodeURIComponent(
    currentUrl,
  )}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-[2rem] border border-cyan-300/40 bg-white p-4 shadow-2xl shadow-cyan-500/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="QR code vào game Caro Quiz Battle" className="h-64 w-64 rounded-2xl md:h-80 md:w-80" src={qrUrl} />
      </div>
      <a
        className="max-w-full break-all rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-center text-sm font-semibold text-cyan-100 transition hover:bg-white/15"
        href={currentUrl}
        rel="noreferrer"
        target="_blank"
      >
        {currentUrl}
      </a>
    </div>
  );
}

function normalizeGameUrl(url: string) {
  const trimmedUrl = url.trim().replace(/\/$/, "");

  if (trimmedUrl.endsWith("/game")) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/game`;
}
