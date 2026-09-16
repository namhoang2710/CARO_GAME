import { test, expect, type Page } from "@playwright/test";

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
    await expect(player.locator(".board-topline h1")).not.toHaveText("Bot đang nghĩ…", { timeout: 15000 });
  }
  await expect(player.locator("dialog[open]")).toBeVisible();
  await expect(player.locator(".answer-list button")).toHaveCount(4);
  await player.locator(".answer-list button").first().click();
  await expect(player.locator(".quiz-feedback")).toBeVisible();
  await player.screenshot({ path: "test-results/quiz-mobile.png", fullPage: true });
  await player.getByRole("button", { name: "Tiếp tục →" }).click();
  await expect(player.locator(".quiz-feedback")).toHaveCount(0);
  if (await player.locator(".mystery-card").first().isVisible()) {
    await player.locator(".mystery-card").first().click();
    await expect(player.locator("dialog[open]")).toHaveCount(0);
  }
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
