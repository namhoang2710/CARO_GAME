import { test, expect, type Page } from "@playwright/test";
import { quizQuestions } from "../../src/data/questions";
import { createHash } from "node:crypto";
import { newGame } from "../../src/lib/server/gameEngine";

async function join(page: Page, code: string, name: string) {
  await page.goto(`/?room=${code}`);
  await page.getByLabel("Tên của bạn").fill(name);
  await page.getByRole("button", { name: "Tham gia phòng →" }).click();
  await expect(page).toHaveURL(new RegExp(`/play\\?room=${code}`));
  await expect(page.getByRole("heading", { name: /Đã vào phòng/ })).toBeVisible();
}

test("admin + two players: lobby gates, live game, quiz, final scores, new-session cleanup", async ({ page: host, browser }) => {
  const errors: string[] = [];
  host.on("pageerror", (e) => errors.push(e.message));
  await host.goto("/admin");
  await host.getByLabel("Mật khẩu quản trò").fill("test-admin-password");
  await host.getByRole("button", { name: "Đăng nhập →" }).click();
  await host.getByLabel("Tên phiên").fill("Phiên kiểm thử lớp MLN131");
  await host.getByLabel("Số người tối đa").fill("2");
  await host.getByRole("button", { name: "Tạo phòng chờ →" }).click();
  await expect(host).toHaveURL(/room=\d{6}/);
  const code = new URL(host.url()).searchParams.get("room")!;
  const c1 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const c2 = await browser.newContext();
  const player = await c1.newPage(); const player2 = await c2.newPage();
  player.on("pageerror", (e) => errors.push(e.message));
  await join(player, code, "Minh Anh"); await join(player2, code, "Tuấn Hưng");
  await expect(player.locator(".game-board")).toHaveCount(0);
  const before = await player.evaluate(async () => {
    const c = JSON.parse(sessionStorage.getItem("caro:session:v1")!);
    return (await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.token}` },
      body: JSON.stringify({ action: "play", code: c.code, version: 0, actionId: crypto.randomUUID(), move: { type: "move", row: 7, col: 7 } }) })).status;
  });
  expect(before).toBe(400);
  await host.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(host.getByRole("button", { name: "Bắt đầu · 2 người →" })).toBeEnabled();
  await host.screenshot({ path: "test-results/lobby-desktop.png", fullPage: true });
  await host.getByRole("button", { name: "Bắt đầu · 2 người →" }).click();
  await player.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(player.locator(".game-board")).toBeVisible({ timeout: 20000 });
  for (const [row, col] of [[8, 8], [1, 1], [15, 15]]) {
    await player.getByRole("button", { name: `Hàng ${row}, cột ${col}: trống`, exact: true }).click();
    await expect(player.locator(".board-topline h1")).not.toHaveText("Bot đang đi…", { timeout: 15000 });
  }
  await expect(player.locator("dialog[open]")).toBeVisible();
  await expect(player.locator(".answer-list button")).toHaveCount(4);
  // Regression: Tailwind's reset removed the UA dialog margin, placing it at 0,0.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await player.setViewportSize(viewport);
    const box = await player.locator("dialog[open]").boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(Math.abs(box!.y + box!.height / 2 - viewport.height / 2)).toBeLessThan(2);
    expect(box!.height).toBeLessThanOrEqual(viewport.height - 23);
  }
  await player.setViewportSize({ width: 390, height: 844 });
  const questionText = await player.locator("#quiz-title").textContent();
  const question = quizQuestions.find((q) => q.question === questionText)!;
  const correct = player.locator(".answer-list button").filter({ hasText: question.options[question.correctAnswerIndex] });
  await player.route("**/api/rooms", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await correct.click();
  await expect(correct).toHaveAttribute("aria-pressed", "true");
  await expect(player.getByText("Đã chọn đáp án · Đang kiểm tra…")).toBeVisible();
  await expect(player.locator(".quiz-feedback")).toBeVisible();
  await expect(player.locator(".history-event").filter({ hasText: "Trả lời đúng câu hỏi" })).toHaveCount(1);
  await player.screenshot({ path: "test-results/quiz-mobile.png", fullPage: true });
  await player.getByRole("button", { name: "Tiếp tục →" }).click();
  await expect(player.locator(".quiz-feedback")).toHaveCount(0);
  await player.locator(".mystery-card").first().click();
  await expect(player.locator(".mystery-card").first()).toHaveAttribute("aria-pressed", "true");
  await expect(player.locator(".card-reveal")).toBeVisible();
  const revealedTitle = await player.locator("#quiz-title").textContent();
  await player.reload();
  await expect(player.locator(".card-reveal")).toBeVisible();
  await expect(player.locator("#quiz-title")).toHaveText(revealedTitle!);
  await player.screenshot({ path: "test-results/card-reveal-mobile.png", fullPage: true });
  await player.getByRole("button", { name: /Đã hiểu ·/ }).click();
  await expect(player.locator("dialog[open]")).toHaveCount(0);
  await player.screenshot({ path: "test-results/play-mobile.png", fullPage: true });
  expect(await player.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await player.reload();
  await expect(player.locator(".game-board")).toBeVisible();
  expect(await player.locator(".piece-x").count()).toBe(3);
  await player2.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(player2.locator(".game-board")).toBeVisible();
  await player2.setViewportSize({ width: 844, height: 390 });
  await player2.screenshot({ path: "test-results/play-landscape.png", fullPage: true });
  expect(await player2.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Seed a completed game through the isolated test DB, then exercise the real
  // API and UI after reload. This adapter never points to production Supabase.
  const credential = await player2.evaluate(() => JSON.parse(sessionStorage.getItem("caro:session:v1")!));
  const headers = { Authorization: `Bearer ${credential.token}` };
  const current = await (await player2.request.get(`/api/rooms?code=${code}`, { headers })).json();
  const finishedGame = newGame(); finishedGame.stage = "round"; finishedGame.result = "lose";
  const saved = await host.request.post("http://127.0.0.1:54329/rest/v1/rpc/caro_commit", {
    headers: { apikey: "test-service-key" }, data: {
      p_code: code, p_token_hash: createHash("sha256").update(credential.token).digest("hex"),
      p_version: current.me.version, p_action_id: crypto.randomUUID(), p_state: finishedGame,
      p_stats: { score: 20, wins: 0, correct: 0, wrong: 0, moves: 12 }, p_target_id: null, p_effect: null, p_percent: 0,
    },
  });
  expect(saved.ok()).toBe(true);
  await player2.reload();
  await expect(player2.locator(".completed-notice")).toBeVisible();
  await expect(player2.locator(".game-board button:not(:disabled)")).toHaveCount(0);
  for (const type of ["next", "move"]) {
    const replay = await player2.request.post("/api/rooms", { headers, data: {
      action: "play", code, version: current.me.version + 1, actionId: crypto.randomUUID(), move: { type, row: 0, col: 0 },
    } });
    expect(replay.status()).toBe(400);
    expect((await replay.json()).error).toContain("lượt chơi duy nhất");
  }
  await player2.reload();
  await expect(player2.locator(".completed-notice")).toBeVisible();
  host.once("dialog", (dialog) => dialog.accept());
  await host.getByRole("button", { name: "Kết thúc & chốt điểm" }).click();
  await player.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(player.getByRole("heading", { name: "Cuộc đua đã khép lại." })).toBeVisible({ timeout: 20000 });
  await expect(player.locator(".game-board")).toHaveCount(0);
  expect(await player.evaluate(() => sessionStorage.getItem("caro:session:v1"))).toBeNull();
  await host.screenshot({ path: "test-results/results-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
  await c1.close(); await c2.close();
});

test("home, unauthenticated admin and direct play have no overflow or bypass", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/"); await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/play"); await expect(page.locator(".game-board")).toHaveCount(0);
  await page.goto("/admin"); await expect(page.getByLabel("Mật khẩu quản trò")).toBeVisible();
  const request = await page.request.post("/api/admin", { data: { action: "start", code: "123456" } });
  expect(request.status()).toBe(401);
});

test("private score history: two-sided stealing, observers, pagination and reduced motion", async ({ page: host, browser }) => {
  expect((await host.request.post("/api/admin", { data: { action:"login",password:"test-admin-password" } })).ok()).toBe(true);
  const created = await host.request.post("/api/admin", { data: { action:"create", title:"Caro Club · Đấu trường lớp học", duration:10,capacity:3,actionId:crypto.randomUUID() } });
  const code=(await created.json()).room.code;
  const a=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const b=await browser.newContext({viewport:{width:1440,height:1000}});
  const c=await browser.newContext();
  try {
    const actor=await a.newPage(), victim=await b.newPage(), observer=await c.newPage();
    await join(actor,code,"Minh Anh"); await join(victim,code,"Tuấn Hưng"); await join(observer,code,"Ngọc Hà");
    expect((await host.request.post("/api/admin", {data:{action:"start",code}})).ok()).toBe(true);
    const creds=await Promise.all([actor,victim].map(p=>p.evaluate(()=>JSON.parse(sessionStorage.getItem("caro:session:v1")!))));
    const positions=[[7,7,"X"],[7,8,"O"],[6,6,"X"],[8,8,"O"],[5,5,"X"]] as const;
    const board=newGame().board; positions.forEach(([r,c,mark])=>{board[r][c]=mark;});
    const actorState={...newGame(),board,roundMoves:5,stage:"target",targetCard:{kind:"steal",title:"Cướp 50%",value:50}};
    for(const [i,credential] of creds.entries()) {
      const seed=await host.request.post("http://127.0.0.1:54329/rest/v1/rpc/caro_commit",{headers:{apikey:"test-service-key"},data:{
        p_code:code,p_token_hash:createHash("sha256").update(credential.token).digest("hex"),p_version:0,p_action_id:crypto.randomUUID(),
        p_state:i===0?actorState:{...newGame(),board},p_stats:{score:i===0?180:320,wins:0,correct:2,wrong:0,moves:5},p_target_id:null,p_effect:null,p_percent:0,
      }});
      expect(seed.ok()).toBe(true);
    }
    await actor.reload(); await victim.reload(); await observer.reload();
    await actor.locator(".rank-list li").filter({hasText:"Tuấn Hưng"}).getByRole("button").click();
    const ownText="Bạn đã cướp 160 điểm từ Tuấn Hưng";
    const victimText="Minh Anh đã cướp 160 điểm của bạn";
    await expect(actor.locator(".history-event")).toContainText(ownText);
    await expect(actor.locator(".history-event .event-delta")).toContainText("+160");
    await victim.getByRole("button",{name:"Làm mới",exact:true}).click();
    await expect(victim.locator(".history-event")).toContainText(victimText);
    await expect(victim.locator(".history-event .event-delta")).toContainText("−160");
    await expect(victim.locator(".score-number")).toHaveText("160");
    await observer.getByRole("button",{name:"Làm mới",exact:true}).click();
    await expect(observer.locator(".history-event")).toHaveCount(0);
    await expect(observer.locator(".history-empty")).toBeVisible();
    const publicSnapshot=await (await host.request.get(`/api/rooms?code=${code}`)).json();
    expect(publicSnapshot.me).toBeNull();
    expect(publicSnapshot.players.every((p:Record<string,unknown>)=>!("history" in p))).toBe(true);
    expect((await host.request.get(`/api/rooms?code=${code}&historyBefore=99999`)).status()).toBe(401);
    await victim.reload(); await expect(victim.locator(".history-event")).toContainText(victimText);
    await victim.screenshot({path:"test-results/history-desktop.png",fullPage:true});
    await actor.screenshot({path:"test-results/history-mobile.png",fullPage:true});
    await victim.setViewportSize({width:360,height:800});
    expect(await victim.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await victim.emulateMedia({reducedMotion:"reduce"});
    expect(await victim.locator(".score-number").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
    for(let i=0;i<22;i++) {
      const seeded=await host.request.post("http://127.0.0.1:54329/rest/v1/rpc/caro_commit_v2",{headers:{apikey:"test-service-key"},data:{
        p_code:code,p_token_hash:createHash("sha256").update(creds[1].token).digest("hex"),p_version:2+i,p_action_id:crypto.randomUUID(),
        p_state:newGame(),p_stats:{score:161+i,wins:0,correct:2,wrong:0,moves:5},p_target_id:null,p_effect:null,p_percent:0,
      }});
      expect(seeded.ok()).toBe(true);
    }
    await victim.getByRole("button",{name:"Làm mới",exact:true}).click();
    await expect(victim.locator(".history-event")).toHaveCount(20);
    await victim.getByRole("button",{name:"Xem 20 sự kiện cũ hơn ↓"}).click();
    await expect(victim.locator(".history-event")).toHaveCount(3);
    await expect(victim.locator(".score-history")).toContainText(victimText);
    await victim.getByRole("button",{name:"Về mới nhất"}).click();
    await expect(victim.locator(".history-event")).toHaveCount(20);
  } finally { await a.close(); await b.close(); await c.close(); }
});
