import type { PlayerCredential } from "./sessionTypes";

export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(url: string, body?: unknown, credential?: PlayerCredential | null, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(url, { method: body ? "POST" : "GET", cache: "no-store", signal: controller.signal,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(credential ? { Authorization: `Bearer ${credential.token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new RequestError(data.error || "Không thực hiện được thao tác.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    if (signal?.aborted) throw error;
    throw new RequestError("Kết nối bị gián đoạn. Kiểm tra mạng và thử lại.", 0);
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
