import type { PlayerCredential } from "./sessionTypes";

const KEY = "caro:session:v1";
const LEGACY = ["caro-player-name", "caro_quiz_leaderboard_data"];

export function clearGameSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* Restricted browser storage. */ }
  try {
    for (const key of LEGACY) localStorage.removeItem(key);
    for (const key of Object.keys(localStorage)) if (key.startsWith("caro:")) localStorage.removeItem(key);
  } catch { /* No persistent storage is required to view a room. */ }
  // Only app-owned CacheStorage entries; never clear another app's caches.
  if (typeof caches !== "undefined") {
    void caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("caro-")).map((key) => caches.delete(key)))).catch(() => {});
  }
}

export function readCredential(): PlayerCredential | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (value && /^\d{6}$/.test(value.code) && /^[0-9a-f-]{36}$/i.test(value.token) && typeof value.name === "string") return value;
  } catch { /* Corrupt or blocked storage. */ }
  return null;
}

export function saveCredential(credential: PlayerCredential) {
  clearGameSession();
  try { sessionStorage.setItem(KEY, JSON.stringify(credential)); }
  catch { throw new Error("Trình duyệt đang chặn lưu phiên. Hãy cho phép lưu trữ cho trang này để tham gia."); }
}

export function clearLegacyStorage() {
  try { for (const key of LEGACY) localStorage.removeItem(key); } catch { /* Optional cleanup. */ }
}
