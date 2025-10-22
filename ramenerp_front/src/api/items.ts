// src/api/items.ts
type UseState = "USED" | "NOTUSED";

function buildHeaders(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") h.set("Content-Type", "application/json");
  return h;
}

/** 미사용 목록: GET /api/items/state?state=NOTUSED */
export async function fetch_items_notused(): Promise<any[]> {
  const url = `/api/items/state?state=NOTUSED`;
  const res = await fetch(url, { headers: buildHeaders("GET") });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${text || ""}`.trim());
  if (!text) return [];
  const j = JSON.parse(text);
  // 서버가 배열을 주면 그대로, {items:[]}면 items 사용
  return Array.isArray(j) ? j : j?.items ?? [];
}

/** 사용 목록: GET /api/items/state?state=USED (필요 시) */
export async function fetch_items_used(): Promise<any[]> {
  const url = `/api/items/state?state=USED`;
  const res = await fetch(url, { headers: buildHeaders("GET") });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${text || ""}`.trim());
  if (!text) return [];
  const j = JSON.parse(text);
  return Array.isArray(j) ? j : j?.items ?? [];
}

/** 상태 전환: PATCH /api/items/:id/state  (body: { state: "USED" | "NOTUSED" }) */
export async function change_item_use_state(id: number, next: UseState): Promise<boolean> {
  const url = `/api/items/${id}/state`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: buildHeaders("PATCH"),
    body: JSON.stringify({ state: next }),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH ${url} → ${res.status} ${text || ""}`.trim());
  }
  return true;
}

export default {
  fetch_items_notused,
  fetch_items_used,
  change_item_use_state,
};
