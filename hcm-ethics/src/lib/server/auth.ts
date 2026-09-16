import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ApiError, checkDatabase, database } from "./database";

const COOKIE = "caro_admin";
const AGE = 12 * 60 * 60;
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function secret() {
  const value = process.env.ADMIN_PASSWORD?.trim() || process.env.LEADERBOARD_CLEAR_PASSWORD?.trim();
  if (!value) throw new ApiError("Chưa cấu hình ADMIN_PASSWORD trên server.", 503);
  return value;
}
function sign(value: string) { return createHmac("sha256", secret()).update(`caro-admin-v1:${value}`).digest("hex"); }
function equal(a: string, b: string) {
  const first = Buffer.from(tokenHash(a));
  return timingSafeEqual(first, Buffer.from(tokenHash(b)));
}
export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  return Number(expires) > Date.now() && Number(expires) <= Date.now() + AGE * 1000 && Boolean(signature) && equal(signature, sign(expires));
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new ApiError("Hãy đăng nhập tài khoản quản trò.", 401);
}
export async function limitRequest(key: string, limit: number, seconds: number) {
  const { data, error } = await database().rpc("caro_rate_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  checkDatabase(error);
  if (!data) throw new ApiError("Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.", 429);
}
export async function adminLogin(password: unknown, request: Request) {
  const expected = secret();
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local";
  await limitRequest(`login:${tokenHash(ip)}`, 10, 60);
  if (typeof password !== "string" || !equal(password.trim(), expected)) throw new ApiError("Mật khẩu quản trò chưa đúng.", 403);
  const expires = String(Date.now() + AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, { httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production", maxAge: AGE });
}
export async function adminLogout() { (await cookies()).delete(COOKIE); }
export function playerToken(request: Request) {
  const value = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new ApiError("Phiên tham gia không hợp lệ. Hãy nhập mã phòng lại.", 401);
  return tokenHash(value);
}
