// src/pages/WarehouseNotUsedFunction.tsx
// 창고 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type WarehouseState = "USED" | "NOTUSED";

export type ApiWarehouse = {
  /** 화면표시용(문자열 가능) */
  warehouse_id: number | string;
  /** DB PK (숫자) — 서버가 내려주는 값 */
  id?: number;
  name: string;
  location: string;
  isused?: string | null;
  created_at: string;
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 아래 fetch에서 파생 생성) */
  display_warehouse_id: string;
};

const WH_API = "/api/warehouses";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 창고를 미사용으로 전환
 * - 요청은 항상 숫자형 PK id 사용
 * - PUT /api/warehouses/changestate/:id
 * - body: { state: "NOTUSED" }
 * - 성공 시 'warehouse:notused:updated' 이벤트 브로드캐스트
 */
export async function markWarehouseNotUsed(id: number): Promise<void> {
  const pk = Number(id);
  if (!Number.isFinite(pk)) {
    throw new Error("잘못된 창고 PK(id) 입니다.");
  }

  const res = await fetch(`${WH_API}/changestate/${encodeURIComponent(pk)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ state: "NOTUSED" as WarehouseState }),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 화면 갱신용 신호
  window.dispatchEvent(new Event("warehouse:notused:updated"));
}

/**
 * 미사용(NOTUSED) 상태의 창고 목록 조회
 * - GET /warehouses/state
 * - 화면 표시를 위해 display_warehouse_id(문자열) 보강
 */
export async function fetchNotUsedWarehouses(): Promise<ApiWarehouse[]> {
  const res = await fetch(`${WH_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiWarehouse[] | { items?: any[] }>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] =
    Array.isArray(data)
      ? (data as any[])
      : data && Array.isArray((data as any).items)
      ? (data as any).items
      : [];

  // display_warehouse_id 보강 (문자열 ID)
  const list: ApiWarehouse[] = raw.map((w: any) => {
    const display =
      (typeof w?.display_warehouse_id === "string" && w.display_warehouse_id) ||
      (typeof w?.warehouse_id === "string" && w.warehouse_id) ||
      (typeof w?.id === "string" && w.id) ||
      String(w?.warehouse_id ?? "");

    return {
      warehouse_id: w?.warehouse_id as any,
      id: typeof w?.id === "number" ? w.id : undefined,
      display_warehouse_id: display,
      name: String(w?.name ?? "").trim(),
      location: String(w?.location ?? "").trim(),
      isused: w?.isused ?? null,
      created_at: String(w?.created_at ?? "").trim(),
    } as ApiWarehouse;
  });

  return list;
}
