// src/api/items.ts
type UseState = "USED" | "NOTUSED";

function buildHeaders(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    h.set("Content-Type", "application/json");
  }
  return h;
}

/** 미사용 목록: GET /api/items/state?state=NOTUSED
 *  (백엔드 쪽에서 실제로는 @Get('state') findNotUsedItem() 이고
 *   내부에서 NOTUSED만 주는지, 혹은 전체 준 뒤 필터링하는지 살짝 애매하지만
 *   기존 코드와 호환 유지)
 */
export async function fetch_items_notused(): Promise<any[]> {
  // 우선 /api/items/state?state=NOTUSED 시도
  {
    const url = `/api/items/state?state=NOTUSED`;
    const res = await fetch(url, { headers: buildHeaders("GET") });
    const text = await res.text().catch(() => "");
    if (res.ok) {
      if (!text) return [];
      const j = JSON.parse(text);
      return Array.isArray(j) ? j : j?.items ?? [];
    }
  }

  // fallback: /items/state?isused=NOTUSED 같은 형태에 맞춰보고 싶으면
  // 여기서 추가로 시도해도 되지만 현재는メ인 경로만 유지
  return [];
}

/** 사용 목록: GET /api/items/state?state=USED (필요시) */
export async function fetch_items_used(): Promise<any[]> {
  const url = `/api/items/state?state=USED`;
  const res = await fetch(url, { headers: buildHeaders("GET") });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${text || ""}`.trim());
  if (!text) return [];
  const j = JSON.parse(text);
  return Array.isArray(j) ? j : j?.items ?? [];
}

/**
 * 상태 전환:
 * 백엔드 라우트는 @Put('changestate/:id')
 * 즉 URL은 /items/changestate/:id
 * 메서드 PUT
 * 바디 { state: "USED" | "NOTUSED" }
 *
 * 프론트 쪽은 /api 프록시를 타고 간다고 가정해서
 * 실제 호출 경로를 /api/items/changestate/:id 로 맞춰준다.
 */
export async function change_item_use_state(id: number, next: UseState): Promise<boolean> {
  const url = `/api/items/changestate/${id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: buildHeaders("PUT"),
    body: JSON.stringify({ state: next }),
  });
  const text = await res.text().catch(() => "");
  // Nest 기본응답: 200 OK { message: "...", item: {...} }
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
