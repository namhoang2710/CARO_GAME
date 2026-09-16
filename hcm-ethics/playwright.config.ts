import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e", timeout: 90000, workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3100", channel: "chrome", headless: true, screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: [
    { command: "npx tsx tests/support/database-server.ts", url: "http://127.0.0.1:54329/health", reuseExistingServer: false, timeout: 30000 },
    { command: "npm run dev -- --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 90000,
      env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "test-service-key", ADMIN_PASSWORD: "test-admin-password", LEADERBOARD_CLEAR_PASSWORD: "test-admin-password" } },
  ],
});
