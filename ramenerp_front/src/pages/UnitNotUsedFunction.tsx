// src/pages/UnitNotUsedFunction.tsx
// 단위 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type UnitState = "USED" | "NOTUSED";

export type ApiUnit = {
  /** 화면표시용(문자열 가능) */
  unit_id: number | string;
  /** DB PK (숫자) — 서버가 내려주는 값 */
  id?: number;
  code: string;
  name: string;
  isused?: string | null;
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 아래 fetch에서 파생 생성) */
  display_unit_id: string;
};

const UNIT_API = "/api/units";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 단위를 미사용으로 전환
 * - 요청은 항상 숫자형 PK id 사용
 * - PUT /api/units/changestate/:id
 * - body: { state: "NOTUSED" }
 * - 성공 시 'unit:notused:updated' 이벤트 브로드캐스트
 */
export async function markUnitNotUsed(id: number): Promise<void> {
  const pk = Number(id);
  if (!Number.isFinite(pk)) {
    throw new Error("잘못된 단위 PK(id) 입니다.");
  }

  const res = await fetch(`${UNIT_API}/changestate/${encodeURIComponent(pk)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ state: "NOTUSED" as UnitState }),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 화면 갱신용 신호
  window.dispatchEvent(new Event("unit:notused:updated"));
}

/**
 * 미사용(NOTUSED) 상태의 단위 목록 조회
 * - GET /units/state
 * - 화면 표시를 위해 display_unit_id(문자열) 보강
 */
export async function fetchNotUsedUnits(): Promise<ApiUnit[]> {
  const res = await fetch(`${UNIT_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiUnit[] | { items?: any[] }>(res);
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

  // display_unit_id 보강 (문자열 ID)
  const list: ApiUnit[] = raw.map((u: any) => {
    const display =
      (typeof u?.display_unit_id === "string" && u.display_unit_id) ||
      (typeof u?.unit_id === "string" && u.unit_id) ||
      (typeof u?.id === "string" && u.id) ||
      String(u?.unit_id ?? "");

    return {
      unit_id: u?.unit_id as any,
      id: typeof u?.id === "number" ? u.id : undefined,
      display_unit_id: display,
      code: String(u?.code ?? "").trim(),
      name: String(u?.name ?? "").trim(),
      isused: u?.isused ?? null,
    } as ApiUnit;
  });

  return list;
}
