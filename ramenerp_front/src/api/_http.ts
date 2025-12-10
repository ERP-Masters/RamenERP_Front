// src/api/_http.ts
import { get_access_token } from "@/auth/auth_session";

export function buildHeaders(method = "GET", extra?: HeadersInit): Headers {
  const h = new Headers();

  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    h.set("Content-Type", "application/json");
  }

  if (extra) {
    const extra_headers = new Headers(extra);
    extra_headers.forEach((v, k) => {
      h.set(k, v);
    });
  }

  const access_token = get_access_token();
  if (access_token && !h.has("Authorization")) {
    h.set("Authorization", `Bearer ${access_token}`);
  }

  return h;
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";

  const res = await fetch(url, {
    ...init,
    headers: buildHeaders(method, init?.headers),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}
