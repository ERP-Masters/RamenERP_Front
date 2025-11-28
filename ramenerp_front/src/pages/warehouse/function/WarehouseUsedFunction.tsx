// src/pages/WarehouseUsedFunction.tsx
// 창고 isused 상태(USED / NOTUSED) 변경 전용 유틸

export type WarehouseState = "USED" | "NOTUSED";

/** 요청에 사용할 타입: PK id + 바꿀 상태값 */
export type WarehouseStateTarget = {
  /** 내부 DB PK (숫자) */
  id: number;
  isused: WarehouseState;
};

export type ApiWarehouse = {
  /** 내부 DB PK */
  id?: number;
  /** 화면에 표시되는 ID 문자열 (예: "WH_SEOUL_0001") */
  warehouse_id: string | number;
  name: string;
  location: string;
  created_at?: string;
  isused?: WarehouseState | null;
};

const WH_API = "/api/warehouses/";

/* ─────────────────────────────
 * 공통: 안전 JSON 파싱
 * ───────────────────────────── */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/* ─────────────────────────────
 * PUT /api/warehouses/changestate/:id
 *  - pk id 로만 요청
 *  - state(USED/NOTUSED) 값만 변경
 * ───────────────────────────── */
export async function putWarehouseState(
  data: WarehouseStateTarget
): Promise<ApiWarehouse> {
  const { id, isused } = data;

  const pk_id = Number(id);
  if (!Number.isFinite(pk_id)) {
    throw new Error("잘못된 창고 PK(id) 입니다. (숫자형 id 필요)");
  }

  const res = await fetch(`${WH_API}changestate/${pk_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // 🔽 명세에 맞게 field 이름은 state 로 보냄
    body: JSON.stringify({ state: isused }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) {
      throw new Error(`창고(id=${pk_id})를 찾을 수 없습니다.`);
    }
    throw new Error(msg);
  }

  // 204(No Content) 대응
  return text
    ? (JSON.parse(text) as ApiWarehouse)
    : ({
        id: pk_id,
        warehouse_id: "",
        name: "",
        location: "",
        created_at: "",
        isused,
      } as ApiWarehouse);
}

/* ─────────────────────────────
 * 단일 창고를 USED 로 전환
 *  - 호출부는 항상 숫자형 id 를 넘긴다.
 * ───────────────────────────── */
export async function markWarehouseUsed(id: number): Promise<void> {
  await putWarehouseState({ id, isused: "USED" });
  // 메인/미사용 화면 동기화용 이벤트
  window.dispatchEvent(new Event("warehouse:used:restored"));
}

/* ─────────────────────────────
 * 여러 창고를 한 번에 USED 전환
 *  - ids: 1,2,3 같은 숫자형 PK 배열
 * ───────────────────────────── */
export async function markManyWarehousesUsed(ids: number[]): Promise<void> {
  const normalized = ids
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (normalized.length === 0) {
    throw new Error("선택된 창고가 없습니다. (숫자형 id 필요)");
  }

  await Promise.all(normalized.map((id) => markWarehouseUsed(id)));
}
