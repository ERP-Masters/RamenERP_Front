// src/api/items.ts
import { buildHeaders } from "@/api/_http";

type UseState = "USED" | "NOTUSED";

/** 미사용 목록: GET /api/items/state?state=NOTUSED */
export async function fetch_items_notused(): Promise<any[]> {
  const url = `/api/items/state?state=NOTUSED`;

  const res = await fetch(url, { headers: buildHeaders("GET") });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    return [];
  }

  if (!text) return [];

  const j = JSON.parse(text);
  return Array.isArray(j) ? j : j?.items ?? j?.data ?? [];
}

/** 사용 목록: GET /api/items/state?state=USED (필요시) */
export async function fetch_items_used(): Promise<any[]> {
  const url = `/api/items/state?state=USED`;

  const res = await fetch(url, { headers: buildHeaders("GET") });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${text || ""}`.trim());
  }

  if (!text) return [];
  const j = JSON.parse(text);

  return Array.isArray(j) ? j : j?.items ?? j?.data ?? [];
}

/**
 * 상태 전환:
 * PUT /api/items/changestate/:id
 * body { state: "USED" | "NOTUSED" }
 */
export async function change_item_use_state(
  id: number,
  next: UseState,
): Promise<boolean> {
  const url = `/api/items/changestate/${id}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: buildHeaders("PUT"),
    body: JSON.stringify({ state: next }),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`PUT ${url} → ${res.status} ${text || ""}`.trim());
  }

  return true;
}

export default {
  fetch_items_notused,
  fetch_items_used,
  change_item_use_state,
};
