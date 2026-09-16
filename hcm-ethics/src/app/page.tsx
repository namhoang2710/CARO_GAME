"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { quizQuestions } from "@/data/questions";

export default function GameHomePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState(() =>
    typeof window === "undefined" ? "" : (localStorage.getItem("caro-player-name") ?? ""),
  );

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = playerName.trim() || "Khách mời";
    localStorage.setItem("caro-player-name", trimmedName);
    router.push("/play");
  }

  return (
    <main className="game-shell game-aurora flex min-h-screen items-center justify-center px-3 py-5 sm:px-4 sm:py-8">
      <section className="grid w-full max-w-6xl items-center gap-5 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="game-home-intro space-y-4 sm:space-y-6">
          <div className="pulse-badge inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg shadow-cyan-500/10 sm:px-4 sm:text-sm">
            MLN131 - Tư tưởng đạo đức Hồ Chí Minh
          </div>
          <div>
            <h1 className="neon-title text-4xl font-black leading-tight sm:text-5xl md:text-7xl">Caro Quiz Battle</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:mt-5 sm:text-lg sm:leading-8">
              Đánh caro với bot, trả lời câu hỏi môn học để chọn thẻ bài cướp điểm và leo bảng xếp hạng realtime!
            </p>
          </div>

          <form
            className="game-start-panel max-w-xl rounded-[1.25rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-fuchsia-900/20 backdrop-blur sm:rounded-[1.5rem] sm:p-5"
            onSubmit={startGame}
          >
            <label className="text-sm font-bold text-slate-200" htmlFor="player-name">
              Tên người chơi
            </label>
            <input
              autoComplete="name"
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15 sm:rounded-2xl sm:py-4 sm:text-lg"
              id="player-name"
              maxLength={28}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Nhập tên của bạn để lên top..."
              value={playerName}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                className="energy-button rounded-xl bg-cyan-300 px-5 py-3 text-base font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:rounded-2xl sm:px-6 sm:py-4"
                type="submit"
              >
                Bắt đầu chơi ngay
              </button>
              <Link
                className="rounded-xl border border-white/10 px-5 py-3 text-center font-bold text-white transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:bg-fuchsia-300/10 sm:rounded-2xl sm:px-6 sm:py-4"
                href="/leaderboard"
              >
                Bảng xếp hạng
              </Link>
            </div>
          </form>
        </div>

        <div className="preview-board float-card rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-cyan-900/20 backdrop-blur sm:rounded-[2rem] sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                className={[
                  "preview-cell aspect-square rounded-xl border border-white/10 bg-white/[0.06] text-center text-3xl font-black leading-[1.9] sm:rounded-2xl sm:text-4xl",
                  index === 0 || index === 4 || index === 8
                    ? "text-cyan-200 shadow-lg shadow-cyan-500/10"
                    : index === 2 || index === 5
                      ? "text-fuchsia-200 shadow-lg shadow-fuchsia-500/10"
                      : "text-slate-700",
                ].join(" ")}
                key={index}
              >
                {index === 0 || index === 4 || index === 8 ? "X" : index === 2 || index === 5 ? "O" : ""}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-cyan-300/15 via-fuchsia-300/15 to-yellow-300/15 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-cyan-100">15x15</p>
                <p className="text-xs text-slate-300">Bàn caro</p>
              </div>
              <div>
                <p className="text-2xl font-black text-fuchsia-100">{quizQuestions.length}</p>
                <p className="text-xs text-slate-300">Câu hỏi Quiz</p>
              </div>
              <div>
                <p className="text-2xl font-black text-yellow-100">Live</p>
                <p className="text-xs text-slate-300">Leaderboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
