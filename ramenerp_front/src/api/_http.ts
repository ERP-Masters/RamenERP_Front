// src/api/_http.ts
export function buildHeaders(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") h.set("Content-Type", "application/json");
  return h;
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: buildHeaders(init?.method || "GET") });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try { const j = text ? JSON.parse(text) : null; throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}
