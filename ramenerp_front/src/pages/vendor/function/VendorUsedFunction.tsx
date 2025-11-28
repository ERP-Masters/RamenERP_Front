// src/pages/VendorUsedFunction.tsx
// 거래처 isused 상태(USED / NOTUSED) 변경 전용 유틸

export type VendorState = "USED" | "NOTUSED";

/** 요청에 사용할 타입: PK id + 바꿀 상태값 */
export type VendorStateTarget = {
  /** 내부 DB PK (숫자) */
  id: number;
  isused: VendorState;
};

export type ApiVendor = {
  /** 내부 DB PK */
  id?: number;
  /** 화면에 표시되는 ID 문자열 (예: "VD_SEOUL_0001") */
  vendor_id: number | string;
  name: string;
  manager: string;
  contact: string;
  address: string;
  created_at?: string;
  isused?: VendorState | null;
};

const VD_API = "/api/vendors";

/* ─────────────────────────────
 * 공통: 안전 JSON 파싱
 * ───────────────────────────── */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/* ─────────────────────────────
 * PUT /api/vendors/:id
 *  - pk id 로만 요청
 *  - isused 상태값만 변경
 * ───────────────────────────── */
export async function putVendorState(
  data: VendorStateTarget
): Promise<ApiVendor> {
  const { id, isused } = data;

  const pk_id = Number(id);
  if (!Number.isFinite(pk_id)) {
    throw new Error("잘못된 거래처 PK(id) 입니다. (숫자형 id 필요)");
  }

  const res = await fetch(`${VD_API}/${pk_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ isused }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) {
      throw new Error(`거래처(id=${pk_id})를 찾을 수 없습니다.`);
    }
    throw new Error(msg);
  }

  // 204(No Content) 대응
  return text
    ? (JSON.parse(text) as ApiVendor)
    : ({
        id: pk_id,
        vendor_id: "", // 화면용 ID는 응답이 있을 때 사용
        name: "",
        manager: "",
        contact: "",
        address: "",
        isused,
      } as ApiVendor);
}

/* ─────────────────────────────
 * 단일 거래처를 USED 로 전환
 *  - 호출부는 항상 숫자형 id 를 넘긴다.
 * ───────────────────────────── */
export async function markVendorUsed(id: number): Promise<void> {
  await putVendorState({ id, isused: "USED" });
  // 메인/미사용 화면 동기화용 이벤트
  window.dispatchEvent(new Event("vendor:used:restored"));
}

/* ─────────────────────────────
 * 여러 거래처를 한 번에 USED 전환
 *  - ids: 1,2,3 같은 숫자형 PK 배열
 * ───────────────────────────── */
export async function markManyVendorsUsed(ids: number[]): Promise<void> {
  const normalized = ids
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (normalized.length === 0) {
    throw new Error("선택된 거래처가 없습니다. (숫자형 id 필요)");
  }

  await Promise.all(normalized.map((id) => markVendorUsed(id)));
}
