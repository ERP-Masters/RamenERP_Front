// src/pages/UnitUsedFunction.tsx
// 단위 isused 상태(USED / NOTUSED) 변경 전용 유틸

export type UnitState = "USED" | "NOTUSED";

/** 요청에 사용할 타입: PK id + 바꿀 상태값 */
export type UnitStateTarget = {
  /** 내부 DB PK (숫자) */
  id: number;
  isused: UnitState;
};

export type ApiUnit = {
  /** 내부 DB PK */
  id?: number;
  /** 화면에 표시되는 ID 문자열 (예: "UNIT_0001") */
  unit_id: string | number;
  code: string;
  name: string;
  isused?: UnitState | null;
};

const UNIT_API = "/api/units/";

/* ─────────────────────────────
 * 공통: 안전 JSON 파싱
 * ───────────────────────────── */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/* ─────────────────────────────
 * PUT /api/units/changestate/:id
 *  - pk id 로만 요청
 *  - state(USED/NOTUSED) 값만 변경
 * ───────────────────────────── */
export async function putUnitState(
  data: UnitStateTarget
): Promise<ApiUnit> {
  const { id, isused } = data;

  const pk_id = Number(id);
  if (!Number.isFinite(pk_id)) {
    throw new Error("잘못된 단위 PK(id) 입니다. (숫자형 id 필요)");
  }

  const res = await fetch(`${UNIT_API}changestate/${pk_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // 명세: field 이름은 state
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
      throw new Error(`단위(id=${pk_id})를 찾을 수 없습니다.`);
    }
    throw new Error(msg);
  }

  // 204(No Content) 대응
  return text
    ? (JSON.parse(text) as ApiUnit)
    : ({
        id: pk_id,
        unit_id: "",
        code: "",
        name: "",
        isused,
      } as ApiUnit);
}

/* ─────────────────────────────
 * 단일 단위를 USED 로 전환
 *  - 호출부는 항상 숫자형 id 를 넘긴다.
 * ───────────────────────────── */
export async function markUnitUsed(id: number): Promise<void> {
  await putUnitState({ id, isused: "USED" });
  // 메인/미사용 화면 동기화용 이벤트
  window.dispatchEvent(new Event("unit:used:restored"));
}

/* ─────────────────────────────
 * 여러 단위를 한 번에 USED 전환
 *  - ids: 1,2,3 같은 숫자형 PK 배열
 * ───────────────────────────── */
export async function markManyUnitsUsed(ids: number[]): Promise<void> {
  const normalized = ids
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (normalized.length === 0) {
    throw new Error("선택된 단위가 없습니다. (숫자형 id 필요)");
  }

  await Promise.all(normalized.map((id) => markUnitUsed(id)));
}
