// src/api/_http.ts

import { get_access_token } from "@/auth/auth_session";

/* ---------------- 헤더 유틸 ---------------- */

function apply_init_headers(target: Headers, init_headers?: HeadersInit) {
  if (!init_headers) return;

  if (init_headers instanceof Headers) {
    init_headers.forEach((value, key) => target.set(key, value));
    return;
  }

  if (Array.isArray(init_headers)) {
    for (const [key, value] of init_headers) {
      target.set(key, value);
    }
    return;
  }

  for (const [key, value] of Object.entries(init_headers)) {
    if (typeof value !== "undefined") {
      target.set(key, String(value));
    }
  }
}

export function buildHeaders(method = "GET", init_headers?: HeadersInit): Headers {
  const headers = new Headers();

  headers.set("Accept", "application/json");

  if (method !== "GET" && method !== "HEAD") {
    headers.set("Content-Type", "application/json");
  }

  // ✅ 토큰 자동 주입
  const access_token = get_access_token();
  if (access_token) {
    headers.set("Authorization", `Bearer ${access_token}`);
  }

  // ✅ 호출부에서 추가한 헤더가 있으면 병합
  apply_init_headers(headers, init_headers);

  return headers;
}

/* ---------------- 공통 fetch ---------------- */

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method || "GET";

  const headers = buildHeaders(method, init?.headers);

  const res = await fetch(url, { ...init, headers });

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
