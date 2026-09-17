// Test-only PostgREST adapter backed by real PostgreSQL (PGlite). Never used by the app.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
async function initialize() {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(readFileSync(new URL("../../supabase/01-session-game.sql", import.meta.url), "utf8"));
  await db.exec(readFileSync(new URL("../../supabase/02-private-score-history.sql", import.meta.url), "utf8"));
}
const functions: Record<string, string[]> = {
  caro_rate_limit: ["p_key", "p_limit", "p_seconds"], caro_join: ["p_code", "p_name", "p_token_hash", "p_state"],
  caro_snapshot: ["p_code", "p_token_hash"], caro_room_control: ["p_code", "p_action", "p_player_id"],
  caro_commit: ["p_code", "p_token_hash", "p_version", "p_action_id", "p_state", "p_stats", "p_target_id", "p_effect", "p_percent"],
  caro_commit_v2: ["p_code", "p_token_hash", "p_version", "p_action_id", "p_state", "p_stats", "p_target_id", "p_effect", "p_percent"],
  caro_history: ["p_code", "p_token_hash", "p_before"],
};
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname === "/health") { res.end('{"ok":true}'); return; }
  if (req.headers.apikey !== "test-service-key") { res.statusCode = 403; res.end('{"error":"test only"}'); return; }
  try {
    let text = ""; for await (const chunk of req) text += chunk;
    const body = text ? JSON.parse(text) : {};
    let result: unknown;
    if (url.pathname.includes("/rpc/")) {
      const name = url.pathname.split("/").at(-1)!;
      const params = functions[name]; if (!params) throw new Error("Unknown RPC");
      const values = params.map((key) => typeof body[key] === "object" && body[key] !== null ? JSON.stringify(body[key]) : body[key] ?? null);
      const query = await db.query<{ result: unknown }>(`select ${name}(${params.map((_, i) => `$${i+1}`).join(",")}) as result`, values);
      result = query.rows[0].result;
    } else if (url.pathname === "/rest/v1/caro_rooms") {
      if (req.method === "POST") {
        const query = await db.query("insert into caro_rooms(id,code,title,duration_minutes,capacity) values($1,$2,$3,$4,$5) returning *", [body.id, body.code, body.title, body.duration_minutes, body.capacity]);
        result = query.rows[0];
      } else {
        const id = url.searchParams.get("id")?.replace("eq.", "");
        const query = await db.query(id ? "select * from caro_rooms where id=$1" : "select * from caro_rooms order by created_at desc limit 30", id ? [id] : []);
        result = req.headers.accept?.includes("vnd.pgrst.object") ? query.rows[0] ?? null : query.rows;
      }
    } else throw new Error("Unknown path");
    res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 400;
    const error = e as Error & { code?: string };
    res.end(JSON.stringify({ message: error.message, code: error.code || "P0001" }));
  }
});
void initialize().then(() => server.listen(54329, "127.0.0.1", () => console.log("Test database ready")));
process.on("SIGTERM", () => server.close(() => { void db.close(); }));
